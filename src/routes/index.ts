import { Router } from "express";
import catRoutes from "./cat.routes";

const router = Router();

router.use("/cats", catRoutes);

export default router;
