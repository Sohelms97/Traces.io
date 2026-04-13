import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export interface ExportOptions {
  modules: string[];
  startDate?: Date;
  endDate?: Date;
  format: ExportFormat;
  isSecured?: boolean;
}

const COLLECTION_MAP: Record<string, string> = {
  'Investors': 'investors',
  'Investments': 'investments',
  'Agreements': 'agreements',
  'Payment Schedules': 'payment_schedules',
  'Distributions': 'distributions',
  'Users': 'users',
  'Sales Orders': 'sales_orders',
  'Customers': 'customers',
  'Containers': 'containers',
  'Inventory': 'inventory',
  'Inventory Movements': 'inventory_movements',
  'Shipments': 'shipments',
  'Purchase Orders': 'purchase_orders',
  'Suppliers': 'suppliers',
};

export const fetchModuleData = async (moduleName: string, startDate?: Date, endDate?: Date) => {
  const collectionName = COLLECTION_MAP[moduleName];
  if (!collectionName) return [];

  let q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));

  if (startDate || endDate) {
    const constraints = [];
    if (startDate) constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)));
    if (endDate) constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));
    q = query(collection(db, collectionName), ...constraints, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Convert Timestamps to strings for export
    createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString() || doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toLocaleString() || doc.data().updatedAt,
  }));
};

export const exportToCSV = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: Record<string, any[]>, fileName: string, isSecured?: boolean) => {
  const wb = XLSX.utils.book_new();
  
  Object.entries(data).forEach(([sheetName, sheetData]) => {
    if (sheetData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      if (isSecured) {
        XLSX.utils.sheet_add_aoa(ws, [["CONFIDENTIAL - SECURED EXPORT"]], { origin: "A1" });
      }
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    }
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (data: Record<string, any[]>, fileName: string, isSecured?: boolean) => {
  const doc = new jsPDF() as any;
  let firstPage = true;

  Object.entries(data).forEach(([moduleName, moduleData]) => {
    if (moduleData.length === 0) return;

    if (!firstPage) {
      doc.addPage();
    }
    firstPage = false;

    if (isSecured) {
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(10);
      doc.text("CONFIDENTIAL - SECURED EXPORT", 14, 10);
      doc.setTextColor(0);
    }

    doc.setFontSize(18);
    doc.text(moduleName, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const headers = Object.keys(moduleData[0]);
    const rows = moduleData.map(item => headers.map(header => String(item[header] ?? '')));

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
  });

  doc.save(`${fileName}.pdf`);
};

export const exportToJSON = (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
