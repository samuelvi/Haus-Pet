import { Router } from "express";
import { CatController } from "../infrastructure/http/controllers/cat.controller";
import { CatService } from "../application/cat.service";
import { createCatRepository } from "../infrastructure/repositories/repository.factory";

const router = Router();

// --- Dependency Injection / Composition Root ---

const catRepository = createCatRepository();
const catService = new CatService(catRepository);
const catController = new CatController(catService);

// Define the routes
router.get(
  "/", // GET /api/cats/
  (req, res) => catController.getAllBreeds(req, res)
);

router.get(
  "/random-cat", // GET /api/cats/random-cat
  (req, res) => catController.getRandomBreed(req, res)
);

router.post(
  "/add", // POST /api/cats/add
  (req, res) => catController.addBreed(req, res)
);

export default router;
