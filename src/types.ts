export type UserRole = 
  | 'admin' 
  | 'finance_manager' 
  | 'sales_executive' 
  | 'purchase_officer' 
  | 'warehouse_staff' 
  | 'investor_manager' 
  | 'traceability_officer' 
  | 'view_only';

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
