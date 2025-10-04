import { Queue } from "bullmq";
import connection from "./redis-connection";

const AUDIT_QUEUE_NAME = "audit-log";

export class QueueService {
  private auditQueue: Queue;

  constructor() {
    this.auditQueue = new Queue(AUDIT_QUEUE_NAME, { connection });
  }

  public async publish(jobName: string, data: any): Promise<void> {
    // Opciones del trabajo: eliminar de la cola si se completa con éxito.
    const opts = {
      removeOnComplete: true,
      removeOnFail: 1000, // Mantener los últimos 1000 trabajos fallidos
    };
    await this.auditQueue.add(jobName, data, opts);
  }

  public close(): Promise<void> {
    return this.auditQueue.close();
  }
}
