import { Router } from "express";
import petRouter from "./pet.router";
import authRouter from "./auth.router";
import animalRouter from "./animal.router";
import sponsorshipRouter from "./sponsorship.router";
import adminAnimalRouter from "./admin/animal.router";

const router = Router();

// Mount all API entity routers here
router.use("/auth", authRouter);
router.use("/pets", petRouter);
router.use("/animals", animalRouter);
router.use("/sponsorships", sponsorshipRouter);

// Admin routes (TODO: add auth middleware)
router.use("/admin/animals", adminAnimalRouter);

export default router;
