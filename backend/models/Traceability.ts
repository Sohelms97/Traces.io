import { db } from "../config/database";

export interface ITraceabilityStage {
  stageId: string;
  stageNumber: number;
  stageName: string;
  stageIcon: string;
  stageColor: string;
  status: 'pending' | 'in_progress' | 'complete';
  date?: Date;
  completedBy?: string;
  internalNotes?: string;
  publicDescription?: string;
  showOnWebsite: boolean;
  fields?: Record<string, string>;
  photos?: { url: string; caption: string }[];
  documents?: { name: string; filePath: string; isPublic: boolean }[];
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ITraceability {
  id?: string;
  traceId: string;
  productId: string;
  containerId?: string;
  containerNumber?: string;
  overallStatus: 'not_started' | 'in_progress' | 'complete';
  completionPercent: number;
  stages: ITraceabilityStage[];
  qrCode?: string;
  qrUrl?: string;
  scanCount: number;
  createdBy?: string;
  createdAt: any;
  updatedAt: any;
}

export class TraceabilityModel {
  private static collection = db.collection("traceability");

  static async findByProductId(productId: string): Promise<ITraceability | null> {
    const snapshot = await this.collection.where("productId", "==", productId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as object) } as ITraceability;
  }

  static async create(data: Partial<ITraceability>): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async update(id: string, data: Partial<ITraceability>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }
}
