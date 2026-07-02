import {
  TrainingJobData,
  TrainingJobResult,
  JobInfo,
  jobRunner,
} from "./queue";
import { AgentTrainingService } from "./services/agent-training.service";
import { SourceExtractorService } from "../source/services/source-extractor.service";
import VectorService from "../vector/services/vector.service";
import { logger } from "../../utils/logger";
import unifiedCacheService from "../vector/services/unified-cache.service";
import agentCacheService from "../agent/services/agent-cache.service";
import DB from "../../../database/index.schema";

/**
 * The actual job processor — processes each source independently so a single
 * bad document does not fail the entire training run.
 */
async function processTrainingJob(
  job: JobInfo,
  updateProgress: (p: number) => void
): Promise<TrainingJobResult> {
  const trainingService = new AgentTrainingService();
  const sourceExtractorService = new SourceExtractorService();
  const vectorService = new VectorService();

  const { agentId, userId, totalSources } = job.data as TrainingJobData;

  logger.info(`🔄 Starting training job for agent ${agentId} (${totalSources} sources)`);

  try {
    await trainingService.updateAgentTrainingStatus(agentId, "in-progress", 0);
    updateProgress(10);

    // Step 1: Extract content from all sources
    logger.info(`📊 Extracting content for agent ${agentId}`);
    const extractedSources = await sourceExtractorService.extractAllSourcesForAgent(agentId);

    if (extractedSources.length === 0) {
      logger.warn(`⚠️ No sources found for agent ${agentId}`);
      await trainingService.updateAgentTrainingStatus(agentId, "completed", 100);
      return { success: true, processedSources: 0, failedSources: 0 };
    }

    updateProgress(20);

    // Step 2: Process each source independently — failure of one does NOT block others
    const processedSourceIds: number[] = [];
    const failedSourceIds: number[] = [];

    for (let i = 0; i < extractedSources.length; i++) {
      const source = extractedSources[i];

      try {
        logger.info(`🔄 Embedding source ${source.sourceId} (${i + 1}/${extractedSources.length}): ${source.name}`);

        // Transform this single source to vector records
        const sourceVectorRecords = await sourceExtractorService.transformToVectorFormat(
          agentId,
          [source]
        );

        if (sourceVectorRecords.length === 0) {
          logger.warn(`⚠️ No vector records produced for source ${source.sourceId} — skipping`);
          failedSourceIds.push(source.sourceId);
        } else {
          // Upsert just this source's vectors
          await vectorService.upsertRecords(sourceVectorRecords, userId, agentId);

          // Mark only this source as embedded
          await sourceExtractorService.markSourcesAsEmbedded([source.sourceId]);
          processedSourceIds.push(source.sourceId);

          logger.info(`✅ Source ${source.sourceId} embedded: ${sourceVectorRecords.length} vectors`);
        }
      } catch (error) {
        logger.error(`❌ Failed to embed source ${source.sourceId} (${source.name}):`, error);

        // Mark this source as failed without stopping the rest
        try {
          await DB("sources")
            .where({ id: source.sourceId })
            .update({ status: "failed", updated_at: new Date() });
        } catch (dbError) {
          logger.error(`❌ Failed to mark source ${source.sourceId} as failed:`, dbError);
        }

        failedSourceIds.push(source.sourceId);
      }

      // Update progress proportionally after each source
      const completedCount = processedSourceIds.length + failedSourceIds.length;
      const progressPercent = 20 + Math.round((completedCount / extractedSources.length) * 70);
      updateProgress(progressPercent);
    }

    logger.info(
      `📊 Training complete for agent ${agentId}: ` +
      `${processedSourceIds.length} embedded, ${failedSourceIds.length} failed`
    );

    // Step 3: Get total embedded count (includes any previously embedded sources)
    const embeddedSourcesResult = await DB("sources")
      .where({ agent_id: agentId, is_deleted: false, is_embedded: true })
      .count("id as count")
      .first();
    const absoluteEmbeddedSources = parseInt(embeddedSourcesResult?.count as string) || 0;

    await trainingService.updateAgentTrainingStatus(
      agentId,
      "completed",
      100,
      failedSourceIds.length > 0
        ? `${failedSourceIds.length} source(s) failed to embed`
        : null,
      absoluteEmbeddedSources
    );
    updateProgress(100);

    // Step 4: Invalidate caches so next chat sees fresh vectors
    try {
      await unifiedCacheService.invalidateAgentCache(userId, agentId);
      await agentCacheService.invalidateAgent(agentId, userId);
      logger.info(`🗑️ Caches invalidated for Agent ${agentId} after training`);
    } catch (cacheError) {
      logger.error(`❌ Error invalidating caches:`, cacheError);
    }

    logger.info(`✅ Training job finished for agent ${agentId}`);

    return {
      success: true,
      processedSources: processedSourceIds.length,
      failedSources: failedSourceIds.length,
    };
  } catch (error) {
    logger.error(`❌ Training job failed for agent ${agentId}:`, error);

    await trainingService.updateAgentTrainingStatus(
      agentId,
      "failed",
      0,
      error instanceof Error ? error.message : "Unknown error"
    );

    throw error;
  }
}

/**
 * Start the training worker — registers the processor with the job runner.
 * Called once on server startup.
 */
export const startTrainingWorker = (): void => {
  jobRunner.setProcessor(processTrainingJob);
  logger.info("🚀 Training worker started (in-process)");
};

/**
 * Stop the training worker (no-op for in-process runner)
 */
export const stopTrainingWorker = async (): Promise<void> => {
  logger.info("✅ Training worker stopped");
};
