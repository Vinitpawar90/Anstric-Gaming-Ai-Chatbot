import { IVectorSearchResult } from "../vector.interface";
import HttpException from "../../../exceptions/HttpException";
import { logger } from "../../../utils/logger";
import { chatbotIndex } from "../../../utils/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { searchConfig } from "../../../config/search.config";
import { VectorUtils } from "../vector.utils";

// Single shared Pinecone client for all search operations
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// In-memory embedding cache — avoids repeat API calls for same query text
const queryEmbeddingCache = new Map<string, { embedding: number[]; expiresAt: number }>();
const QUERY_EMBEDDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes


/**
 * Service responsible for vector search operations.
 * Uses pure dense semantic search via Pinecone Inference API.
 */
class VectorSearchService {

  /**
   * Generate query embedding using Pinecone Inference API (~200ms)
   */
  private async getQueryEmbedding(query: string): Promise<number[]> {
    // Check cache first
    const cacheKey = query.trim().substring(0, 512);
    const cached = queryEmbeddingCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug(`⚡ Query embedding cache HIT`);
      return cached.embedding;
    }

    const startMs = Date.now();
    const result = await pc.inference.embed(
      "multilingual-e5-large",
      [`query: ${query}`],
      { inputType: "query", truncate: "END" }
    );

    const embeddingResult = result as any;
    const embedding = embeddingResult?.[0]?.values || embeddingResult?.data?.[0]?.values;
    if (!embedding || embedding.length === 0) {
      throw new HttpException(500, "Failed to generate query embedding via Pinecone inference");
    }

    logger.info(`🔤 Query embedding via Pinecone inference: ${Date.now() - startMs}ms`);

    // Cache it
    queryEmbeddingCache.set(cacheKey, {
      embedding: embedding as number[],
      expiresAt: Date.now() + QUERY_EMBEDDING_CACHE_TTL,
    });

    return embedding as number[];
  }

  /**
   * Semantic dense search — the single canonical search path.
   * Uses Pinecone Inference API for fast, consistent embeddings.
   */
  public async searchSimilar(
    query: string,
    userId: number,
    agentId?: number,
    options?: {
      topK?: number;
      includeMetadata?: boolean;
      filterByStrategy?: string;
      sourceType?: string;
      minSimilarity?: number;
    }
  ): Promise<IVectorSearchResult[]> {
    try {
      if (!userId) {
        throw new HttpException(400, "User ID is required for vector search");
      }

      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);
      const topK = options?.topK || searchConfig.parameters.defaultTopK;

      logger.info(
        `🔍 Searching ${topK} vectors in namespace for agent ${agentId}${options?.sourceType ? ` filtered by sourceType: ${options.sourceType}` : ''}`
      );

      // Build filter object for Pinecone query
      const filter: Record<string, unknown> = {};
      if (options?.filterByStrategy) {
        filter.chunkingStrategy = { $eq: options.filterByStrategy };
      }
      if (options?.sourceType) {
        filter.sourceType = { $eq: options.sourceType };
      }

      // Generate query embedding via Pinecone Inference API
      const queryEmbedding = await this.getQueryEmbedding(query);

      const pineconeResponse = await namespace.query({
        vector: queryEmbedding,
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata: true,
      });

      // Transform Pinecone response
      const results: IVectorSearchResult[] =
        pineconeResponse.matches?.map((match: any) => ({
          id: match.id,
          text: (match.metadata?.text as string) || "",
          score: match.score,
          metadata:
            options?.includeMetadata !== false
              ? {
                category: match.metadata?.category as string,
                sourceId: match.metadata?.sourceId as number,
                sourceType: match.metadata?.sourceType as string,
                chunkIndex: match.metadata?.chunkIndex as number,
                totalChunks: match.metadata?.totalChunks as number,
                breakpointScore: match.metadata?.breakpointScore as number,
                similarity: match.metadata?.similarity as number,
                chunkingStrategy: match.metadata?.chunkingStrategy as string,
                startPosition: match.metadata?.startPosition as number,
                endPosition: match.metadata?.endPosition as number,
                documentTitle: match.metadata?.documentTitle as string,
                documentSummary: match.metadata?.documentSummary as string,
                sectionTitle: match.metadata?.sectionTitle as string,
                precedingContext: match.metadata?.precedingContext as string,
                followingContext: match.metadata?.followingContext as string,
                documentFileType: match.metadata?.documentFileType as string,
                documentLanguage: match.metadata?.documentLanguage as string,
                documentWordCount: match.metadata?.documentWordCount as number,
                documentCreatedDate: match.metadata?.documentCreatedDate as string,
              }
              : undefined,
        })) || [];

      // Filter by minimum similarity if specified
      const filteredResults = options?.minSimilarity
        ? results.filter((result) => result.score >= options.minSimilarity!)
        : results;

      logger.info(`✅ Found ${filteredResults.length} relevant vectors`);
      return filteredResults;
    } catch (error: unknown) {
      logger.error(`❌ Error searching vectors:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Error searching vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear the query embedding cache
   */
  public clearEmbeddingCache(): void {
    queryEmbeddingCache.clear();
    logger.info(`✅ Query embedding cache cleared`);
  }
}

export default VectorSearchService;
