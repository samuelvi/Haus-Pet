import { Router, Request, Response } from "express";
import { AuthController } from "../../infrastructure/http/controllers/auth.controller";
import { AuthService } from "../../application/auth/auth.service";
import { PostgresUserRepository } from "../../infrastructure/auth/repositories/postgres-user.repository";
import { PasswordHasherService } from "../../infrastructure/auth/services/password-hasher.service";
import { JwtService } from "../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../infrastructure/auth/services/session.service";
import { createAuthMiddleware } from "../../infrastructure/http/middleware/auth.middleware";
import prisma from "../../infrastructure/database/prisma-client";

const router = Router();

// --- Dependency Injection / Composition Root ---

// Repositories
const userRepository = new PostgresUserRepository(prisma);

// Services
const passwordHasher = new PasswordHasherService();
const jwtService = new JwtService();
const sessionService = new SessionService();

// Application service
const authService = new AuthService(
  userRepository,
  passwordHasher,
  jwtService,
  sessionService
);

// Controller
const authController = new AuthController(authService);

// Middleware
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// --- Public Routes (no authentication required) ---

/**
 * POST /api/auth/signup
 * Register a new user
 * Body: { email: string, password: string, name: string, role?: "ADMIN" | "USER" }
 */
router.post("/signup", (req: Request, res: Response) =>
  authController.signup(req, res)
);

/**
 * POST /api/auth/login
 * Authenticate a user
 * Body: { email: string, password: string }
 */
router.post("/login", (req: Request, res: Response) =>
  authController.login(req, res)
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 * Headers: x-session-id
 * Body: { refreshToken: string }
 */
router.post("/refresh", (req: Request, res: Response) =>
  authController.refresh(req, res)
);

// --- Protected Routes (authentication required) ---

/**
 * POST /api/auth/logout
 * Logout current user (destroys session)
 * Headers: Authorization: Bearer <token>, x-session-id
 */
router.post("/logout", authMiddleware, (req: Request, res: Response) =>
  authController.logout(req, res)
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Headers: Authorization: Bearer <token>, x-session-id
 */
router.get("/me", authMiddleware, (req: Request, res: Response) =>
  authController.getCurrentUser(req, res)
);

export default router;
