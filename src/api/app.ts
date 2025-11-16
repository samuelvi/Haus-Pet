import express, { Express, Request, Response } from "express";
import cors from "cors";
import mainRouter from "./routes/main.router"; // Import the single main router
import { auditMiddleware } from "./infrastructure/http/middleware/audit.middleware";

const app: Express = express();

// CORS configuration for frontend integration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
    credentials: true, // Allow cookies and authorization headers
    exposedHeaders: ["x-session-id"], // Expose custom headers to frontend
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to capture audit context
app.use(auditMiddleware);

// Mount the main router. All path logic (like /api) is handled inside it.
app.use(mainRouter);

// A simple health-check or root endpoint can remain here
app.get("/", (_req: Request, res: Response) => {
  res.send("HausPet is running!");
});

export default app;
