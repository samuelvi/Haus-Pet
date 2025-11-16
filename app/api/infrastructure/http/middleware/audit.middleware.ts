import { Request, Response, NextFunction } from "express";

// Extend the Express Request type to include our custom property
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        ipAddress?: string;
        httpMethod: string;
        path: string;
        requestBody?: string;
      };
    }
  }
}

export const auditMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.auditContext = {
    ipAddress: req.ip,
    httpMethod: req.method,
    path: req.originalUrl,
    requestBody: req.body ? JSON.stringify(req.body) : undefined,
  };
  next();
};
