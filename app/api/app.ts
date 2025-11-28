import express, { Express, Request, Response } from "express";
import cors from "cors";
import mainRouter from "./routes/main.router"; // Import the single main router
import { auditMiddleware } from "./infrastructure/http/middleware/audit.middleware";

// ========== Dependency Injection Setup ==========
import 'reflect-metadata'; // Required for InversifyJS
import { container } from "./infrastructure/di/container";
import { TYPES } from "./infrastructure/di/types";
import { getEventBus } from "./infrastructure/events/EventBus";
import { setupEventHandlers } from "./infrastructure/events/setupEventHandlers";
import { SystemCountersService } from "./application/SystemCountersService";

// Initialize DI container (eager loading)
// This ensures all singletons are created and the container is ready
console.log('🔧 Initializing DI container...');

// Initialize event system with services from container
const eventBus = getEventBus();
const countersService = container.get<SystemCountersService>(TYPES.SystemCountersService);
setupEventHandlers(eventBus, countersService);

console.log('✅ DI container initialized successfully');

const app: Express = express();

// CORS configuration for frontend integration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
      "http://localhost", // Nginx proxy
      "http://localhost:80", // Nginx proxy explicit
    ],
    credentials: true, // Allow cookies and authorization headers
    exposedHeaders: ["x-session-id"], // Expose custom headers to frontend
  })
);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to capture audit context
app.use(auditMiddleware);

// Mount the main router. All path logic (like /api) is handled inside it.
app.use(mainRouter);

// A simple health-check or root endpoint can remain here
app.get("/", (_req: Request, res: Response) => {
  res.send("HausPet is running!");
});

export default app;
