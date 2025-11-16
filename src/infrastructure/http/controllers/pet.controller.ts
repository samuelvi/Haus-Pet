import { Request, Response } from "express";
import { AuditLoggingPetServiceDecorator } from "../../../application/audit-logging-pet.service.decorator";
import { PetBreedAlreadyExistsError } from "../../../domain/errors/pet-breed-already-exists.error";
import { PetType } from "../../../domain/pet";
import { PetFilters } from "../../../domain/pet-read.repository";
import { petSchema, petIdSchema } from "../validators/pet.validator";
import { z } from "zod";

export class PetController {
  constructor(private readonly petService: AuditLoggingPetServiceDecorator) {}

  public async getAllPets(req: Request, res: Response): Promise<void> {
    try {
      const filters: PetFilters = {};

      // Extract query parameters
      if (req.query.type && typeof req.query.type === 'string') {
        const type = req.query.type.toLowerCase();
        if (Object.values(PetType).includes(type as PetType)) {
          filters.type = type as PetType;
        }
      }

      if (req.query.search && typeof req.query.search === 'string') {
        filters.search = req.query.search.trim();
      }

      const pets = await this.petService.getAllPets(req.auditContext!, filters);
      res.status(200).json({ status: "OK", data: pets });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching pets" });
    }
  }

  public async getPetsByType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as PetType;
    try {
      const pets = await this.petService.getPetsByType(type, req.auditContext!);
      res.status(200).json({ status: "OK", data: pets });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: `Error fetching ${type}s` });
    }
  }

  public async getRandomPet(req: Request, res: Response): Promise<void> {
    try {
      const pet = await this.petService.getRandomPet(req.auditContext!);
      if (pet) {
        res.status(200).json({ status: "OK", data: pet });
      } else {
        res.status(404).json({ status: "ERROR", message: "No pets found" });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching random pet" });
    }
  }

  public async getRandomPetByType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as PetType;
    try {
      const pet = await this.petService.getRandomPetByType(type, req.auditContext!);
      if (pet) {
        res.status(200).json({ status: "OK", data: pet });
      } else {
        res.status(404).json({ status: "ERROR", message: `No ${type}s found` });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: `Error fetching random ${type}` });
    }
  }

  public async addPet(req: Request, res: Response): Promise<void> {
    try {
      // Validate input with Zod
      const validation = petSchema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400).json({ status: "ERROR", message: `Validation failed: ${errors}` });
        return;
      }

      const { breed, type } = validation.data;
      const newPet = await this.petService.addPet(breed, type, req.auditContext!);
      res.status(201).json({ status: "OK", data: { message: "Pet added successfully", pet: newPet } });
    } catch (error: any) {
      if (error instanceof PetBreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message }); // 409 Conflict
      } else {
        res.status(500).json({ status: "ERROR", message: "Error adding pet" });
      }
    }
  }

  public async addPetToType(req: Request, res: Response): Promise<void> {
    const type = req.params.type as PetType;
    try {
      const { breed } = req.body;
      if (!breed || typeof breed !== 'string') {
        res.status(400).json({ status: "ERROR", message: "Invalid input: 'breed' must be a non-empty string" });
        return;
      }

      const newPet = await this.petService.addPet(breed, type, req.auditContext!);
      res.status(201).json({ status: "OK", data: { message: `${type} added successfully`, pet: newPet } });
    } catch (error: any) {
      if (error instanceof PetBreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message }); // 409 Conflict
      } else {
        res.status(500).json({ status: "ERROR", message: `Error adding ${type}` });
      }
    }
  }

  public async getPetById(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const validation = petIdSchema.safeParse(req.params);
      if (!validation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid pet ID: must be a positive integer" });
        return;
      }

      const { id } = validation.data;
      const pet = await this.petService.getPetById(id, req.auditContext!);
      if (pet) {
        res.status(200).json({ status: "OK", data: pet });
      } else {
        res.status(404).json({ status: "ERROR", message: "Pet not found" });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching pet" });
    }
  }

  public async updatePet(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const idValidation = petIdSchema.safeParse(req.params);
      if (!idValidation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid pet ID: must be a positive integer" });
        return;
      }

      // Validate body
      const bodyValidation = petSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        const errors = bodyValidation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        res.status(400).json({ status: "ERROR", message: `Validation failed: ${errors}` });
        return;
      }

      const { id } = idValidation.data;
      const { breed, type } = bodyValidation.data;

      const updatedPet = await this.petService.updatePet(id, breed, type, req.auditContext!);
      res.status(200).json({ status: "OK", data: { message: "Pet updated successfully", pet: updatedPet } });
    } catch (error: any) {
      if (error.message === "Pet not found") {
        res.status(404).json({ status: "ERROR", message: error.message });
      } else if (error instanceof PetBreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message });
      } else {
        res.status(500).json({ status: "ERROR", message: "Error updating pet" });
      }
    }
  }

  public async deletePet(req: Request, res: Response): Promise<void> {
    try {
      // Validate ID parameter
      const validation = petIdSchema.safeParse(req.params);
      if (!validation.success) {
        res.status(400).json({ status: "ERROR", message: "Invalid pet ID: must be a positive integer" });
        return;
      }

      const { id } = validation.data;
      await this.petService.deletePet(id, req.auditContext!);
      res.status(200).json({ status: "OK", data: { message: "Pet deleted successfully" } });
    } catch (error: any) {
      if (error.message === "Pet not found") {
        res.status(404).json({ status: "ERROR", message: error.message });
      } else {
        res.status(500).json({ status: "ERROR", message: "Error deleting pet" });
      }
    }
  }
}
