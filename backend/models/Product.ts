import { db } from "../config/database";

export interface IProduct {
  id?: string;
  productId: string;
  name: string;
  arabicName?: string;
  category: string;
  subCategory?: string;
  sku: string;
  barcode?: string;
  status: 'available' | 'seasonal' | 'out_of_stock' | 'discontinued';
  showOnWebsite: boolean;
  featured: boolean;
  displayOrder: number;
  shortDescription?: string;
  fullDescription?: string;
  features?: string[];
  specifications?: { name: string; value: string }[];
  certifications?: string[];
  origin?: string;
  originRegion?: string;
  sourceType?: string;
  supplierId?: string;
  supplierName?: string;
  mainImage?: string;
  galleryImages?: { url: string; caption: string; order: number }[];
  videoUrl?: string;
  documents?: { name: string; type: string; filePath: string; isPublic: boolean }[];
  avgPurchasePrice?: number;
  avgSalePrice?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug: string;
  seoKeywords?: string[];
  createdBy?: string;
  createdAt: any;
  updatedAt: any;
}

export class ProductModel {
  private static collection = db.collection("products");

  static async getAll(): Promise<IProduct[]> {
    const snapshot = await this.collection.orderBy("displayOrder", "asc").get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as object) } as IProduct));
  }

  static async findById(id: string): Promise<IProduct | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as object) } as IProduct;
  }

  static async findBySlug(slug: string): Promise<IProduct | null> {
    const snapshot = await this.collection.where("seoSlug", "==", slug).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as object) } as IProduct;
  }

  static async create(data: Partial<IProduct>): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async update(id: string, data: Partial<IProduct>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  static async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
