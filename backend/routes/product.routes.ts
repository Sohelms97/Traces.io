import express from "express";
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  uploadMainImage,
  uploadGalleryImages,
  deleteGalleryImage
} from "../controllers/productController";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { upload } from "../config/multer";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Protected routes
router.post("/", authenticate, requirePermission('products', 'write'), createProduct);
router.put("/:id", authenticate, requirePermission('products', 'write'), updateProduct);
router.delete("/:id", authenticate, requirePermission('products', 'delete'), deleteProduct);

// Upload main image
router.post('/:id/image',
  authenticate,
  requirePermission('products', 'write'),
  upload.single('mainImage'),
  uploadMainImage
);

// Upload gallery images (multiple)
router.post('/:id/gallery',
  authenticate,
  requirePermission('products', 'write'),
  upload.array('galleryImages', 10),
  uploadGalleryImages
);

// Delete gallery image
router.delete('/:id/gallery/:imgIndex',
  authenticate,
  requirePermission('products', 'write'),
  deleteGalleryImage
);

export default router;
