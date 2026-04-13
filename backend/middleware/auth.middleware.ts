import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const requirePermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const permissions = req.user.permissions;
    if (!permissions) {
      // Admin bypass or default check
      if (req.user.role === 'admin') return next();
      return res.status(403).json({ success: false, message: "No permissions defined" });
    }

    const userPermission = permissions[module];
    
    const levels: Record<string, number> = {
      "none": 0,
      "read": 1,
      "write": 2,
      "delete": 3
    };

    const requiredLevel = levels[action] || 0;
    const userLevel = levels[userPermission] || 0;

    if (userLevel < requiredLevel && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions for ${module}:${action}`
      });
    }

    next();
  };
};
