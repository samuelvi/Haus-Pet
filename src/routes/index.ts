import { Router } from "express";
import catRoutes from "./cat.routes";

const router = Router();

// Aquí se pueden añadir más rutas
router.use("/cats", catRoutes);

export default router;
