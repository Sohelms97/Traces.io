import express from "express";
import { getTraceabilityByProduct, updateTraceability } from "../controllers/traceabilityController";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/product/:productId", authenticate, requirePermission('traceability', 'read'), getTraceabilityByProduct);
router.put("/:id", authenticate, requirePermission('traceability', 'write'), updateTraceability);

export default router;
