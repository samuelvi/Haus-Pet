import { Worker, Job } from "bullmq";
import connection from "./infrastructure/queue/redis-connection";
import { AuditService } from "./application/audit.service";
import { MongoAuditRepository } from "./infrastructure/repositories/mongo-audit.repository";

const AUDIT_QUEUE_NAME = "audit-log";

console.log("Worker process started.");

// --- Composition Root for the Worker ---
// The MongoAuditRepository now uses Mongoose and doesn't need a client passed in.
const auditRepository = new MongoAuditRepository();
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
      throw error; // Re-throw to let BullMQ know the job failed.
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}. It will be moved to the failed queue.`);
});

// Graceful shutdown
process.on("SIGINT", () => worker.close());
process.on("SIGTERM", () => worker.close());
