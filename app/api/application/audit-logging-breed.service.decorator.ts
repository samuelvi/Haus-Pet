import { BreedService } from "./breed.service";
import { AuditService } from "./audit.service";
import { Breed, AnimalType } from "../domain/breed";
import { BreedFilters } from "../domain/breed-read.repository";
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

export class AuditLoggingBreedServiceDecorator {
  constructor(
    private readonly decoratedService: BreedService,
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
      await Promise.race([
        this.queueService.publish(jobName, auditData),
        timeout(500)
      ]);
      console.log(`[AUDIT SUCCESS] Event ${jobName} published to Redis queue.`);
    } catch (error) {
      console.error("[AUDIT FALLBACK] Redis unavailable or timed out. Writing directly to DB.", error);
      this.redisHealthService.isHealthy();
      await this.auditService.log(auditData);
    }
  }

  public async getAllBreeds(auditContext: AuditContext, filters?: BreedFilters): Promise<Breed[]> {
    const filterDesc = filters ? ` with filters: ${JSON.stringify(filters)}` : '';
    await this.audit("getAllBreeds", auditContext, `Attempting to get all breeds${filterDesc}.`);
    const result = await this.decoratedService.getAllBreeds(filters);
    await this.audit("getAllBreeds", auditContext, "", `Successfully retrieved ${result.length} breeds${filterDesc}.`);
    return result;
  }

  public async getBreedsByType(type: AnimalType, auditContext: AuditContext): Promise<Breed[]> {
    await this.audit("getBreedsByType", auditContext, `Attempting to get all breeds of type ${type}.`);
    const result = await this.decoratedService.getBreedsByType(type);
    await this.audit("getBreedsByType", auditContext, "", `Successfully retrieved ${result.length} breeds of type ${type}.`);
    return result;
  }

  public async getRandomBreed(auditContext: AuditContext): Promise<Breed | null> {
    await this.audit("getRandomBreed", auditContext, "Attempting to get a random breed.");
    const result = await this.decoratedService.getRandomBreed();
    await this.audit("getRandomBreed", auditContext, "", result ? `Successfully retrieved random breed: ${result.name}` : "No breeds found.");
    return result;
  }

  public async getRandomBreedByType(type: AnimalType, auditContext: AuditContext): Promise<Breed | null> {
    await this.audit("getRandomBreedByType", auditContext, `Attempting to get a random breed of type ${type}.`);
    const result = await this.decoratedService.getRandomBreedByType(type);
    await this.audit("getRandomBreedByType", auditContext, "", result ? `Successfully retrieved random breed: ${result.name}` : `No breeds of type ${type} found.`);
    return result;
  }

  public async addBreed(name: string, animalType: AnimalType, auditContext: AuditContext): Promise<Breed> {
    await this.audit("addBreed", auditContext, `Attempting to add breed: '${name}' of type '${animalType}'.`);
    try {
      const result = await this.decoratedService.addBreed(name, animalType);
      await this.audit("addBreed", auditContext, "", `Successfully added breed: ${result.name}.`);
      return result;
    } catch (error: any) {
      await this.audit("addBreed", auditContext, "", `Failed to add breed '${name}': ${error.message}`);
      throw error;
    }
  }

  public async getBreedById(id: string, auditContext: AuditContext): Promise<Breed | null> {
    await this.audit("getBreedById", auditContext, `Attempting to get breed with ID: ${id}.`);
    const result = await this.decoratedService.getBreedById(id);
    await this.audit("getBreedById", auditContext, "", result ? `Successfully retrieved breed: ${result.name}` : `Breed with ID ${id} not found.`);
    return result;
  }

  public async updateBreed(id: string, name: string, animalType: AnimalType, auditContext: AuditContext): Promise<Breed> {
    try {
      // Get current state before update
      const beforeState = await this.decoratedService.getBreedById(id);
      const beforeStateStr = beforeState ? JSON.stringify(beforeState) : "Breed not found";

      await this.audit("updateBreed", auditContext, `Attempting to update breed ID ${id}. Before: ${beforeStateStr}`);

      const result = await this.decoratedService.updateBreed(id, name, animalType);

      // Log the after state
      const afterStateStr = JSON.stringify(result);
      await this.audit("updateBreed", auditContext, beforeStateStr, `Successfully updated. After: ${afterStateStr}`);

      return result;
    } catch (error: any) {
      await this.audit("updateBreed", auditContext, "", `Failed to update breed ID ${id}: ${error.message}`);
      throw error;
    }
  }

  public async deleteBreed(id: string, auditContext: AuditContext): Promise<void> {
    try {
      // Get current state before deletion
      const beforeState = await this.decoratedService.getBreedById(id);
      const beforeStateStr = beforeState ? JSON.stringify(beforeState) : "Breed not found";

      await this.audit("deleteBreed", auditContext, `Attempting to delete breed ID ${id}. Before: ${beforeStateStr}`);

      await this.decoratedService.deleteBreed(id);

      await this.audit("deleteBreed", auditContext, beforeStateStr, `Successfully deleted. Breed is now removed.`);
    } catch (error: any) {
      await this.audit("deleteBreed", auditContext, "", `Failed to delete breed ID ${id}: ${error.message}`);
      throw error;
    }
  }
}
