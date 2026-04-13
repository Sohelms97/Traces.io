import { db } from "../config/database";

export interface IContainer {
  id?: string;
  containerId: string;
  containerNumber: string;
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  itemDescription?: string;
  itemCategory?: 'Seafood' | 'Vegetables' | 'Frozen' | 'Processed' | 'Other';
  originCountry?: string;
  unit?: 'KG' | 'Box' | 'Piece' | 'MT';
  purchaseQty?: number;
  price?: number;
  rebatePrice?: number;
  afterRebatePrice?: number;
  purchaseValue?: number;
  clearingCharges?: number;
  commission?: number;
  totalCost?: number;
  saleQty?: number;
  salePrice?: number;
  totalSales?: number;
  grossProfit?: number;
  gpWithoutRebate?: number;
  roi?: number;
  monthlyRoi?: number;
  customerId?: string;
  customerName?: string;
  status: 'Open' | 'Closed' | 'In Transit' | 'Damaged';
  month?: string;
  year?: number;
  remarks?: string;
  linkedInvestors?: string[];
  documents?: any[];
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export class ContainerModel {
  private static collection = db.collection("containers");

  static async getAll(filters: any = {}): Promise<IContainer[]> {
    let query: any = this.collection;
    
    if (filters.status) query = query.where("status", "==", filters.status);
    if (filters.month) query = query.where("month", "==", filters.month);
    
    const snapshot = await query.orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as object) } as IContainer));
  }

  static async findById(id: string): Promise<IContainer | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as object) } as IContainer;
  }

  static async create(data: Partial<IContainer>): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async update(id: string, data: Partial<IContainer>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  static async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
