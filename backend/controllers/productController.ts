import { Request, Response } from "express";
import { ProductModel, IProduct } from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.getAll();
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const productData: Partial<IProduct> = {
      ...req.body,
      createdBy: req.user?.id,
    };
    const id = await ProductModel.create(productData);
    res.status(201).json({ success: true, data: { id, ...productData } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    await ProductModel.update(id, req.body);
    res.json({ success: true, message: "Product updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await ProductModel.delete(req.params.id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
