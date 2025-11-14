import { Router } from "express";
import petRouter from "./pet.router";
import authRouter from "./auth.router";

const router = Router();

// Mount all API entity routers here
router.use("/auth", authRouter);
router.use("/pets", petRouter);

export default router;
