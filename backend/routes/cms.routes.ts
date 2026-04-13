import express from "express";
import { getCMSSection, updateCMSSection, getAllCMS } from "../controllers/cmsController";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.get("/:section", getCMSSection);

// Protected routes
router.put("/:section", authenticate, updateCMSSection);
router.get("/all", authenticate, getAllCMS);

export default router;
