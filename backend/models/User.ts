import { db } from "../config/database";

export interface UserPermissions {
  containers: "none" | "read" | "write" | "delete";
  purchases: "none" | "read" | "write" | "delete";
  shipments: "none" | "read" | "write" | "delete";
  warehouse: "none" | "read" | "write" | "delete";
  sales: "none" | "read" | "write" | "delete";
  investors: "none" | "read" | "write" | "delete";
  analytics: "none" | "read" | "write" | "delete";
  traceability: "none" | "read" | "write" | "delete";
  cms: "none" | "read" | "write" | "delete";
  users: "none" | "read" | "write" | "delete";
  settings: "none" | "read" | "write" | "delete";
}

export interface IUser {
  id?: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: "admin" | "finance_manager" | "sales_executive" | "purchase_officer" | "warehouse_staff" | "investor_manager" | "traceability_officer" | "view_only";
  permissions: UserPermissions;
  securityQuestion?: string;
  securityAnswer?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  profilePhoto?: string;
  phone?: string;
  createdAt: any;
  updatedAt: any;
}

export class UserModel {
  private static collection = db.collection("users");

  static async findByUsername(username: string): Promise<IUser | null> {
    const snapshot = await this.collection.where("username", "==", username.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as object) } as IUser;
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    const snapshot = await this.collection.where("email", "==", email.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as object) } as IUser;
  }

  static async create(userData: Partial<IUser>): Promise<string> {
    const docRef = await this.collection.add({
      ...userData,
      username: userData.username?.toLowerCase(),
      email: userData.email?.toLowerCase(),
      isActive: true,
      isFirstLogin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async update(id: string, updateData: Partial<IUser>): Promise<void> {
    await this.collection.doc(id).update({
      ...updateData,
      updatedAt: new Date(),
    });
  }

  static async findById(id: string): Promise<IUser | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as object) } as IUser;
  }
}
