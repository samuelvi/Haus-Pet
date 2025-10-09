import { Request, Response } from "express";
import { AuditLoggingPetServiceDecorator } from "../../../application/audit-logging-pet.service.decorator";
import { PetBreedAlreadyExistsError } from "../../../domain/errors/pet-breed-already-exists.error";
import { PetType } from "../../../domain/pet";

export class PetController {
  constructor(private readonly petService: AuditLoggingPetServiceDecorator) {}

  public async getAllPets(req: Request, res: Response): Promise<void> {
    try {
      const pets = await this.petService.getAllPets(req.auditContext!);
      res.status(200).json({ status: "OK", data: pets });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching pets" });
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

  public async addPet(req: Request, res: Response): Promise<void> {
    try {
      const { breed, type } = req.body;
      if (!breed || typeof breed !== 'string') {
        res.status(400).json({ status: "ERROR", message: "Invalid input: 'breed' must be a non-empty string" });
        return;
      }
      if (!type || !Object.values(PetType).includes(type)) {
        res.status(400).json({ status: "ERROR", message: `Invalid input: 'type' must be one of ${Object.values(PetType).join(', ')}` });
        return;
      }

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
}
