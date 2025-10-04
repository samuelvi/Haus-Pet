import express, { Express, Request, Response } from "express";
import apiRoutes from "./routes";
import { auditMiddleware } from "./infrastructure/http/middleware/audit.middleware";

const app: Express = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to capture audit context
app.use(auditMiddleware);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World");
});

// Usar las rutas de la API
app.use("/api", apiRoutes);

export default app;
