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

// Helper function to create a timeout promise
const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms} ms`)), ms));

export class AuditLoggingCatServiceDecorator {
  constructor(
    private readonly decoratedService: CatService,
    private readonly auditService: AuditService, // For synchronous fallback
    private readonly queueService: QueueService, // For asynchronous publishing
    private readonly redisHealthService: RedisHealthService
  ) {}

  private async audit(jobName: string, auditContext: AuditContext, beforeState: string, afterState?: string) {
    const auditData = {
      timestamp: new Date(),
      ...auditContext,
      beforeState,
      afterState,
    };

    if (this.redisHealthService.isCircuitOpen) {
      console.warn("[AUDIT FALLBACK] Circuit breaker is open. Writing directly to DB.");
      await this.auditService.log(auditData);
      return;
    }

    try {
      // Race the publish operation against a 500ms timeout.
      // This ensures the API remains fast, but we can still catch errors.
      await Promise.race([
        this.queueService.publish(jobName, auditData),
        timeout(500)
      ]);
      console.log(`[AUDIT SUCCESS] Event ${jobName} published to Redis queue.`);
    } catch (error) {
      console.error("[AUDIT FALLBACK] Redis unavailable or timed out. Writing directly to DB.", error);
      // Check health to potentially open the circuit breaker on next requests
      this.redisHealthService.isHealthy();
      // Execute the synchronous fallback to avoid data loss
      await this.auditService.log(auditData);
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
