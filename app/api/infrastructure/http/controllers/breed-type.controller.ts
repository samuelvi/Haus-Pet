import { Request, Response, NextFunction } from "express";
import { BreedTypeService } from "../../../application/breed-type.service";

export class BreedTypeController {
  constructor(private readonly service: BreedTypeService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = await this.service.list();
      res.json({ status: "OK", data: types });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        res.status(400).json({ status: "ERROR", message: "name is required" });
        return;
      }
      const created = await this.service.create(name.trim());
      res.status(201).json({ status: "OK", data: created });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        res.status(400).json({ status: "ERROR", message: "name is required" });
        return;
      }
      const updated = await this.service.update(id, name.trim());
      res.json({ status: "OK", data: updated });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ status: "ERROR", message: "Breed type not found" });
        return;
      }
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          res.status(404).json({ status: "ERROR", message: "Breed type not found" });
          return;
        }
        if (error.message.includes("associated breeds")) {
          res.status(400).json({ status: "ERROR", message: error.message });
          return;
        }
      }
      next(error);
    }
  };
}
