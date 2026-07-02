import { IVectorRecord } from "../vector.interface";
import HttpException from "../../../exceptions/HttpException";
import { logger } from "../../../utils/logger";
import { chatbotIndex } from "../../../utils/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { VectorUtils } from "../vector.utils";

// Pinecone client for fast embedding via inference API (~200ms vs HuggingFace's 30-90s)
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

/**
 * Service responsible for basic vector operations (CRUD)
 */
class VectorOperationsService {

  /**
   * Generate embeddings for a batch of texts using Pinecone Inference API
   * Processes in sub-batches of 96 (API limit) with document prefix
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 96;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const prefixedBatch = batch.map(t => `passage: ${t}`);

      const startMs = Date.now();
      const result = await pc.inference.embed(
        "multilingual-e5-large",
        prefixedBatch,
        { inputType: "passage", truncate: "END" }
      );

      const embeddingResult = result as any;
      const embeddings: number[][] = [];
      for (let j = 0; j < batch.length; j++) {
        const vec = embeddingResult?.[j]?.values || embeddingResult?.data?.[j]?.values;
        if (!vec || vec.length === 0) {
          throw new HttpException(500, `Failed to generate embedding for text ${i + j} via Pinecone inference`);
        }
        embeddings.push(vec as number[]);
      }

      allEmbeddings.push(...embeddings);
      logger.info(`📐 Batch ${Math.floor(i / BATCH_SIZE) + 1}: embedded ${batch.length} texts in ${Date.now() - startMs}ms`);
    }

    return allEmbeddings;
  }

  /**
   * Upsert records into a specific namespace with proper user-agent isolation
   * Uses Pinecone Inference API for fast, reliable embeddings (~200ms per batch)
   */
  public async upsertRecords(
    records: IVectorRecord[],
    userId?: number,
    agentId?: number
  ): Promise<void> {
    try {
      if (!userId) {
        throw new HttpException(
          400,
          "User ID is required for vector operations"
        );
      }

      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);

      logger.info(`📤 Generating embeddings via Pinecone inference for ${records.length} records to ${namespaceName}`);

      // Generate embeddings using fast Pinecone Inference API
      const texts = records.map(record => record.text);
      const startMs = Date.now();
      const embeddings = await this.generateEmbeddings(texts);
      logger.info(`✅ All ${embeddings.length} embeddings generated in ${Date.now() - startMs}ms`);

      // Create Pinecone vector records with pre-computed embeddings
      const pineconeVectors = records.map((record, index) => ({
        id: record._id,
        values: embeddings[index],
        metadata: {
          text: record.text,
          category: record.category,
          sourceId: record.sourceId,
          sourceType: record.sourceType,
          chunkIndex: record.chunkIndex,
          totalChunks: record.totalChunks,
          chunkingStrategy: record.chunkingStrategy,
          chunkPosition: record.chunkPosition,
          contentFreshness: record.contentFreshness,
          contentAuthority: record.contentAuthority,
          sourceCreatedAt: record.sourceCreatedAt,
          sourceUpdatedAt: record.sourceUpdatedAt,
          sourceName: record.sourceName,
          sourceDescription: record.sourceDescription,
          sourceStatus: record.sourceStatus,
          sourceFileSize: record.sourceFileSize,
          sourceUrl: record.sourceUrl,
        }
      }));

      // Use regular upsert with pre-computed embeddings
      await namespace.upsert(pineconeVectors);

      logger.info(`✅ Successfully upserted ${records.length} records via Pinecone inference`);
    } catch (error: unknown) {
      logger.error(`❌ Error upserting records:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(500, `Error upserting records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all vectors for a specific agent (for retraining scenarios)
   */
  public async deleteAgentVectors(
    userId: number,
    agentId: number
  ): Promise<void> {
    try {
      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);

      logger.info(`🗑️ Deleting all vectors for namespace: ${namespaceName}`);

      // Delete all vectors in the namespace by deleting the entire namespace
      await namespace.deleteAll();

      logger.info(`✅ Successfully deleted all vectors for agent ${agentId}`);
    } catch (error: any) {
      logger.error(`❌ Error deleting agent vectors:`, error);
      throw new HttpException(
        500,
        `Error deleting agent vectors: ${error.message}`
      );
    }
  }

  /**
   * Delete all vectors for a user (cleanup on user deletion)
   * This deletes vectors from all agent namespaces belonging to the user
   */
  public async deleteUserVectors(userId: number): Promise<void> {
    try {
      logger.info(`🗑️ Deleting all vectors for user ${userId}`);

      // Get all namespaces for this user
      const globalStats = await chatbotIndex.describeIndexStats();
      const userPrefix = `user_${userId}_agent_`;
      const userNamespaces = Object.keys(globalStats.namespaces || {})
        .filter(namespace => namespace.startsWith(userPrefix));

      logger.info(`📋 Found ${userNamespaces.length} agent namespaces for user ${userId}`);

      // Delete all vectors in each agent namespace
      for (const namespaceName of userNamespaces) {
        logger.info(`🗑️ Deleting vectors in namespace: ${namespaceName}`);
        const namespace = chatbotIndex.namespace(namespaceName);
        await namespace.deleteAll();
      }

      logger.info(`✅ Successfully deleted all vectors for user ${userId} (${userNamespaces.length} namespaces)`);
    } catch (error: any) {
      logger.error(`❌ Error deleting user vectors:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        500,
        `Error deleting user vectors: ${error.message}`
      );
    }
  }

  /**
   * Fetch vectors by their IDs from a namespace
   */
  public async fetchVectors(
    vectorIds: string[],
    userId: number,
    agentId?: number
  ) {
    try {
      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);

      return await namespace.fetch(vectorIds);
    } catch (error: unknown) {
      throw new HttpException(500, `Error fetching vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete vectors by their IDs (batch delete) from a namespace
   */
  public async deleteVectors(
    vectorIds: string[],
    userId: number,
    agentId?: number
  ) {
    try {
      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);

      return await namespace.deleteMany(vectorIds);
    } catch (error: unknown) {
      throw new HttpException(500, `Error deleting vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all vectors in a namespace
   */
  public async deleteAllVectors(userId: number, agentId?: number) {
    try {
      const namespaceName = VectorUtils.generateNamespaceName(userId, agentId);
      logger.info(`🔀 Using namespace: ${namespaceName}`);
      const namespace = chatbotIndex.namespace(namespaceName);

      return await namespace.deleteAll();
    } catch (error: unknown) {
      throw new HttpException(500, `Error deleting all vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default VectorOperationsService;
