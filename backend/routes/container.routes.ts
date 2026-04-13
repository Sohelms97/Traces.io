import express from "express";
import { getContainers, getContainer, createContainer, updateContainer, deleteContainer } from "../controllers/containerController";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticate);

router.get("/", getContainers);
router.get("/:id", getContainer);
router.post("/", createContainer);
router.put("/:id", updateContainer);
router.delete("/:id", deleteContainer);

export default router;
