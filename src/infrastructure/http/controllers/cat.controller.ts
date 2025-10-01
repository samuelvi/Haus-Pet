import { Request, Response } from "express";
import { CatService } from "../../../application/cat.service";

export class CatController {
  constructor(private readonly catService: CatService) {}

  public async getRandomBreed(_req: Request, res: Response): Promise<void> {
    try {
      const cat = await this.catService.getRandomCatBreed();
      if (cat) {
        res.status(200).json(cat);
      } else {
        res.status(404).json({ message: "No cat breeds found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching random cat breed" });
    }
  }
}
