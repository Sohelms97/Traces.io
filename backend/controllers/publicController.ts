import { Request, Response } from "express";
import { ProductModel } from "../models/Product";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { 
      featured, 
      category,
      limit = 6,
      page = 1
    } = req.query;
    
    let query: any = ProductModel['collection'].where("showOnWebsite", "==", true);
    
    if (featured === 'true') {
      query = query.where("featured", "==", true);
    }
    if (category && category !== 'all') {
      query = query.where("category", "==", category);
    }
    
    query = query.orderBy("displayOrder", "asc").orderBy("createdAt", "desc");
    
    const l = parseInt(limit as string);
    const p = parseInt(page as string);
    
    const snapshot = await query.limit(l).offset((p - 1) * l).get();
    const products = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId,
        name: data.name,
        category: data.category,
        origin: data.origin,
        mainImage: data.mainImage,
        shortDescription: data.shortDescription,
        features: data.features,
        traceStatus: data.traceStatus,
        featured: data.featured,
        displayOrder: data.displayOrder,
        seoSlug: data.seoSlug,
        supplierName: data.supplierName,
        status: data.status
      };
    });
    
    const totalSnapshot = await ProductModel['collection'].where("showOnWebsite", "==", true).get() as any;
    const total = totalSnapshot.size;
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l)
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
