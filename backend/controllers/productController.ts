import { Request, Response } from "express";
import { ProductModel, IProduct } from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { featured, category, limit, page } = req.query;
    
    // If it's a public request, we might want to filter by showOnWebsite
    // For ERP, we usually want all. Let's handle both.
    
    let query: any = ProductModel['collection'];

    if (featured === 'true') {
      query = query.where("featured", "==", true);
    }
    if (category) {
      query = query.where("category", "==", category);
    }

    query = query.orderBy("displayOrder", "asc");

    if (limit) {
      const l = parseInt(limit as string);
      const p = parseInt((page as string) || "1");
      query = query.limit(l).offset((p - 1) * l);
    }

    const snapshot = await query.get();
    const products = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
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

export const uploadMainImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete old image file if exists
    if (product.mainImage) {
      const oldPath = path.join(process.cwd(), product.mainImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const outputName = `product-main-${product.id}-${Date.now()}.jpg`;
    const outputPath = path.join(process.cwd(), 'uploads/products', outputName);

    await sharp(req.file.path)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove original upload
    fs.unlinkSync(req.file.path);

    const imagePath = `uploads/products/${outputName}`;
    await ProductModel.update(product.id!, { mainImage: imagePath });

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: { imagePath }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadGalleryImages = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided" });
    }

    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const newGalleryImages = [];
    const currentGallery = product.galleryImages || [];

    for (const file of files) {
      const outputName = `product-gallery-${product.id}-${Date.now()}-${Math.round(Math.random() * 1E4)}.jpg`;
      const outputPath = path.join(process.cwd(), 'uploads/products', outputName);

      await sharp(file.path)
        .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      fs.unlinkSync(file.path);

      newGalleryImages.push({
        url: `uploads/products/${outputName}`,
        caption: "",
        order: currentGallery.length + newGalleryImages.length
      });
    }

    await ProductModel.update(product.id!, { 
      galleryImages: [...currentGallery, ...newGalleryImages] 
    });

    res.json({
      success: true,
      message: "Gallery images uploaded successfully",
      data: newGalleryImages
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imgIndex } = req.params;
    const product = await ProductModel.findById(id);
    if (!product || !product.galleryImages) {
      return res.status(404).json({ success: false, message: "Product or gallery not found" });
    }

    const index = parseInt(imgIndex);
    if (isNaN(index) || index < 0 || index >= product.galleryImages.length) {
      return res.status(400).json({ success: false, message: "Invalid image index" });
    }

    const imageToDelete = product.galleryImages[index];
    const filePath = path.join(process.cwd(), imageToDelete.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const updatedGallery = product.galleryImages.filter((_, i) => i !== index);
    await ProductModel.update(id, { galleryImages: updatedGallery });

    res.json({ success: true, message: "Gallery image deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
