import { UserRole } from '../contexts/AuthContext';

export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/erp/dashboard', 
    '/erp/containers', 
    '/erp/purchases', 
    '/erp/shipments', 
    '/erp/inventory', 
    '/erp/sales', 
    '/erp/investors', 
    '/erp/reports', 
    '/erp/traceability', 
    '/erp/settings', 
    '/erp/documents',
    '/erp/catalog',
    '/erp/website',
    '/erp/users'
  ],
  finance_manager: [
    '/erp/dashboard', 
    '/erp/purchases', 
    '/erp/sales', 
    '/erp/investors', 
    '/erp/reports', 
    '/erp/documents'
  ],
  sales_executive: [
    '/erp/dashboard', 
    '/erp/sales', 
    '/erp/documents'
  ],
  purchase_officer: [
    '/erp/dashboard', 
    '/erp/purchases', 
    '/erp/shipments', 
    '/erp/documents'
  ],
  warehouse_staff: [
    '/erp/dashboard', 
    '/erp/inventory', 
    '/erp/documents'
  ],
  investor_manager: [
    '/erp/dashboard', 
    '/erp/investors', 
    '/erp/reports', 
    '/erp/documents'
  ],
  traceability_officer: [
    '/erp/dashboard', 
    '/erp/traceability', 
    '/erp/documents'
  ],
  view_only: [
    '/erp/dashboard'
  ],
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  finance_manager: 'Finance Manager',
  sales_executive: 'Sales Executive',
  purchase_officer: 'Purchase Officer',
  warehouse_staff: 'Warehouse Staff',
  investor_manager: 'Investor Manager',
  traceability_officer: 'Traceability Officer',
  view_only: 'View Only',
};

export const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system access with all permissions.',
  finance_manager: 'Manage purchases, sales, and financial reports. Cannot delete records.',
  sales_executive: 'Manage sales orders and customer data. No financial or investor access.',
  purchase_officer: 'Manage purchase orders and shipments. No sales or investor access.',
  warehouse_staff: 'Manage inventory and stock movements only.',
  investor_manager: 'Manage investor records and view analytics. No internal cost data.',
  traceability_officer: 'Update traceability stages and upload documents.',
  view_only: 'Read-only access to assigned modules.',
};
