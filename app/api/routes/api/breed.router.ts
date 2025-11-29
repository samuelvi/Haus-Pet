import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../infrastructure/di/container";
import { TYPES } from "../../infrastructure/di/types";
import { BreedController } from "../../infrastructure/http/controllers/breed.controller";
import { JwtService } from "../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../infrastructure/auth/services/session.service";
import { createAuthMiddleware } from "../../infrastructure/http/middleware/auth.middleware";

const router = Router();

// --- Dependency Injection via Container ---
const breedController = container.get<BreedController>(TYPES.BreedController);

// Authentication middleware
const jwtService = new JwtService();
const sessionService = new SessionService();
const authMiddleware = createAuthMiddleware(jwtService, sessionService);

// --- Middleware to validate pet type ---
const validatePetType = (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  if (!type || typeof type !== "string" || type.trim().length === 0) {
    return res.status(400).json({ status: "ERROR", message: "Invalid pet type" });
  }
  next();
};

// --- Middleware to validate breed ID (UUID) ---
const validateBreedId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;

  // UUID regex pattern (UUIDv4/v7 format)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
  }

  next();
};

// --- Generic Routes ---
// GET routes are PUBLIC (read-only access for everyone)
router.get("/", (req: Request, res: Response) => breedController.getAllBreeds(req, res));
router.get("/random-breed", (req: Request, res: Response) => breedController.getRandomBreed(req, res));
router.get("/check-similar", (req: Request, res: Response) => breedController.checkSimilarBreeds(req, res));

// POST routes are PROTECTED (admin only)
router.post("/add", authMiddleware, (req: Request, res: Response) => breedController.addBreed(req, res));

// --- Type-Specific Routes (MUST come before /:id to avoid conflicts) ---
// GET routes are PUBLIC
router.get("/:type/random-breed", validatePetType, (req: Request, res: Response) => breedController.getRandomBreedByType(req, res));

// POST routes are PROTECTED
router.post("/:type/add", authMiddleware, validatePetType, (req: Request, res: Response) => breedController.addBreedToType(req, res));

// --- ID-Based Routes (MUST come last due to /:id param) ---
// GET by type or ID: if it's a valid type, handle as type; otherwise validate as ID
router.get("/:idOrType", (req: Request, res: Response, next: NextFunction) => {
  const param = req.params.idOrType;

  // Check if it's a valid pet type
  if (param && param.length > 0 && !param.includes("-")) {
    // Remap parameter for controller
    req.params.type = param;
    return breedController.getBreedsByType(req, res);
  }

  // Otherwise, validate as UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(param)) {
    return res.status(400).json({ status: "ERROR", message: "Invalid breed ID: must be a valid UUID" });
  }

  // Remap parameter for controller
  req.params.id = param;
  return breedController.getBreedById(req, res);
});

// PUT/DELETE routes are PROTECTED (admin only)
router.put("/:id", authMiddleware, validateBreedId, (req: Request, res: Response) => breedController.updateBreed(req, res));
router.delete("/:id", authMiddleware, validateBreedId, (req: Request, res: Response) => breedController.deleteBreed(req, res));

export default router;
