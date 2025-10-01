import { Router } from "express";

const router = Router();


const catBreeds: string[] = [
  "Siamese",
  "Persian",
  "Maine Coon",
  "Ragdoll",
  "Bengal",
  "Sphynx",
  "British Shorthair",
  "Abyssinian",
  "Scottish Fold",
  "Birman",
];

// Usage: http://localhost:3000/api/cats/random-cat
router.get("/random-cat", (_req, res) => {
  const randomIndex = Math.floor(Math.random() * catBreeds.length);
  const randomBreed = catBreeds[randomIndex];
  res.json({ breed: randomBreed });
});

export default router;
