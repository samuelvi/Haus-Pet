import { Request, Response } from "express";
import { CatService } from "../../../application/cat.service";
import { CatBreedAlreadyExistsError } from "../../../domain/errors/cat-breed-already-exists.error";

export class CatController {
  constructor(private readonly catService: CatService) {}

  public async getAllBreeds(_req: Request, res: Response): Promise<void> {
    try {
      const cats = await this.catService.getAllCatBreeds();
      res.status(200).json({ status: "OK", data: cats });
    } catch (error) {
      res.status(500).json({ status: "ERROR", message: "Error fetching cat breeds" });
    }
  }

  public async getRandomBreed(_req: Request, res: Response): Promise<void> {
    try {
      const cat = await this.catService.getRandomCatBreed();
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

      const newCat = await this.catService.addCatBreed(breed);
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
