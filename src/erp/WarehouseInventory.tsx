import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportExcelModal from '../components/ImportExcelModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  limit,
  writeBatch
} from 'firebase/firestore';

export default function WarehouseInventory() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movement'>('stock');
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { isAdmin } = useAuth();
  const [tempDocuments, setTempDocuments] = useState<{ data: any, files: { file: File; base64: string }[] } | null>(null);
  const [isPreFillModalOpen, setIsPreFillModalOpen] = useState(false);

  // Form State
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Seafood',
    origin: '',
    supplier: '',
    container: '',
    qtyIn: '',
    qtySold: '0',
    unit: 'KG',
    unitCost: '',
    location: '',
    status: 'In Stock'
  });

  // Error Handling Spec for Firestore Operations
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId: string | undefined;
      email: string | null | undefined;
      emailVerified: boolean | undefined;
      isAnonymous: boolean | undefined;
      tenantId: string | null | undefined;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const inventoryQuery = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultInventory = [
          { name: 'Sea Bream', category: 'Seafood', origin: 'Saudi Arabia', supplier: 'Tabuk Fisheries', container: 'TFC/EX026/25', qtyIn: 12000, qtySold: 12000, qtyRem: 0, unit: 'KG', unitCost: 23.35, location: 'Cold Store A-12', status: 'Out of Stock', createdAt: serverTimestamp() },
          { name: 'Keski', category: 'Seafood', origin: 'Vietnam', supplier: 'Hong Long Seafood', container: 'FBIU5326683', qtyIn: 3000, qtySold: 2850, qtyRem: 150, unit: 'Box', unitCost: 33.33, location: 'Cold Store B-05', status: 'Low Stock', createdAt: serverTimestamp() },
          { name: 'Rohu', category: 'Seafood', origin: 'Thailand', supplier: 'PAKTHAI IMPEX', container: 'SZLU9069865', qtyIn: 27000, qtySold: 0, qtyRem: 27000, unit: 'KG', unitCost: 5.55, location: 'Cold Store A-14', status: 'In Stock', createdAt: serverTimestamp() },
        ];
        defaultInventory.forEach(async (item) => {
          const id = `${item.name}-${item.container}`.replace(/\//g, '-');
          try {
            await setDoc(doc(db, 'inventory', id), { ...item, id });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `inventory/${id}`);
          }
        });
      } else {
        setInventory(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory');
    });

    const movementQuery = query(collection(db, 'inventory_movements'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeMovements = onSnapshot(movementQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultMovements = [
          { date: 'Nov 30, 2025', product: 'Sea Bream', container: 'TFC/EX026/25', type: 'IN', qty: '12,000 KG', ref: 'GRN-001', by: 'Warehouse Admin', createdAt: serverTimestamp() },
          { date: 'Dec 05, 2025', product: 'Sea Bream', container: 'TFC/EX026/25', type: 'OUT', qty: '5,000 KG', ref: 'INV-101', by: 'Sales Admin', createdAt: serverTimestamp() },
        ];
        defaultMovements.forEach(async (mov) => {
          const id = `MOV-${Date.now()}-${Math.random()}`;
          try {
            await setDoc(doc(db, 'inventory_movements', id), mov);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `inventory_movements/${id}`);
          }
        });
      } else {
        setMovements(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory_movements');
    });

    return () => {
      unsubscribeInventory();
      unsubscribeMovements();
    };
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        category: item.category,
        origin: item.origin,
        supplier: item.supplier,
        container: item.container,
        qtyIn: item.qtyIn.toString(),
        qtySold: item.qtySold.toString(),
        unit: item.unit,
        unitCost: item.unitCost.toString(),
        location: item.location,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setItemForm({ name: '', category: 'Seafood', origin: '', supplier: '', container: '', qtyIn: '', qtySold: '0', unit: 'KG', unitCost: '', location: '', status: 'In Stock' });
    }
    setIsModalOpen(true);
  };

  const handleDocumentSave = (data: any, files: { file: File; base64: string }[]) => {
    const logistics = data.logistics || {};
    const procurement = data.procurement || {};
    
    setItemForm(prev => ({
      ...prev,
      name: procurement.items?.[0]?.description || prev.name,
      supplier: procurement.supplier_name || prev.supplier,
      container: logistics.container_number || prev.container,
      qtyIn: procurement.items?.[0]?.quantity || prev.qtyIn,
      unit: procurement.items?.[0]?.unit || prev.unit,
      unitCost: procurement.items?.[0]?.unit_price || prev.unitCost,
      origin: logistics.origin_port || prev.origin,
    }));

    setTempDocuments({ data, files });
    setIsPreFillModalOpen(false);
  };

  const handleSaveItem = async () => {
    try {
      const qtyInNum = parseFloat(itemForm.qtyIn);
      const qtySoldNum = parseFloat(itemForm.qtySold);
      const qtyRem = qtyInNum - qtySoldNum;
      const value = (qtyRem * parseFloat(itemForm.unitCost)).toLocaleString();
      
      const status = qtyRem <= 0 ? 'Out of Stock' : (qtyRem < 500 ? 'Low Stock' : 'In Stock');
      
      const itemData = {
        ...itemForm,
        qtyIn: qtyInNum,
        qtySold: qtySoldNum,
        qtyRem,
        value,
        status,
        updatedAt: serverTimestamp(),
        createdAt: editingItem ? editingItem.createdAt : serverTimestamp()
      };

      const id = `${itemForm.name}-${itemForm.container}`.replace(/\//g, '-');
      if (editingItem) {
        try {
          await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `inventory/${editingItem.id}`);
        }
      } else {
        try {
          await setDoc(doc(db, 'inventory', id), itemData);

          // Save temporary documents if any
          if (tempDocuments) {
            const { data, files } = tempDocuments;
            const { saveExtractedData } = await import('../lib/document-router');
            
            for (const f of files) {
              await saveExtractedData({
                fileName: f.file.name,
                fileSize: f.file.size,
                base64Data: f.base64,
                documentType: data.document_type || 'Auto-Detect',
                extractedData: data,
                linkedRecordId: id
              });
            }
            setTempDocuments(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `inventory/${id}`);
        }
      }

      // Log movement if stock changed significantly or new item
      if (!editingItem || editingItem.qtyIn !== qtyInNum) {
        const movId = `MOV-${Date.now()}`;
        try {
          await setDoc(doc(db, 'inventory_movements', movId), {
            date: new Date().toLocaleDateString(),
            product: itemForm.name,
            container: itemForm.container,
            type: 'IN',
            qty: `${qtyInNum} ${itemForm.unit}`,
            ref: editingItem ? 'ADJ-001' : 'GRN-NEW',
            by: 'Admin',
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `inventory_movements/${movId}`);
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving inventory item:", error);
      if (error instanceof Error && error.message.startsWith('{')) {
        throw error;
      }
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = React.useMemo(() => {
    const data = activeTab === 'stock' ? inventory : movements;
    let result = data.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      if (activeTab === 'stock') {
        return (item.name || '').toLowerCase().includes(searchStr) ||
               (item.container || '').toLowerCase().includes(searchStr) ||
               (item.supplier || '').toLowerCase().includes(searchStr);
      } else {
        return (item.product || '').toLowerCase().includes(searchStr) ||
               (item.container || '').toLowerCase().includes(searchStr) ||
               (item.ref || '').toLowerCase().includes(searchStr);
      }
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [activeTab, inventory, movements, searchTerm, sortConfig]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    let exportData;
    if (activeTab === 'stock') {
      exportData = filteredData.map(item => ({
        'Product Name': item.name,
        'Category': item.category,
        'Origin': item.origin,
        'Supplier': item.supplier,
        'Container': item.container,
        'Qty In': item.qtyIn,
        'Qty Sold': item.qtySold,
        'Qty Rem': item.qtyRem,
        'Unit': item.unit,
        'Unit Cost': item.unitCost,
        'Value': item.value,
        'Location': item.location,
        'Status': item.status
      }));
    } else {
      exportData = filteredData.map(item => ({
        'Date': item.date,
        'Product': item.product,
        'Container': item.container,
        'Type': item.type,
        'Quantity': item.qty,
        'Reference': item.ref,
        'By': item.by
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'stock' ? 'Inventory' : 'Movements');
    XLSX.writeFile(workbook, `${activeTab === 'stock' ? 'Inventory' : 'Movements'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const item = itemToDelete;
      await deleteDoc(doc(db, 'inventory', item.id));
      
      // SYNC: Log movement for deletion
      const movId = `MOV-DEL-${Date.now()}`;
      try {
        await setDoc(doc(db, 'inventory_movements', movId), {
          date: new Date().toLocaleDateString(),
          product: item.name,
          container: item.container,
          type: 'OUT',
          qty: `${item.qtyRem} ${item.unit}`,
          ref: 'INV-DEL',
          by: 'Admin',
          createdAt: serverTimestamp()
        });
      } catch (e) {}

      setItemToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${itemToDelete.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total SKUs</div>
          <div className="text-2xl font-bold text-slate-800">{inventory.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stock Value</div>
          <div className="text-2xl font-bold text-[#1F4E79]">AED {inventory.reduce((acc, item) => acc + (parseFloat(item.value?.replace(/,/g, '') || '0')), 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-orange-500">{inventory.filter(i => i.status === 'Low Stock').length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-500">{inventory.filter(i => i.status === 'Out of Stock').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Current Stock
        </button>
        <button 
          onClick={() => setActiveTab('movement')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'movement' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Movement Log
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'stock' ? 'inventory' : 'movements'}...`} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={handleExportExcel}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-green-600" /> Export Excel
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-file-import"></i> Import Excel
              </button>
              <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <i className="fa-solid fa-file-invoice"></i> Generate GRN
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus"></i> Add New Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Product Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('container')}>
                    <div className="flex items-center gap-1">
                      Container No. {sortConfig?.key === 'container' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qtyIn')}>
                    <div className="flex items-center justify-end gap-1">
                      Qty In {sortConfig?.key === 'qtyIn' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qtySold')}>
                    <div className="flex items-center justify-end gap-1">
                      Qty Sold {sortConfig?.key === 'qtySold' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qtyRem')}>
                    <div className="flex items-center justify-end gap-1">
                      Qty Remaining {sortConfig?.key === 'qtyRem' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('value')}>
                    <div className="flex items-center justify-end gap-1">
                      Stock Value (AED) {sortConfig?.key === 'value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{item.container}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtyIn.toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtySold.toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{(item.qtyIn - item.qtySold).toLocaleString()} {item.unit}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{item.value}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 
                          item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product')}>
                    <div className="flex items-center gap-1">
                      Product {sortConfig?.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('container')}>
                    <div className="flex items-center gap-1">
                      Container {sortConfig?.key === 'container' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">
                      Type {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qty')}>
                    <div className="flex items-center justify-end gap-1">
                      Qty {sortConfig?.key === 'qty' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('ref')}>
                    <div className="flex items-center gap-1">
                      Reference {sortConfig?.key === 'ref' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('by')}>
                    <div className="flex items-center gap-1">
                      Recorded By {sortConfig?.key === 'by' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{log.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{log.product}</td>
                    <td className="px-6 py-4 text-slate-600">{log.container}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 
                          log.type === 'OUT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">{log.qty}</td>
                    <td className="px-6 py-4 text-slate-500">{log.ref}</td>
                    <td className="px-6 py-4 text-slate-500">{log.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'Edit Stock Item' : 'Add New Stock'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {!editingItem && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Pre-fill</p>
                        <p className="text-[10px] text-blue-700">Upload Packing List or GRN to auto-complete this form</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPreFillModalOpen(true)}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                    >
                      {tempDocuments ? 'Change Document' : 'Upload Document'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Sea Bream"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Seafood"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Saudi Arabia"
                      value={itemForm.origin}
                      onChange={(e) => setItemForm({ ...itemForm, origin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Tabuk Fisheries"
                      value={itemForm.supplier}
                      onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Container No.</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. TFC/EX026/25"
                      value={itemForm.container}
                      onChange={(e) => setItemForm({ ...itemForm, container: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse Location</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Cold Store A-12"
                      value={itemForm.location}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty In</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                      value={itemForm.qtyIn}
                      onChange={(e) => setItemForm({ ...itemForm, qtyIn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    >
                      <option value="KG">KG</option>
                      <option value="Box">Box</option>
                      <option value="PCS">PCS</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Cost (AED)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                      value={itemForm.unitCost}
                      onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSaveItem}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {editingItem ? 'Update Stock' : 'Add Stock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone and will remove the item from inventory.`}
        confirmText="Delete Item"
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (data) => {
          const batch = writeBatch(db);
          data.forEach((item) => {
            const id = `${item.name}-${item.container}`.replace(/\//g, '-');
            const docRef = doc(db, 'inventory', id);
            const qtyInNum = parseFloat(item.qtyIn) || 0;
            const qtySoldNum = parseFloat(item.qtySold) || 0;
            const qtyRem = qtyInNum - qtySoldNum;
            const unitCost = parseFloat(item.unitCost) || 0;
            const value = (qtyRem * unitCost).toLocaleString();
            const status = qtyRem <= 0 ? 'Out of Stock' : (qtyRem < 500 ? 'Low Stock' : 'In Stock');

            batch.set(docRef, {
              ...item,
              id,
              qtyIn: qtyInNum,
              qtySold: qtySoldNum,
              qtyRem,
              unitCost,
              value,
              status,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }}
        schema={{
          name: { label: 'Product Name', required: true },
          category: { label: 'Category' },
          origin: { label: 'Origin' },
          supplier: { label: 'Supplier' },
          container: { label: 'Container No.', required: true },
          qtyIn: { label: 'Qty In', type: 'number' },
          qtySold: { label: 'Qty Sold', type: 'number' },
          unit: { label: 'Unit' },
          unitCost: { label: 'Unit Cost (AED)', type: 'number' },
          location: { label: 'Warehouse Location' }
        }}
        templateData={[
          { 'Product Name': 'Fresh Salmon', 'Category': 'Seafood', 'Origin': 'Norway', 'Supplier': 'Ocean Fresh', 'Container No.': 'CONT-001', 'Qty In': 1000, 'Qty Sold': 200, 'Unit': 'KG', 'Unit Cost (AED)': 45, 'Warehouse Location': 'Cold Store 1' }
        ]}
        title="Import Inventory"
      />

      <DocumentUploadModal
        isOpen={isPreFillModalOpen}
        onClose={() => setIsPreFillModalOpen(false)}
        onSave={handleDocumentSave}
        initialDocType="Auto-Detect"
      />
    </div>
  );
}
