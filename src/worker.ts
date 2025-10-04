import { Worker, Job } from "bullmq";
import connection from "./infrastructure/queue/redis-connection";
import { AuditService } from "./application/audit.service";
import { PostgresAuditRepository } from "./infrastructure/repositories/postgres-audit.repository";
import { pool } from "./infrastructure/database/postgres-pool";

const AUDIT_QUEUE_NAME = "audit-log";

console.log("Worker process started.");

// --- Composition Root for the Worker ---
const auditRepository = new PostgresAuditRepository(pool);
const auditService = new AuditService(auditRepository);
// ---

const worker = new Worker(
  AUDIT_QUEUE_NAME,
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    try {
      await auditService.log(job.data);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      // BullMQ will automatically handle retries based on the options below.
      // If all retries fail, it will move the job to the 'failed' queue.
      throw error; // Re-throw to let BullMQ know the job failed.
    }
  },
  {
    connection,
    // Retry strategy
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s, 8s, 16s
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}. It will be moved to the failed queue.`);
  // In a real production system, the 'failed' queue acts as our Dead Letter Queue.
  // An alert would be triggered here to notify an operator.
});

// Graceful shutdown
process.on("SIGINT", () => worker.close());
process.on("SIGTERM", () => worker.close());
