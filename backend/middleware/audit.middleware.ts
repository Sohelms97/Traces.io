import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AuditLogModel } from "../models/AuditLog";

export const auditLog = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // We log after the response is sent if it was successful
    const originalSend = res.send;
    
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLogModel.log({
          user: req.user?.id,
          username: req.user?.username,
          action,
          module,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          recordId: req.params.id || undefined,
          changes: req.method !== "GET" ? req.body : undefined
        }).catch(err => console.error("Audit logging failed:", err));
      }
      return originalSend.call(this, body);
    };
    
    next();
  };
};
