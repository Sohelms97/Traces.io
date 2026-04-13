import express from "express";
import { getProducts } from "../controllers/publicController";

const router = express.Router();

router.get("/products", getProducts);

export default router;
