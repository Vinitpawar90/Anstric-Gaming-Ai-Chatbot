import axios from "axios";
import crypto from "crypto";
import { logger } from "../../../utils/logger";
import HttpException from "../../../exceptions/HttpException";
import { delay, createBatches } from "../../../utils/common.util";
import { vectorConfig } from "../../../config/vector.config";

/**
 * BGE-M3 Embedding Service - Unified embedding and reranking using BAAI/bge-m3
 * 
 * Features:
 * - Text embedding (1024 dimensions)
 * - Batch processing with rate limiting
 * - Error handling and retries
 * - Cost-effective (free HuggingFace API)
 * - Better multilingual support
 */
class BGEM3EmbeddingService {
  // Using axios directly — HF SDK featureExtraction endpoint is deprecated/broken as of 2026-03
  private readonly HF_URL = `https://router.huggingface.co/hf-inference/models/${vectorConfig.embedding.modelName}`;
  private readonly MODEL_NAME = vectorConfig.embedding.modelName;
  private readonly MAX_BATCH_SIZE = vectorConfig.embedding.maxBatchSize;
  private readonly MAX_TEXT_LENGTH = vectorConfig.embedding.maxTextLength;
  private readonly RETRY_ATTEMPTS = vectorConfig.embedding.retryAttempts;
  private readonly RETRY_DELAY = vectorConfig.embedding.retryDelay;
  private readonly CHUNK_SIZE = vectorConfig.embedding.chunkSize;
  private readonly CHUNK_OVERLAP = vectorConfig.embedding.chunkOverlap;

  // In-memory embedding cache — eliminates HuggingFace cold-start penalty (10-30s) on repeat queries
  // Shared across all service instances (process-level singleton)
  private static embeddingCache = new Map<string, { embedding: number[]; expiresAt: number }>();
  private static readonly EMBEDDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private readonly MODEL_INFO = {
    name: this.MODEL_NAME,
    dimensions: vectorConfig.embedding.dimensions,
    maxLength: this.MAX_TEXT_LENGTH,
    provider: vectorConfig.embedding.provider
  } as const;

  constructor() {
    if (!process.env.HUGGINGFACE_TOKEN) {
      throw new Error("HUGGINGFACE_TOKEN environment variable is required");
    }
    logger.info("🤖 BGE-M3 Embedding Service initialized");
  }

  /**
 * Generate embedding for a text (handles long documents with chunking)
 * @param text - Text to embed
 * @returns 1024-dimensional embedding vector
 */
  public async embedText(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new HttpException(400, "Text input cannot be empty");
      }

      // Clean whitespace
      const cleanedText = text.replace(/\s+/g, ' ').trim();

