import { Request, Response } from "express";
import { AuditLoggingCatServiceDecorator } from "../../../application/audit-logging-cat.service.decorator";
import { CatBreedAlreadyExistsError } from "../../../domain/errors/cat-breed-already-exists.error";

export class CatController {
  constructor(private readonly catService: AuditLoggingCatServiceDecorator) {}

  public async getAllBreeds(req: Request, res: Response): Promise<void> {
    try {
      const cats = await this.catService.getAllCatBreeds(req.auditContext!);
      res.status(200).json({ status: "OK", data: cats });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching cat breeds" });
    }
  }

  public async getRandomBreed(req: Request, res: Response): Promise<void> {
    try {
      const cat = await this.catService.getRandomCatBreed(req.auditContext!);
      if (cat) {
        res.status(200).json({ status: "OK", data: cat });
      } else {
        res.status(404).json({ status: "ERROR", message: "No cat breeds found" });
      }
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching random cat breed" });
    }
  }

  public async addBreed(req: Request, res: Response): Promise<void> {
    try {
      const { breed } = req.body;
      if (!breed || typeof breed !== 'string') {
        res.status(400).json({ status: "ERROR", message: "Invalid input: 'breed' must be a non-empty string" });
        return;
      }

      const newCat = await this.catService.addCatBreed(breed, req.auditContext!);
      res.status(201).json({ status: "OK", data: { message: "Cat breed added successfully", cat: newCat } });
    } catch (error: any) {
      if (error instanceof CatBreedAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message }); // 409 Conflict
      } else {
        res.status(500).json({ status: "ERROR", message: "Error adding cat breed" });
      }
    }
  }
}
