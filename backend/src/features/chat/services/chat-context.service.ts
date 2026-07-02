import VectorService from "../../vector/services/vector.service";
import SystemPromptTemplates from "../system-prompt-templates";
import { logger } from "../../../utils/logger";
import { searchConfig } from "../../../config/search.config";

/**
 * Service responsible for context retrieval and system prompt generation during chat.
 * Uses pure dense semantic search via Pinecone Inference API.
 */
class ChatContextService {
  private vectorService = new VectorService();

  /**
   * Preprocess complex queries to extract key search terms for better retrieval.
   * Limited to 2 queries max (original + 1 variation) to cap Pinecone API calls.
   */
  private preprocessQueryForSearch(query: string): string[] {
    const originalQuery = query.trim();
    const searchQueries = [originalQuery];

    // Extract key terms from common question patterns
    const questionPatterns = [
      /what is ([^?]+?)(?:\s+and\s+|\?|$)/i,
      /who are ([^?]+?)(?:\?|$)/i,
      /what are ([^?]+?)(?:\?|$)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)'s\s+([^?]+?)(?:\s+and\s+|\?|$)/i,
    ];

    let extractedTerms: string[] = [];

    for (const pattern of questionPatterns) {
      const match = originalQuery.match(pattern);
      if (match && match[1]) {
        let terms = match[1].trim();
        if (match[2]) {
          terms += ` ${match[2].trim()}`;
        }
        const cleanedTerms = terms
          .split(/\s+(?:and|or|with|for|in|of|by|to|from)\s+/i)
          .map(term => term.trim())
          .filter(term => term.length > 2);
        extractedTerms.push(...cleanedTerms);
      }
    }

