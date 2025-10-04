import { CatService } from "./cat.service";
import { AuditService } from "./audit.service";
import { Cat } from "../domain/cat";
import { QueueService } from "../infrastructure/queue/queue.service";
import { RedisHealthService } from "../infrastructure/queue/redis-health.service";

interface AuditContext {
  ipAddress?: string;
  httpMethod: string;
  path: string;
  requestBody?: string;
}

export class AuditLoggingCatServiceDecorator {
  constructor(
    private readonly decoratedService: CatService,
    private readonly auditService: AuditService, // For synchronous fallback
    private readonly queueService: QueueService, // For asynchronous publishing
    private readonly redisHealthService: RedisHealthService
  ) {}

  private async audit(jobName: string, auditContext: AuditContext, beforeState: string, afterState?: string) {
    const auditData = { ...auditContext, beforeState, afterState };

    if (this.redisHealthService.isCircuitOpen) {
      console.warn("Redis circuit is open. Falling back to synchronous audit logging.");
      await this.auditService.log(auditData); // Fallback
      return;
    }

    try {
      // Fire-and-forget publish to Redis
      this.queueService.publish(jobName, auditData);
    } catch (error) {
      console.error("Failed to publish audit event to Redis. Falling back to synchronous logging.", error);
      this.redisHealthService.isHealthy(); // Record the failure
      await this.auditService.log(auditData); // Fallback
    }
  }

  public async getAllCatBreeds(auditContext: AuditContext): Promise<Cat[]> {
    await this.audit("getAllBreeds", auditContext, "Attempting to get all cat breeds.");
    const result = await this.decoratedService.getAllCatBreeds();
    await this.audit("getAllBreeds", auditContext, "", `Successfully retrieved ${result.length} breeds.`);
    return result;
  }

  public async getRandomCatBreed(auditContext: AuditContext): Promise<Cat | null> {
    await this.audit("getRandomBreed", auditContext, "Attempting to get a random cat breed.");
    const result = await this.decoratedService.getRandomCatBreed();
    await this.audit("getRandomBreed", auditContext, "", result ? `Successfully retrieved random breed: ${result.breed}` : "No breeds found.");
    return result;
  }

  public async addCatBreed(breed: string, auditContext: AuditContext): Promise<Cat> {
    await this.audit("addBreed", auditContext, `Attempting to add breed: '${breed}'.`);
    try {
      const result = await this.decoratedService.addCatBreed(breed);
      await this.audit("addBreed", auditContext, "", `Successfully added breed: ${result.breed}.`);
      return result;
    } catch (error: any) {
      await this.audit("addBreed", auditContext, "", `Failed to add breed '${breed}': ${error.message}`);
      throw error;
    }
  }
}
