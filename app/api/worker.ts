import { Worker, Job } from "bullmq";
import connection from "./infrastructure/queue/redis-connection";
import { AuditService } from "./application/audit.service";
import { MongoAuditRepository } from "./infrastructure/repositories/mongo-audit.repository";
import logger from "./infrastructure/logger/logger";

const AUDIT_QUEUE_NAME = "audit-log";

logger.info('Worker process started');

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
    'Uncaught Exception in worker - shutting down'
  );
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.fatal(
    {
      reason,
      promise,
    },
    'Unhandled Promise Rejection in worker - shutting down'
  );
  process.exit(1);
});

// --- Composition Root for the Worker ---
// The MongoAuditRepository now uses Mongoose and doesn't need a client passed in.
const auditRepository = new MongoAuditRepository();
const auditService = new AuditService(auditRepository);
// ---

const worker = new Worker(
  AUDIT_QUEUE_NAME,
  async (job: Job) => {
    logger.debug({ jobId: job.id, jobName: job.name }, 'Processing job');
    try {
      await auditService.log(job.data);
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          error: error instanceof Error ? error.message : error,
        },
        'Error processing job'
      );
      throw error; // Re-throw to let BullMQ know the job failed.
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, 'Job completed successfully');
});

worker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      error: err.message,
      stack: err.stack,
    },
    'Job failed and moved to failed queue'
  );
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down worker gracefully...');
  await worker.close();
  logger.info('Worker closed successfully');
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
