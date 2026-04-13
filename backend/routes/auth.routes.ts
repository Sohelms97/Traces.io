import express from "express";
import { login, logout, changePassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", changePassword);

export default router;