    // Extract proper nouns
    const properNounMatches = originalQuery.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g);
    if (properNounMatches) {
      extractedTerms.push(...properNounMatches);
    }

    // Extract key business terms
    const businessTerms = originalQuery.match(/\b(market share|competitors|partnerships|collaborations|university|corporation|company|technology|product|service|platform|strategic partnerships)\b/gi);
    if (businessTerms) {
      extractedTerms.push(...businessTerms);
    }

    // Remove duplicates and stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'their', 'they', 'them', 'this', 'that', 'these', 'those', 'what', 'who', 'how', 'when', 'where', 'why']);

    extractedTerms = [...new Set(extractedTerms)]
      .filter(term => !stopWords.has(term.toLowerCase()))
      .filter(term => term.length > 2);

    if (extractedTerms.length >= 2) {
      // Add one pairwise combination of the top two terms
      searchQueries.push(`${extractedTerms[0]} ${extractedTerms[1]}`);
    } else if (extractedTerms.length === 1) {
      searchQueries.push(extractedTerms[0]);
    }

    // Limit to 2 queries max
    return searchQueries.slice(0, 2);
  }

  /**
   * Remove duplicate search results — deduplicates by vector ID (exact) then
   * falls back to first-200-chars text match. Keeps highest-scoring result.
   */
  private deduplicateSearchResults(results: any[]): any[] {
    const seenIds = new Set<string>();
    const seenText = new Map<string, any>();

    // First pass: deduplicate by ID (exact, reliable)
    const idDeduped = results.filter(r => {
      if (r.id && seenIds.has(r.id)) return false;
      if (r.id) seenIds.add(r.id);
      return true;
    });

    // Second pass: deduplicate by text content, keeping highest score
    for (const result of idDeduped) {
      const key = result.text?.substring(0, 200).toLowerCase().trim();
      if (key && (!seenText.has(key) || result.score > seenText.get(key).score)) {
        seenText.set(key, result);
      }
    }

    return Array.from(seenText.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Retrieve relevant context for a user query using semantic dense search.
   */
  public async getRelevantContext(
    query: string,
    userId: number,
    agentId: number,
    sourceSelection?: string
  ): Promise<{ contextText: string; contextSources: any[] }> {
    try {
      // Early exit for very short queries
      if (query.length < searchConfig.global.minQueryLength) {
        return { contextText: "", contextSources: [] };
      }

      // Only proceed if vector store is ready
      const hasVectors = await this.vectorService.areVectorsAvailable(userId, agentId);
      if (!hasVectors) {
        return { contextText: "", contextSources: [] };
      }

      // Preprocess query into up to 2 search queries
      const searchQueries = this.preprocessQueryForSearch(query);
      logger.info(`🔍 Query "${query.substring(0, 60)}" → ${searchQueries.length} search terms`);

      // Run all sub-queries concurrently
      const searchPromises = searchQueries.map(async (searchQuery) => {
        const results = await this.vectorService.searchSimilar(
          searchQuery,
          userId,
          agentId,
          {
            topK: searchConfig.layers.chat.vectorSearch.topK,
            includeMetadata: true,
            minSimilarity: searchConfig.layers.chat.vectorSearch.minSimilarity,
            sourceType: sourceSelection && sourceSelection !== 'auto' ? sourceSelection : undefined,
          }
        );
        return results.map(r => ({ ...r, sourceQuery: searchQuery }));
      });

      const resultsArrays = await Promise.all(searchPromises);
      const allResults = resultsArrays.flat();
      const uniqueResults = this.deduplicateSearchResults(allResults);

      if (!uniqueResults?.length) {
        return { contextText: "", contextSources: [] };
      }

      // Build context from top results
      const contextParts: string[] = [];
      const contextSources: any[] = [];

      for (const result of uniqueResults.slice(0, searchConfig.layers.chat.context.maxResultsToUse)) {
        if (result.text && result.text.length > 0) {
          contextParts.push(result.text);
          contextSources.push({
            score: result.score,
            sourceId: result.metadata?.sourceId,
            chunkIndex: result.metadata?.chunkIndex,
            text: result.text?.substring(0, searchConfig.layers.chat.context.textPreviewLength) + "...",
            documentTitle: result.metadata?.documentTitle,
            sectionTitle: result.metadata?.sectionTitle,
            chunkPosition: result.metadata?.chunkPosition,
            sourceQuery: result.sourceQuery,
          });
        }
      }

      // Join and limit by configured character count
      const context = contextParts.join("\n\n").substring(0, searchConfig.layers.chat.context.maxContextChars);

      if (context) {
        logger.info(`🎯 Context assembled: ${context.length} chars from ${contextSources.length} chunks`);
      }

      return { contextText: context, contextSources };
    } catch (error) {
      logger.warn(`⚠️ Context search failed, continuing without context:`, error);
      return { contextText: "", contextSources: [] };
    }
  }

  /**
   * Generate enhanced system prompt based on context and intent.
   */
  public generateEnhancedSystemPrompt(
    basePrompt: string,
    hasContext: boolean,
    availableTopics: string[],
    isGreeting: boolean,
    context?: string
  ): string {
    if (isGreeting) {
      return basePrompt;
    }

    if (!hasContext && availableTopics.length === 0) {
      return SystemPromptTemplates.generateNoSourcesPrompt(basePrompt);
    }

    let enhancedPrompt = SystemPromptTemplates.generateSystemPrompt(basePrompt);

    if (availableTopics.length > 0) {
      enhancedPrompt += `\n\n**AVAILABLE TOPICS IN YOUR KNOWLEDGE BASE**: ${availableTopics.slice(0, 8).join(', ')}.`;
    }

    if (context && context.length > 0) {
      const maxContextChars = searchConfig.layers.chat.context.maxContextChars;
      const truncatedContext = context.length > maxContextChars
        ? context.substring(0, maxContextChars) + "..."
        : context;
      enhancedPrompt += `\n\n**RELEVANT CONTEXT**:\n${truncatedContext}`;
    }

    return enhancedPrompt;
  }
}

export default ChatContextService;