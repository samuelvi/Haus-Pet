import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import mainRouter from "./routes/main.router"; // Import the single main router
import { auditMiddleware } from "./infrastructure/http/middleware/audit.middleware";
import { errorHandler } from "./infrastructure/http/middleware/error-handler.middleware";
import { httpLogger } from "./infrastructure/http/middleware/http-logger.middleware";

// ========== Dependency Injection Setup ==========
import 'reflect-metadata'; // Required for InversifyJS
import { container } from "./infrastructure/di/container";
import { TYPES } from "./infrastructure/di/types";
import { getEventBus } from "./infrastructure/events/EventBus";
import { setupEventHandlers } from "./infrastructure/events/setupEventHandlers";
import { SystemCountersService } from "./application/SystemCountersService";
import logger from "./infrastructure/logger/logger";

// Initialize DI container (eager loading)
// This ensures all singletons are created and the container is ready
logger.info('Initializing DI container...');

try {
  // Initialize event system with services from container
  logger.info('Getting EventBus...');
  const eventBus = getEventBus();
  logger.info('EventBus obtained successfully');

  logger.info('Getting SystemCountersService from container...');
  const countersService = container.get<SystemCountersService>(TYPES.SystemCountersService);
  logger.info('SystemCountersService obtained successfully');

  logger.info('Setting up event handlers...');
  setupEventHandlers(eventBus, countersService);
  logger.info('Event handlers setup successfully');

  logger.info('DI container initialized successfully');
} catch (error) {
  logger.fatal({ error }, 'Failed to initialize DI container');
  process.exit(1);
}

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

// HTTP request/response logging (should be early in middleware chain)
app.use(httpLogger);

// Middleware to capture audit context
app.use(auditMiddleware);

// Serve static files from frontend's public directory
// In Docker, images are mounted at /app/frontend-images
// In local development, they're at ../frontend/public/img
const frontendImagesPath = process.env.NODE_ENV === 'development'
  ? '/app/frontend-images'
  : path.join(__dirname, '..', 'frontend', 'public', 'img');
app.use('/img', express.static(frontendImagesPath));

// Mount the main router. All path logic (like /api) is handled inside it.
app.use(mainRouter);

// A simple health-check or root endpoint can remain here
app.get("/", (_req: Request, res: Response) => {
  res.send("HausPet is running!");
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
