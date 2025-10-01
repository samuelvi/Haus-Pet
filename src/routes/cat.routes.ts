import { Router } from "express";
import { CatController } from "../infrastructure/http/controllers/cat.controller";
import { CatService } from "../application/cat.service";
import { InMemoryCatRepository } from "../infrastructure/repositories/in-memory-cat.repository";

const router = Router();

// Dependency Injection / Composition Root
const catRepository = new InMemoryCatRepository();
const catService = new CatService(catRepository);
const catController = new CatController(catService);

// Define the routes
router.get(
  "/random-cat",
  (req, res) => catController.getRandomBreed(req, res)
);

router.post(
  "/add", // POST to /api/cats/add
  (req, res) => catController.addBreed(req, res)
);

export default router;
