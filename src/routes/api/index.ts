import { Router } from "express";
import catRouter from "./cat.router";

const router = Router();

// Mount all API entity routers here
router.use("/cats", catRouter);

export default router;
