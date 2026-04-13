import express from "express";
import { uploadTeamPhoto } from "../controllers/teamController";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { upload } from "../config/multer";

const router = express.Router();

router.post("/:id/photo", authenticate, requirePermission('cms', 'write'), upload.single('profilePhoto'), uploadTeamPhoto);

export default router;
