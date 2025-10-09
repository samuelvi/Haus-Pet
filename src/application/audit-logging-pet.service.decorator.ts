import { PetService } from "./pet.service";
import { AuditService } from "./audit.service";
import { Pet, PetType } from "../domain/pet";
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

export class AuditLoggingPetServiceDecorator {
  constructor(
    private readonly decoratedService: PetService,
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

  public async getAllPets(auditContext: AuditContext): Promise<Pet[]> {
    await this.audit("getAllPets", auditContext, "Attempting to get all pets.");
    const result = await this.decoratedService.getAllPets();
    await this.audit("getAllPets", auditContext, "", `Successfully retrieved ${result.length} pets.`);
    return result;
  }

  public async getPetsByType(type: PetType, auditContext: AuditContext): Promise<Pet[]> {
    await this.audit("getPetsByType", auditContext, `Attempting to get all pets of type ${type}.`);
    const result = await this.decoratedService.getPetsByType(type);
    await this.audit("getPetsByType", auditContext, "", `Successfully retrieved ${result.length} pets of type ${type}.`);
    return result;
  }

  public async getRandomPet(auditContext: AuditContext): Promise<Pet | null> {
    await this.audit("getRandomPet", auditContext, "Attempting to get a random pet.");
    const result = await this.decoratedService.getRandomPet();
    await this.audit("getRandomPet", auditContext, "", result ? `Successfully retrieved random pet: ${result.breed}` : "No pets found.");
    return result;
  }

  public async getRandomPetByType(type: PetType, auditContext: AuditContext): Promise<Pet | null> {
    await this.audit("getRandomPetByType", auditContext, `Attempting to get a random pet of type ${type}.`);
    const result = await this.decoratedService.getRandomPetByType(type);
    await this.audit("getRandomPetByType", auditContext, "", result ? `Successfully retrieved random pet: ${result.breed}` : `No pets of type ${type} found.`);
    return result;
  }

  public async addPet(breed: string, type: PetType, auditContext: AuditContext): Promise<Pet> {
    await this.audit("addPet", auditContext, `Attempting to add pet: '${breed}' of type '${type}'.`);
    try {
      const result = await this.decoratedService.addPet(breed, type);
      await this.audit("addPet", auditContext, "", `Successfully added pet: ${result.breed}.`);
      return result;
    } catch (error: any) {
      await this.audit("addPet", auditContext, "", `Failed to add pet '${breed}': ${error.message}`);
      throw error;
    }
  }
}
