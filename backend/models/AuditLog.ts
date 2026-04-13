import { db } from "../config/database";

export interface IAuditLog {
  id?: string;
  user?: string;
  username?: string;
  action: string;
  module: string;
  recordId?: string;
  recordType?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: any;
}

export class AuditLogModel {
  private static collection = db.collection("audit_logs");

  static async log(data: Partial<IAuditLog>): Promise<void> {
    await this.collection.add({
      ...data,
      createdAt: new Date(),
    });
  }

  static async getLogs(filters: any = {}): Promise<IAuditLog[]> {
    let query: any = this.collection;
    if (filters.module) query = query.where("module", "==", filters.module);
    if (filters.user) query = query.where("user", "==", filters.user);
    
    const snapshot = await query.orderBy("createdAt", "desc").limit(100).get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as IAuditLog));
  }
}