      // Check in-memory cache first — avoids HuggingFace cold-start (10-30s) on repeated queries
      // Use MD5 hash of full text to avoid false hits on documents sharing the same opening text.
      const cacheKey = crypto.createHash('md5').update(cleanedText).digest('hex');
      const cached = BGEM3EmbeddingService.embeddingCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug(`⚡ Embedding cache HIT for text (${cleanedText.length} chars)`);
        return cached.embedding;
      }

      let embedding: number[];

      // For short texts, process directly
      if (cleanedText.length <= this.MAX_TEXT_LENGTH) {
        logger.debug(`🔤 Generating BGE-M3 embedding for text (${cleanedText.length} chars)`);
        embedding = await this.generateEmbeddingWithRetry(cleanedText);
      } else {
        // For long texts, use chunking strategy
        logger.debug(` Long document detected (${cleanedText.length} chars), using chunking strategy`);
        const chunks = this.createTextChunks(cleanedText);
        logger.debug(`Split into ${chunks.length} chunks for processing`);

        const chunkEmbeddings = await Promise.all(
          chunks.map(chunk => this.generateEmbeddingWithRetry(chunk))
        );

        embedding = this.averageEmbeddings(chunkEmbeddings);
        logger.debug(`✅ Generated averaged BGE-M3 embedding from ${chunks.length} chunks`);
      }

      // Store in cache
      BGEM3EmbeddingService.embeddingCache.set(cacheKey, {
        embedding,
        expiresAt: Date.now() + BGEM3EmbeddingService.EMBEDDING_CACHE_TTL,
      });

      return embedding;

    } catch (error) {
      logger.error("❌ BGE-M3 embedding generation failed:", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `BGE-M3 embedding failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param texts - Array of texts to embed
   * @returns Array of 1024-dimensional embedding vectors
   */
  public async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      if (!texts || texts.length === 0) {
        return [];
      }

      logger.info(`🔄 Generating BGE-M3 embeddings for ${texts.length} texts`);

      const results: number[][] = [];
      const batches = createBatches(texts, this.MAX_BATCH_SIZE);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.debug(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} texts)`);

        const batchResults = await Promise.all(
          batch.map(text => this.embedText(text))
        );

        results.push(...batchResults);

        // Rate limiting: small delay between batches
        if (i < batches.length - 1) {
          await delay(vectorConfig.embedding.retryDelay);
        }
      }

      logger.info(`✅ Generated ${results.length} BGE-M3 embeddings successfully`);
      return results;

    } catch (error) {
      logger.error("❌ BGE-M3 batch embedding failed:", error);
      throw new HttpException(500, `BGE-M3 batch embedding failed: ${error.message}`);
    }
  }

  /**
   * Generate embedding with retry logic
   * @param text - Text to embed
   * @returns Embedding vector
   */
  private async generateEmbeddingWithRetry(text: string, attempt: number = 1): Promise<number[]> {
    try {
      // multilingual-e5-large requires 'passage:' prefix for stored documents
      const prefixedText = `passage: ${text}`;

      const response = await axios.post(
        this.HF_URL,
        { inputs: [prefixedText], options: { wait_for_model: true } },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 90_000, // 90-second hard timeout
        }
      );

      const data: any[] = response.data;
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid embedding response format');
      }

      // Handle token-level (mean pool) or sentence-level embeddings
      const item = data[0];
      if (Array.isArray(item[0])) {
        const dims = item[0].length;
        const avg = new Array(dims).fill(0);
        for (const vec of item) for (let i = 0; i < dims; i++) avg[i] += (vec[i] as number);
        return avg.map((v: number) => v / item.length);
      }
      return item as number[];

    } catch (error: any) {
      const isLoading = error?.response?.status === 503;
      const isTimeout = error?.code === 'ECONNABORTED';
      const msg = error?.response?.data?.error || error.message;

      logger.warn(`⚠️ Embedding attempt ${attempt} failed: ${isTimeout ? 'TIMEOUT' : isLoading ? 'MODEL_LOADING' : msg}`);

      if (attempt < this.RETRY_ATTEMPTS) {
        const waitMs = isLoading ? 30_000 : this.RETRY_DELAY * attempt;
        logger.info(`⏳ Waiting ${waitMs}ms before retry ${attempt + 1}/${this.RETRY_ATTEMPTS}...`);
        await delay(waitMs);
        return this.generateEmbeddingWithRetry(text, attempt + 1);
      }
      throw error;
    }
  }


  /**
   * Get model information
   * @returns Model details
   */
  public getModelInfo(): {
    name: string;
    dimensions: number;
    maxLength: number;
    provider: string;
  } {
    return { ...this.MODEL_INFO };
  }

  /**
   * Create overlapping chunks from long text for better embedding quality
   * @param text - Long text to chunk
   * @returns Array of text chunks
   */
  private createTextChunks(text: string): string[] {
    const chunks: string[] = [];
    const textLength = text.length;

    // If text is short enough, return as single chunk
    if (textLength <= this.MAX_TEXT_LENGTH) {
      return [text];
    }

    let start = 0;
    while (start < textLength) {
      const end = start + this.CHUNK_SIZE;

      // If we're at the end of the text, take what's left
      if (end >= textLength) {
        chunks.push(text.substring(start));
        break;
      }

      // Try to find a good breaking point (sentence, paragraph, or word boundary)
      const actualEnd = this.findOptimalBreakPoint(text, start, end);

      const chunk = text.substring(start, actualEnd);
      chunks.push(chunk);

      // Move start position with overlap
      start = actualEnd - this.CHUNK_OVERLAP;

      // Prevent infinite loop
      if (start >= textLength) break;
    }

    return chunks;
  }

  /**
   * Find optimal breaking point for text chunking (sentence, paragraph, or word boundary)
   * @param text - Full text
   * @param start - Start position
   * @param preferredEnd - Preferred end position
   * @returns Optimal end position
   */
  private findOptimalBreakPoint(text: string, start: number, preferredEnd: number): number {
    // Look for sentence endings within the last 200 characters of the chunk
    const searchStart = Math.max(start, preferredEnd - vectorConfig.embedding.sentenceSearchRange);

    // Priority: paragraph break (\n\n) > sentence break (.!?) > word break (space)
    const breakpoints = [
      { pattern: /\n\n/g, priority: 3, isSpace: false },
      { pattern: /[.!?]\s/g, priority: 2, isSpace: false },
      { pattern: /\s/g, priority: 1, isSpace: true }
    ];

    for (const { pattern, isSpace } of breakpoints) {
      pattern.lastIndex = searchStart; // Reset regex state
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match.index >= start && match.index <= preferredEnd) {
          return match.index + (isSpace ? 0 : match[0].length);
        }
        if (match.index > preferredEnd) break;
      }
    }

    // Fallback to preferred end if no good break point found
    return preferredEnd;
  }

  /**
   * Average multiple embeddings into a single representative embedding
   * @param embeddings - Array of embedding vectors
   * @returns Averaged embedding vector
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error("Cannot average empty embeddings array");
    }

    if (embeddings.length === 1) {
      return embeddings[0];
    }

    const dimensions = embeddings[0].length;
    const averaged = new Array(dimensions).fill(0);

    // Sum all embeddings
    for (const embedding of embeddings) {
      if (embedding.length !== dimensions) {
        throw new Error(`Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length}`);
      }
      for (let i = 0; i < dimensions; i++) {
        averaged[i] += embedding[i];
      }
    }

    // Divide by number of embeddings to get average
    for (let i = 0; i < dimensions; i++) {
      averaged[i] /= embeddings.length;
    }

    return averaged;
  }
}

export default BGEM3EmbeddingService;