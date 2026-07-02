import { logger } from "../../utils/logger";

// Queue configuration
export const TRAINING_QUEUE_NAME = process.env.TRAINING_QUEUE_NAME || "agent-training";
export const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || "5");
export const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT || "300000"); // 5 minutes

// Training job data interface
export interface TrainingJobData {
  agentId: number;
  userId: number;
  totalSources: number;
}

// Training job result interface
export interface TrainingJobResult {
  success: boolean;
  processedSources: number;
  failedSources: number;
  error?: string;
}

// Job status tracking
export type JobStatus = "waiting" | "active" | "completed" | "failed";

export interface JobInfo {
  id: string;
  name: string;
  data: TrainingJobData;
  progress: number;
  status: JobStatus;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  result?: TrainingJobResult;
}

/**
 * In-process Job Runner — replaces BullMQ/Redis.
 * Runs jobs asynchronously in the same Node.js process.
 * Supports concurrency limiting and job status tracking.
 */
class JobRunner {
  private jobs: Map<string, JobInfo> = new Map();
  private activeCount = 0;
  private maxConcurrent: number;
  private processor?: (
    job: JobInfo,
    updateProgress: (progress: number) => void
  ) => Promise<TrainingJobResult>;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Register the job processor function
   */
  public setProcessor(
    fn: (
      job: JobInfo,
      updateProgress: (progress: number) => void
    ) => Promise<TrainingJobResult>
  ) {
    this.processor = fn;
  }

  /**
   * Add a job to the runner
   */
  public async add(name: string, data: TrainingJobData): Promise<string> {
    const id = `${name}-${Date.now()}`;
    const job: JobInfo = {
      id,
      name,
      data,
      progress: 0,
      status: "waiting",
    };

    this.jobs.set(id, job);
    logger.info(`✅ Training job queued: ${id}`);

    // Fire and forget — run asynchronously without blocking
    setImmediate(() => this.runJob(id));

    return id;
  }

  /**
   * Get a job by ID
   */
  public getJob(id: string): JobInfo | null {
    return this.jobs.get(id) ?? null;
  }

  /**
   * Run a job (internal)
   */
  private async runJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job || !this.processor) return;

    // Wait if at concurrency limit
    if (this.activeCount >= this.maxConcurrent) {
      logger.warn(`⚠️ Job ${id} waiting for concurrency slot (${this.activeCount}/${this.maxConcurrent} active)`);
      await this.waitForSlot();
    }

    this.activeCount++;
    job.status = "active";
    job.processedOn = Date.now();
    logger.info(`🔄 Starting job ${id}`);

    const updateProgress = (progress: number) => {
      job.progress = progress;
    };

    try {
      const result = await Promise.race([
        this.processor(job, updateProgress),
        this.timeoutPromise(id),
      ]);

      job.status = "completed";
      job.progress = 100;
      job.finishedOn = Date.now();
      job.result = result as TrainingJobResult;
      logger.info(`✅ Job ${id} completed successfully`);
    } catch (error: any) {
      job.status = "failed";
      job.finishedOn = Date.now();
      job.failedReason = error?.message ?? "Unknown error";
      logger.error(`❌ Job ${id} failed: ${job.failedReason}`);
    } finally {
      this.activeCount--;
    }
  }

  private timeoutPromise(id: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Job ${id} timed out after ${JOB_TIMEOUT}ms`)),
        JOB_TIMEOUT
      )
    );
  }

  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.activeCount < this.maxConcurrent) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  /**
   * Clean up old jobs
   */
  public cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h
    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        (job.finishedOn ?? 0) < cutoff
      ) {
        this.jobs.delete(id);
      }
    }
    logger.info("✅ Job runner cleanup completed");
  }
}

// Singleton job runner instance
export const jobRunner = new JobRunner(MAX_CONCURRENT_JOBS);

// Add a training job — returns the job ID string
export const addTrainingJob = async (
  agentId: number,
  userId: number,
  totalSources: number
): Promise<string> => {
  try {
    const jobData: TrainingJobData = { agentId, userId, totalSources };
    const jobId = await jobRunner.add(`train-agent-${agentId}`, jobData);
    logger.info(`✅ Training job added for agent ${agentId} (jobId: ${jobId})`);
    return jobId;
  } catch (error) {
    logger.error(`❌ Failed to add training job for agent ${agentId}:`, error);
    throw error;
  }
};

// Get job status
export const getJobStatus = async (jobId: string): Promise<JobInfo | null> => {
  try {
    return jobRunner.getJob(jobId);
  } catch (error) {
    logger.error(`❌ Failed to get job status for ${jobId}:`, error);
    return null;
  }
};

// No-op cleanup (compatibility)
export const cleanupJobs = async (): Promise<void> => {
  jobRunner.cleanup();
};

// No-op close (compatibility)
export const closeQueue = async (): Promise<void> => {
  logger.info("✅ Job runner shut down");
};

export default jobRunner;
