import { db } from "../config/database";

export interface IInvestor {
  id?: string;
  investorId: string;
  fullName: string;
  nationality?: string;
  nidNumber?: string;
  passportNumber?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  idDocument?: string;
  photo?: string;
  status: 'active' | 'pending' | 'closed' | 'overdue';
  investments?: string[];
  agreements?: string[];
  createdBy?: string;
  createdAt: any;
  updatedAt: any;
}

export class InvestorModel {
  private static collection = db.collection("investors");

  static async getAll(): Promise<IInvestor[]> {
    const snapshot = await this.collection.orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as object) } as IInvestor));
  }

  static async findById(id: string): Promise<IInvestor | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as object) } as IInvestor;
  }

  static async create(data: Partial<IInvestor>): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async update(id: string, data: Partial<IInvestor>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  static async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
