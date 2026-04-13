import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportExcelModal from '../components/ImportExcelModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function PurchaseManagement() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeletePOModalOpen, setIsDeletePOModalOpen] = useState(false);
  const [isDeleteSupplierModalOpen, setIsDeleteSupplierModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<any>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<any>(null);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { isAdmin } = useAuth();
  const [tempDocuments, setTempDocuments] = useState<{ data: any, files: { file: File; base64: string }[] } | null>(null);
  const [isPreFillModalOpen, setIsPreFillModalOpen] = useState(false);

  // Form States
  const [poForm, setPoForm] = useState({
    id: '',
    supplier: '',
    product: '',
    qty: '',
    unit: 'KG',
    unitPrice: '',
    status: 'Pending'
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    country: '',
    products: '',
    status: 'Active'
  });

  useEffect(() => {
    const poQuery = query(collection(db, 'purchase_orders'), orderBy('createdAt', 'desc'));
    const unsubscribePOs = onSnapshot(poQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const initialPOs = [
          { id: 'PO-2025-001', supplier: 'Tabuk Fisheries', product: 'Sea Bream', qty: '12,000', unit: 'KG', unitPrice: '23.35', total: '280,200', status: 'Fully Paid', date: 'Oct 15, 2025', createdAt: serverTimestamp() },
          { id: 'PO-2025-002', supplier: 'Hong Long Seafood', product: 'Keski', qty: '3,000', unit: 'Box', unitPrice: '33.33', total: '100,000', status: 'Fully Paid', date: 'Nov 05, 2025', createdAt: serverTimestamp() },
        ];
        initialPOs.forEach(async (po) => {
          await setDoc(doc(db, 'purchase_orders', po.id), po);
        });
      } else {
        setPos(docs);
      }
    });

    const supplierQuery = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubscribeSuppliers = onSnapshot(supplierQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const initialSuppliers = [
          { id: 'S-001', name: 'Tabuk Fisheries', country: 'Saudi Arabia', products: 'Sea Bream', orders: 4, value: '1,120,800', status: 'Active', createdAt: serverTimestamp() },
          { id: 'S-002', name: 'QUE KY FOODS', country: 'Vietnam', products: 'Pangasius Fillet', orders: 2, value: '220,000', status: 'Active', createdAt: serverTimestamp() },
          { id: 'S-003', name: 'HONG LONG SEAFOOD', country: 'Vietnam', products: 'Keski', orders: 3, value: '300,000', status: 'Active', createdAt: serverTimestamp() },
        ];
        initialSuppliers.forEach(async (s) => {
          await setDoc(doc(db, 'suppliers', s.id), s);
        });
      } else {
        setSuppliers(docs);
      }
    });

    return () => {
      unsubscribePOs();
      unsubscribeSuppliers();
    };
  }, []);

  useEffect(() => {
    if (location.state?.openNewModal) {
      setActiveTab('pos');
      handleOpenModal();
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = React.useMemo(() => {
    const data = activeTab === 'pos' ? pos : suppliers;
    let result = data.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      if (activeTab === 'pos') {
        return (item.id || '').toLowerCase().includes(searchStr) ||
               (item.supplier || '').toLowerCase().includes(searchStr) ||
               (item.product || '').toLowerCase().includes(searchStr);
      } else {
        return (item.name || '').toLowerCase().includes(searchStr) ||
               (item.country || '').toLowerCase().includes(searchStr);
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
  }, [activeTab, pos, suppliers, searchTerm, sortConfig]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    let exportData;
    if (activeTab === 'pos') {
      exportData = filteredData.map(po => ({
        'PO Number': po.id,
        'Supplier': po.supplier,
        'Product': po.product,
        'Qty': po.qty,
        'Unit': po.unit,
        'Unit Price': po.unitPrice,
        'Total': po.total,
        'Status': po.status,
        'Date': po.date
      }));
    } else {
      exportData = filteredData.map(supplier => ({
        'Supplier Name': supplier.name,
        'Country': supplier.country,
        'Products': supplier.products,
        'Total Orders': supplier.orders,
        'Total Value': supplier.value,
        'Status': supplier.status
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'pos' ? 'Purchase Orders' : 'Suppliers');
    XLSX.writeFile(workbook, `${activeTab === 'pos' ? 'PurchaseOrders' : 'Suppliers'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenModal = (item?: any) => {
    if (activeTab === 'pos') {
      if (item) {
        setEditingPO(item);
        setPoForm({
          id: item.id,
          supplier: item.supplier,
          product: item.product,
          qty: item.qty,
          unit: item.unit || 'KG',
          unitPrice: item.unitPrice,
          status: item.status
        });
      } else {
        setEditingPO(null);
        setPoForm({ id: '', supplier: '', product: '', qty: '', unit: 'KG', unitPrice: '', status: 'Pending' });
      }
    } else {
      if (item) {
        setEditingSupplier(item);
        setSupplierForm({
          name: item.name,
          country: item.country,
          products: item.products,
          status: item.status
        });
      } else {
        setEditingSupplier(null);
        setSupplierForm({ name: '', country: '', products: '', status: 'Active' });
      }
    }
    setIsModalOpen(true);
  };

  const handleDocumentSave = (data: any, files: { file: File; base64: string }[]) => {
    const procurement = data.procurement || {};
    
    setPoForm(prev => ({
      ...prev,
      id: procurement.po_number || prev.id,
      supplier: procurement.supplier_name || prev.supplier,
      product: procurement.items?.[0]?.description || prev.product,
      qty: procurement.items?.[0]?.quantity || prev.qty,
      unit: procurement.items?.[0]?.unit || prev.unit,
      unitPrice: procurement.items?.[0]?.unit_price || prev.unitPrice,
    }));

    setTempDocuments({ data, files });
    setIsPreFillModalOpen(false);
  };

  const handleSavePO = async () => {
    try {
      const total = (parseFloat(poForm.qty) * parseFloat(poForm.unitPrice)).toLocaleString();
      const poData = {
        ...poForm,
        total,
        date: editingPO ? editingPO.date : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        updatedAt: serverTimestamp(),
        createdAt: editingPO ? editingPO.createdAt : serverTimestamp()
      };

      const poId = poForm.id || `PO-${Date.now()}`;
      if (editingPO) {
        await updateDoc(doc(db, 'purchase_orders', editingPO.id), poData);
      } else {
        await setDoc(doc(db, 'purchase_orders', poId), { ...poData, id: poId });

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
              linkedRecordId: poId
            });
          }
          setTempDocuments(null);
        }

        // SYNC: Update Supplier
        if (poForm.supplier) {
          try {
            const supplier = suppliers.find(s => s.name === poForm.supplier);
            if (supplier) {
              const qtyNum = parseFloat(poForm.qty) || 0;
              const priceNum = parseFloat(poForm.unitPrice) || 0;
              const totalVal = qtyNum * priceNum;
              await updateDoc(doc(db, 'suppliers', supplier.id), {
                orders: increment(1),
                value: increment(totalVal),
                updatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Error updating supplier:", e);
          }
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving PO:", error);
    }
  };

  const handleSaveSupplier = async () => {
    try {
      const supplierData = {
        ...supplierForm,
        updatedAt: serverTimestamp(),
        createdAt: editingSupplier ? editingSupplier.createdAt : serverTimestamp(),
        orders: editingSupplier ? editingSupplier.orders : 0,
        value: editingSupplier ? editingSupplier.value : '0'
      };

      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), supplierData);
      } else {
        const newId = `S-${Date.now()}`;
        await setDoc(doc(db, 'suppliers', newId), { ...supplierData, id: newId });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleDeletePO = (po: any) => {
    setPoToDelete(po);
    setIsDeletePOModalOpen(true);
  };

  const confirmDeletePO = async () => {
    if (!poToDelete) return;
    try {
      // SYNC: Revert Supplier updates
      if (poToDelete.supplier) {
        try {
          const supplier = suppliers.find(s => s.name === poToDelete.supplier);
          if (supplier) {
            const qtyNum = parseFloat(poToDelete.qty) || 0;
            const priceNum = parseFloat(poToDelete.unitPrice) || 0;
            const totalVal = qtyNum * priceNum;
            await updateDoc(doc(db, 'suppliers', supplier.id), {
              orders: increment(-1),
              value: increment(-totalVal),
              updatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Error reverting supplier sync:", e);
        }
      }

      await deleteDoc(doc(db, 'purchase_orders', poToDelete.id));
      setPoToDelete(null);
    } catch (error) {
      console.error("Error deleting PO:", error);
    }
  };

  const handleDeleteSupplier = (supplier: any) => {
    setSupplierToDelete(supplier);
    setIsDeleteSupplierModalOpen(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteDoc(doc(db, 'suppliers', supplierToDelete.id));
      setSupplierToDelete(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const poSchema = {
    id: { label: 'PO Number', required: true },
    supplier: { label: 'Supplier', required: true },
    product: { label: 'Product', required: true },
    qty: { label: 'Qty', required: true, type: 'number' as const },
    unit: { label: 'Unit', required: true },
    unitPrice: { label: 'Unit Price', required: true, type: 'number' as const },
    status: { label: 'Status', required: true },
  };

  const supplierSchema = {
    name: { label: 'Supplier Name', required: true },
    country: { label: 'Country', required: true },
    products: { label: 'Products', required: true },
    status: { label: 'Status', required: true },
  };

  const handleImport = async (data: any[]) => {
    const batch = writeBatch(db);
    const collectionName = activeTab === 'pos' ? 'purchase_orders' : 'suppliers';
    
    data.forEach((item) => {
      let newId = item.id;
      if (!newId) {
        newId = activeTab === 'pos' ? `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : `S-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }
      
      const docData = {
        ...item,
        id: newId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (activeTab === 'pos') {
        docData.total = (parseFloat(String(item.qty || '0')) * parseFloat(String(item.unitPrice || '0'))).toLocaleString();
        docData.date = item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      } else {
        docData.orders = item.orders || 0;
        docData.value = item.value || '0';
      }

      const docRef = doc(db, collectionName, newId);
      batch.set(docRef, docData);
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('pos')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'suppliers' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Supplier Master
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'pos' ? 'orders' : 'suppliers'}...`} 
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
                <i className="fa-solid fa-file-import text-green-600"></i> Import Excel
              </button>
            </>
          )}
          {isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
            >
              <i className={`fa-solid ${activeTab === 'pos' ? 'fa-plus' : 'fa-user-plus'}`}></i> 
              {activeTab === 'pos' ? 'New Purchase Order' : 'Add New Supplier'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'pos' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      PO Number {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('supplier')}>
                    <div className="flex items-center gap-1">
                      Supplier {sortConfig?.key === 'supplier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product')}>
                    <div className="flex items-center gap-1">
                      Product {sortConfig?.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qty')}>
                    <div className="flex items-center gap-1">
                      Qty {sortConfig?.key === 'qty' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('unitPrice')}>
                    <div className="flex items-center justify-end gap-1">
                      Unit Price {sortConfig?.key === 'unitPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-1">
                      Total (AED) {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((po, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{po.id}</td>
                    <td className="px-6 py-4 text-slate-600">{po.supplier}</td>
                    <td className="px-6 py-4 text-slate-600">{po.product}</td>
                    <td className="px-6 py-4 text-slate-500">{po.qty} {po.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{po.unitPrice}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{po.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${po.status === 'Fully Paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{po.date}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(po)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeletePO(po)}
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
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Supplier Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('country')}>
                    <div className="flex items-center gap-1">
                      Country {sortConfig?.key === 'country' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('products')}>
                    <div className="flex items-center gap-1">
                      Products {sortConfig?.key === 'products' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('orders')}>
                    <div className="flex items-center justify-center gap-1">
                      Total Orders {sortConfig?.key === 'orders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('value')}>
                    <div className="flex items-center justify-end gap-1">
                      Total Value (AED) {sortConfig?.key === 'value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                {filteredData.map((supplier, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{supplier.name}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.country}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.products}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{supplier.orders}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{supplier.value}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${supplier.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(supplier)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteSupplier(supplier)}
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
        )}
      </div>

      {/* PO Form Modal */}
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
                  {activeTab === 'pos' 
                    ? (editingPO ? 'Edit Purchase Order' : 'Create Purchase Order') 
                    : (editingSupplier ? 'Edit Supplier' : 'Add New Supplier')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {activeTab === 'pos' && !editingPO && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Pre-fill</p>
                        <p className="text-[10px] text-blue-700">Upload Quote or PO to auto-complete this form</p>
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

                {activeTab === 'pos' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PO Number</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. PO-2025-001"
                          value={poForm.id}
                          onChange={(e) => setPoForm({ ...poForm, id: e.target.value })}
                          disabled={!!editingPO}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={poForm.supplier}
                          onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. Sea Bream"
                          value={poForm.product}
                          onChange={(e) => setPoForm({ ...poForm, product: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={poForm.status}
                          onChange={(e) => setPoForm({ ...poForm, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Fully Paid">Fully Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={poForm.qty}
                          onChange={(e) => setPoForm({ ...poForm, qty: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={poForm.unit}
                          onChange={(e) => setPoForm({ ...poForm, unit: e.target.value })}
                        >
                          <option value="KG">KG</option>
                          <option value="Box">Box</option>
                          <option value="MT">MT</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price (AED)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={poForm.unitPrice}
                          onChange={(e) => setPoForm({ ...poForm, unitPrice: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500">Total Amount:</span>
                      <span className="text-xl font-bold text-[#1F4E79]">
                        AED {(parseFloat(poForm.qty || '0') * parseFloat(poForm.unitPrice || '0')).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                        value={supplierForm.name}
                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={supplierForm.country}
                          onChange={(e) => setSupplierForm({ ...supplierForm, country: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={supplierForm.status}
                          onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Products</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                        placeholder="e.g. Sea Bream, Salmon"
                        value={supplierForm.products}
                        onChange={(e) => setSupplierForm({ ...supplierForm, products: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={activeTab === 'pos' ? handleSavePO : handleSaveSupplier}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {activeTab === 'pos' 
                      ? (editingPO ? 'Update PO' : 'Create PO') 
                      : (editingSupplier ? 'Update Supplier' : 'Add Supplier')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={isDeletePOModalOpen}
        onClose={() => setIsDeletePOModalOpen(false)}
        onConfirm={confirmDeletePO}
        title="Confirm PO Deletion"
        message={`Are you sure you want to delete purchase order ${poToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete PO"
      />

      <ConfirmationModal 
        isOpen={isDeleteSupplierModalOpen}
        onClose={() => setIsDeleteSupplierModalOpen(false)}
        onConfirm={confirmDeleteSupplier}
        title="Confirm Supplier Deletion"
        message={`Are you sure you want to delete supplier ${supplierToDelete?.name}? This will remove all their contact information.`}
        confirmText="Delete Supplier"
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title={activeTab === 'pos' ? 'Purchase Orders' : 'Suppliers'}
        schema={activeTab === 'pos' ? poSchema : supplierSchema}
        templateData={activeTab === 'pos' ? [
          {
            'PO Number': 'PO-2025-003',
            'Supplier': 'Tabuk Fisheries',
            'Product': 'Sea Bream',
            'Qty': 12000,
            'Unit': 'KG',
            'Unit Price': 23.35,
            'Status': 'Pending'
          }
        ] : [
          {
            'Supplier Name': 'New Supplier Ltd',
            'Country': 'Norway',
            'Products': 'Salmon, Cod',
            'Status': 'Active'
          }
        ]}
      />

      {activeTab === 'pos' && (
        <DocumentUploadModal
          isOpen={isPreFillModalOpen}
          onClose={() => setIsPreFillModalOpen(false)}
          onSave={handleDocumentSave}
          initialDocType="Auto-Detect"
        />
      )}
    </div>
  );
}
