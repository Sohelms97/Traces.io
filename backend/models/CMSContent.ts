import { db } from "../config/database";

export interface ICMSContent {
  id?: string;
  section: string;
  data: any;
  lastUpdatedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export class CMSContentModel {
  private static collection = db.collection("cms");

  static async getBySection(section: string): Promise<ICMSContent | null> {
    const snapshot = await this.collection.where("section", "==", section).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as object) } as ICMSContent;
  }

  static async updateSection(section: string, data: any, userId?: string): Promise<void> {
    const existing = await this.getBySection(section);
    if (existing) {
      await this.collection.doc(existing.id!).update({
        data,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      });
    } else {
      await this.collection.add({
        section,
        data,
        lastUpdatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  static async getAll(): Promise<ICMSContent[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as object) } as ICMSContent));
  }
}
