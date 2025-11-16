import { Router } from "express";
import apiRouter from "./api"; // Import the combined API router

const router = Router();

// Mount the API router under the /api prefix
router.use("/api", apiRouter);

// In the future, you could mount other routers here
// router.use("/web", webRouter);

export default router;
