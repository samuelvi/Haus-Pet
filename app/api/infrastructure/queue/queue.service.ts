import { Queue, JobsOptions } from "bullmq";
import connection from "./redis-connection";

const AUDIT_QUEUE_NAME = "audit-log";

export class QueueService {
  private auditQueue: Queue;

  constructor() {
    this.auditQueue = new Queue(AUDIT_QUEUE_NAME, { connection });
  }

  public async publish(jobName: string, data: any): Promise<void> {
    // Opciones del trabajo, incluyendo la estrategia de reintentos.
    const opts: JobsOptions = {
      removeOnComplete: true,
      removeOnFail: 1000, // Mantener los últimos 1000 trabajos fallidos
      // Retry strategy
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000, // 1s, 2s, 4s, 8s, 16s
      },
    };
    await this.auditQueue.add(jobName, data, opts);
  }

  public close(): Promise<void> {
    return this.auditQueue.close();
  }
}
