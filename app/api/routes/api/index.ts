import { Router } from "express";
import breedRouter from "./breed.router";
import authRouter from "./auth.router";
import petRouter from "./pet.router";
import sponsorshipRouter from "./sponsorship.router";
import adminPetRouter from "./admin/pet.router";

const router = Router();

// Mount all API entity routers here
router.use("/auth", authRouter);
router.use("/breeds", breedRouter);
router.use("/pets", petRouter);
router.use("/sponsorships", sponsorshipRouter);

// Admin routes (TODO: add auth middleware)
router.use("/admin/pets", adminPetRouter);

export default router;
