import { Router } from "express";
import petRouter from "./pet.router";

const router = Router();

// Mount all API entity routers here
router.use("/pets", petRouter);

export default router;
