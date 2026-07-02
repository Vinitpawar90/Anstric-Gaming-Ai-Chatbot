import knex from "../../../../database/index.schema";
import HttpException from "../../../exceptions/HttpException";
import { addTrainingJob } from "../queue";
import { logger } from "../../../utils/logger";
import VectorService from "../../vector/services/vector.service";
import agentCacheService from "../../agent/services/agent-cache.service";

export class AgentTrainingService {
  /**
   * Start training an agent by adding it to the background queue
   */
  public async trainAgent(agentId: number, userId: number) {
    try {
      // First, verify the agent exists and belongs to the user
      const agent = await knex("agents")
        .where({ id: agentId, user_id: userId, is_deleted: false })
        .first();

      if (!agent) {
        throw new HttpException(404, "Agent not found or access denied");
      }

      // Check if agent is already being trained
      if (
        agent.training_status === "pending" ||
        agent.training_status === "in-progress"
      ) {
        throw new HttpException(400, "Agent is already being trained");
      }

      // Get count of pending sources to train
      // Sources with status 'pending' or 'completed' but not yet embedded
      const pendingSourcesResult = await knex("sources")
        .where({
          agent_id: agentId,
          is_deleted: false,
          is_embedded: false,
        })
        .whereIn("status", ["pending", "completed"])
        .count("id as count")
        .first();

      const pendingSourcesCount = parseInt(pendingSourcesResult?.count as string) || 0;

      if (pendingSourcesCount === 0) {
        throw new HttpException(
          400,
          "No sources ready for embedding found for this agent. Sources must be uploaded (status: pending/completed) and not yet embedded."
        );
      }

      // Get absolute total sources for this agent
      const absoluteTotalResult = await knex("sources")
        .where({ agent_id: agentId, is_deleted: false })
        .count("id as count")
        .first();

      const absoluteTotalSources = parseInt(absoluteTotalResult?.count as string) || 0;

      // Update agent status to pending (do NOT reset embedded_sources_count)
      await knex("agents").where({ id: agentId }).update({
        training_status: "pending",
        training_progress: 0,
        training_error: null,
        total_sources_count: absoluteTotalSources,
      });

      // Add training job to in-process queue
      const jobId = await addTrainingJob(agentId, userId, pendingSourcesCount);

      logger.info(
        `✅ Training job queued for agent ${agentId} with job ID: ${jobId}`
      );

      return {
        success: true,
        jobId,
        totalSources: pendingSourcesCount,
        message: "Training started successfully",
      };
    } catch (error) {
      logger.error(`❌ Error starting training for agent ${agentId}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        `Error starting training: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get the current training status of an agent with detailed information
   */
  public async getTrainingStatus(agentId: number, userId: number) {
    try {
      // Verify the agent exists and belongs to the user
      const agent = await knex("agents")
        .where({ id: agentId, user_id: userId, is_deleted: false })
        .select([
          "id",
          "name",
          "training_status",
          "training_progress",
          "training_error",
          "embedded_sources_count",
          "total_sources_count",
          "trained_on",
          "created_at",
          "updated_at",
        ])
        .first();

      if (!agent) {
        throw new HttpException(404, "Agent not found or access denied");
      }

      // 2. Load all secondary data in parallel (Breaks the Waterfall)
      const [sourcesBreakdown, sourceDetails, metrics, history] = await Promise.all([
        this.getSourcesBreakdown(agentId),
        this.getSourceDetails(agentId),
        this.getTrainingMetrics(agentId, userId),
        this.getTrainingHistory(agentId),
      ]);

      // Calculate estimated completion time if training is in progress
      let estimatedCompletion = null;
      let timeRemaining = null;
      if (
        agent.training_status === "in-progress" &&
        agent.training_progress > 0
      ) {
        // More accurate estimation based on current progress
        const startTime = new Date(agent.trained_on || Date.now());
        const elapsed = Date.now() - startTime.getTime();
        const progressRatio = agent.training_progress / 100;

        if (progressRatio > 0) {
          const estimatedTotal = elapsed / progressRatio;
          const remaining = estimatedTotal - elapsed;
          timeRemaining = Math.max(0, remaining);
          estimatedCompletion = new Date(Date.now() + timeRemaining);
        }
      }

      // Calculate actual totals from breakdown to ensure accuracy
      let actualTotalSources = 0;
      let actualEmbeddedSources = 0;

      Object.values(sourcesBreakdown).forEach((typeData: any) => {
        actualTotalSources += typeData.total;
        actualEmbeddedSources += typeData.embedded;
      });

      return {
        agent: {
          id: agent.id,
          name: agent.name,
          createdAt: agent.created_at,
          lastUpdated: agent.updated_at,
        },
        status: agent.training_status,
        progress: agent.training_progress,
        error: agent.training_error
          ? {
            message: agent.training_error,
            timestamp: agent.updated_at,
          }
          : null,
        sources: {
          total: actualTotalSources,
          embedded: actualEmbeddedSources,
          pending: Math.max(
            0,
            actualTotalSources - actualEmbeddedSources
          ),
          breakdown: sourcesBreakdown,
          details: sourceDetails,
        },
        metrics,
        history,
        timestamps: {
          lastTraining: agent.trained_on,
          estimatedCompletion,
          timeRemaining: timeRemaining
            ? Math.round(timeRemaining / 1000)
            : null, // seconds
        },
      };
    } catch (error) {
      logger.error(
        `❌ Error getting training status for agent ${agentId}:`,
        error
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        `Error getting training status: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get breakdown of sources by type and status
   */
  private async getSourcesBreakdown(agentId: number) {
    const sourcesBreakdown = await knex("sources")
      .where({ agent_id: agentId, is_deleted: false })
      .select("source_type", "status", "is_embedded")
      .groupBy("source_type", "status", "is_embedded")
      .count("* as count");

    const breakdown = {
      file: { total: 0, completed: 0, embedded: 0, pending: 0, failed: 0 },
      text: { total: 0, completed: 0, embedded: 0, pending: 0, failed: 0 },
      qa: { total: 0, completed: 0, embedded: 0, pending: 0, failed: 0 },
      website: { total: 0, completed: 0, embedded: 0, pending: 0, failed: 0 },
      database: { total: 0, completed: 0, embedded: 0, pending: 0, failed: 0 },
    };

    sourcesBreakdown.forEach((item: any) => {
      const type = item.source_type as keyof typeof breakdown;
      const count = parseInt(item.count);

      if (breakdown[type]) {
        breakdown[type].total += count;

        if (item.status === "completed") {
          breakdown[type].completed += count;
        } else if (item.status === "failed") {
          breakdown[type].failed += count;
        } else {
          breakdown[type].pending += count;
        }

        if (item.is_embedded) {
          breakdown[type].embedded += count;
        }
      }
    });

    return breakdown;
  }

  /**
   * Get detailed source-level information
   */
  private async getSourceDetails(agentId: number) {
    const sources = await knex("sources")
      .where({ agent_id: agentId, is_deleted: false })
      .select([
        "id",
        "name",
        "source_type",
        "status",
        "is_embedded",
        "created_at",
        "updated_at",
        "description",
      ])
      .orderBy("created_at", "desc");

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.source_type,
      status: source.status,
      isEmbedded: source.is_embedded,
      description: source.description,
      createdAt: source.created_at,
      lastUpdated: source.updated_at,
    }));
  }

  /**
 * Get training metrics and statistics with enhanced vector service integration
 */
  private async getTrainingMetrics(agentId: number, userId: number) {
    // 1. Prepare all database queries
    const queries = [
      // Get embedded sources count
      knex("sources")
        .where({ agent_id: agentId, is_embedded: true })
        .count("* as total")
        .first(),

      // Get recently processed sources (last 1 hour) - SQLite compatible
      knex("sources")
        .where({ agent_id: agentId, status: "completed" })
        .where("updated_at", ">=", knex.raw("datetime('now', '-1 hour')"))
        .count("* as recent_sources")
        .first(),

      // Calculate average processing time per source - SQLite compatible
      knex("sources")
        .where({ agent_id: agentId, status: "completed" })
        .select(
          knex.raw(
            "AVG(strftime('%s', updated_at) - strftime('%s', created_at)) as avg_seconds"
          )
        )
        .first(),

      // Get failed sources count
      knex("sources")
        .where({ agent_id: agentId, status: "failed" })
        .count("* as total")
        .first(),
    ];

    // 2. Execute DB queries in parallel
    const [embeddedSources, recentTraining, avgProcessingTime, failedSources] = await Promise.all(queries);

    const embeddedCount = Number(embeddedSources?.total || 0);

    // 3. Get vector count directly from Pinecone stats (avoids creating VectorService + BGEM3 init)
    let vectorCount = 0;
    if (embeddedCount > 0) {
      try {
        const { chatbotIndex: idx } = require("../../../utils/pinecone");
        const namespaceName = `user_${userId}_agent_${agentId}`;
        const stats = await idx.describeIndexStats();
        vectorCount = stats.namespaces?.[namespaceName]?.recordCount || 0;
      } catch (error) {
        logger.warn(`⚠️ Could not get vector count from Pinecone:`, error);
      }
    }

    return {
      embeddedSources: embeddedCount,
      recentlyProcessed: Number(recentTraining?.recent_sources || 0),
      failedSources: Number(failedSources?.total || 0),
      vectorCount,
      averageProcessingTime: (avgProcessingTime as any)?.avg_seconds
        ? Math.round(parseFloat((avgProcessingTime as any).avg_seconds))
        : null,
      namespace: `user_${userId}_agent_${agentId}`,
    };
  }

  /**
   * Get training history
   */
  private async getTrainingHistory(agentId: number) {
    // Get recent training sessions from job completion logs
    // For now, we'll get the last few training status changes
    const trainingHistory = await knex("agents")
      .where({ id: agentId })
      .select([
        "training_status",
        "training_progress",
        "trained_on",
        "updated_at",
      ])
      .orderBy("updated_at", "desc")
      .limit(10);

    // Get source completion timeline
    const sourceTimeline = await knex("sources")
      .where({ agent_id: agentId, status: "completed" })
      .select(["name", "source_type", "updated_at as completed_at"])
      .orderBy("updated_at", "desc")
      .limit(20);

    return {
      recentSessions: trainingHistory.map((session) => ({
        status: session.training_status,
        progress: session.training_progress,
        timestamp: session.updated_at,
        trainingDate: session.trained_on,
      })),
      sourceCompletions: sourceTimeline.map((source) => ({
        name: source.name,
        type: source.source_type,
        completedAt: source.completed_at,
      })),
    };
  }

  /**
   * Update agent training status - used by training worker
   */
  public async updateAgentTrainingStatus(
    agentId: number,
    status: "idle" | "pending" | "in-progress" | "completed" | "failed",
    progress: number,
    error?: string,
    embeddedSourcesCount?: number
  ) {
    try {
      const updateData: any = {
        training_status: status,
        training_progress: progress,
      };

      if (error !== undefined) {
        updateData.training_error = error;
      }

      if (embeddedSourcesCount !== undefined) {
        updateData.embedded_sources_count = embeddedSourcesCount;
      }

      if (status === "completed") {
        updateData.trained_on = knex.fn.now();
      }

      await knex("agents").where({ id: agentId }).update(updateData);

      logger.info(
        `📊 Updated agent ${agentId} status: ${status} (${progress}%)`
      );
    } catch (error) {
      logger.error(`❌ Error updating agent training status:`, error);
      throw error;
    }
  }

  /**
   * Clean up agent vectors when an agent is deleted (Phase 6 enhancement)
   */
  public async cleanupAgentVectors(
    agentId: number,
    userId: number
  ): Promise<void> {
    try {
      logger.info(
        `🧹 Cleaning up vectors for agent ${agentId} (user ${userId})`
      );

      const vectorService = new VectorService();

      // Check if agent has vectors before attempting cleanup
      const hasVectors = await vectorService.areVectorsAvailable(userId, agentId);

      if (hasVectors) {
        await vectorService.deleteAgentVectors(userId, agentId);
        logger.info(`✅ Successfully cleaned up vectors for agent ${agentId}`);
      } else {
        logger.info(
          `ℹ️ No vectors found for agent ${agentId}, cleanup skipped`
        );
      }
    } catch (error) {
      logger.error(`❌ Error cleaning up agent vectors:`, error);
      // Don't throw error to prevent blocking agent deletion
    }
  }

  /**
   * Retrain agent (delete existing vectors and retrain)
   */
  public async retrainAgent(agentId: number, userId: number) {
    try {
      logger.info(`🔄 Retraining agent ${agentId} (user ${userId})`);

      // Step 1: Clean up existing vectors
      await this.cleanupAgentVectors(agentId, userId);

      // Step 2: Transactionally reset source embedding and agent status
      await knex.transaction(async (trx) => {
        await trx("sources")
          .where({ agent_id: agentId, is_deleted: false })
          .update({
            is_embedded: false,
            updated_at: new Date(),
          });

        await trx("agents").where("id", agentId).update({
          training_status: "idle",
          training_progress: 0,
          training_error: null,
          embedded_sources_count: 0,
          updated_at: new Date(),
        });
      });

      // Step 3: Clear agent cache
      await agentCacheService.invalidateAgent(agentId, userId);

      // Step 4: Start new training
      const result = await this.trainAgent(agentId, userId);

      logger.info(`✅ Retrain initiated for agent ${agentId}`);
      return result;
    } catch (error) {
      logger.error(`❌ Error retraining agent ${agentId}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        `Error retraining agent: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
