import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportExcelModal from '../components/ImportExcelModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function ContainerManagement() {
  const location = useLocation();
  const [containers, setContainers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Auto-Detect');
  const [containerDocuments, setContainerDocuments] = useState<any[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const [containerToDelete, setContainerToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { isAdmin } = useAuth();
  const [tempDocuments, setTempDocuments] = useState<{ data: any, files: { file: File; base64: string }[] } | null>(null);
  const [isPreFillModalOpen, setIsPreFillModalOpen] = useState(false);

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
    const q = query(collection(db, 'containers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        // Seed initial data if empty
        const initialContainers = [
          { id: 'TFC-EX026-25', supplier: 'Tabuk Fisheries', product: 'Sea Bream', origin: 'Saudi Arabia', qty: '12,000 KG', purchaseValue: '280,000', totalCost: '312,360', saleQty: '12,000 KG', totalSales: '322,200', gp: '9,840', roi: '3.15%', status: 'Closed', month: 'Nov 2025', createdAt: serverTimestamp() },
          { id: 'FBIU5326683', supplier: 'Hong Long Seafood', product: 'Keski', origin: 'Vietnam', qty: '3,000 Box', purchaseValue: '100,000', totalCost: '115,036', saleQty: '3,000 Box', totalSales: '131,850', gp: '16,814', roi: '14.62%', status: 'Closed', month: 'Dec 2025', createdAt: serverTimestamp() },
        ];
        initialContainers.forEach(async (c) => {
          try {
            await setDoc(doc(db, 'containers', c.id), c);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `containers/${c.id}`);
          }
        });
      } else {
        setContainers(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'containers');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedContainer) {
      const q = query(
        collection(db, 'documents'), 
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .filter((d: any) => d.linkedRecordId === selectedContainer.id);
        setContainerDocuments(docs);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'documents');
      });

      return () => unsubscribe();
    } else {
      setContainerDocuments([]);
    }
  }, [selectedContainer]);

  const handleOpenUploadModal = (type: string) => {
    setUploadDocType(type);
    setIsUploadModalOpen(true);
  };

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    supplier: '',
    product: '',
    origin: '',
    qty: '',
    purchaseValue: '',
    status: 'Open'
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredContainers = React.useMemo(() => {
    let result = containers.filter(c => {
      const matchesSearch = (c.id || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                           (c.supplier || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                           (c.product || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
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
  }, [containers, searchTerm, filterStatus, sortConfig]);

  const handleExportExcel = () => {
    if (filteredContainers.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = filteredContainers.map(c => ({
      'Container No.': c.id,
      'Supplier': c.supplier,
      'Product': c.product,
      'Origin': c.origin,
      'Qty': c.qty,
      'Purchase (AED)': c.purchaseValue,
      'Total Cost (AED)': c.totalCost,
      'Sale Qty': c.saleQty,
      'Total Sales (AED)': c.totalSales,
      'GP (AED)': c.gp,
      'ROI': c.roi,
      'Status': c.status,
      'Month': c.month
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
    XLSX.writeFile(workbook, `Containers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenNewModal = () => {
    setEditingContainer(null);
    setFormData({
      id: '',
      supplier: '',
      product: '',
      origin: '',
      qty: '',
      purchaseValue: '',
      status: 'Open'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (container: any) => {
    setEditingContainer(container);
    setFormData({
      id: container.id,
      supplier: container.supplier,
      product: container.product,
      origin: container.origin,
      qty: container.qty,
      purchaseValue: container.purchaseValue,
      status: container.status
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (container: any) => {
    setContainerToDelete(container);
    setIsDeleteModalOpen(true);
  };

  const handleDocumentSave = (data: any, files: { file: File; base64: string }[]) => {
    // Pre-fill form from extracted data
    const logistics = data.logistics || {};
    const procurement = data.procurement || {};
    
    setFormData(prev => ({
      ...prev,
      id: logistics.container_number || logistics.bl_number || prev.id,
      supplier: procurement.supplier_name || prev.supplier,
      product: procurement.items?.[0]?.description || prev.product,
      origin: logistics.port_of_loading || prev.origin,
      qty: procurement.items?.[0]?.quantity ? `${procurement.items[0].quantity} ${procurement.items[0].unit || 'KG'}` : prev.qty,
      purchaseValue: procurement.total_amount || prev.purchaseValue,
    }));

    // Store documents to be saved after container is created
    setTempDocuments({ data, files });
    setIsPreFillModalOpen(false);
  };

  const handleSave = async () => {
    // Auto-update status logic
    const q = String(formData.qty || '').replace(/[^0-9.]/g, '');
    const sQ = String(editingContainer?.saleQty || '0').replace(/[^0-9.]/g, '');
    const pVal = parseFloat(String(formData.purchaseValue || '0').replace(/,/g, ''));
    const tSales = parseFloat(String(editingContainer?.totalSales || '0').replace(/,/g, ''));

    let finalStatus = formData.status;
    if (q !== '' && q === sQ && tSales >= pVal && pVal > 0) {
      finalStatus = 'Closed';
    }

    if (editingContainer) {
      try {
        await updateDoc(doc(db, 'containers', editingContainer.id), {
          ...formData,
          status: finalStatus
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `containers/${editingContainer.id}`);
      }
    } else {
      try {
        const rawId = formData.id || `CONT-${Date.now()}`;
        const newId = rawId.trim().replace(/\//g, '-');
        const newContainer = {
          ...formData,
          id: newId,
          status: finalStatus,
          totalCost: (parseFloat((formData.purchaseValue || '0').replace(/,/g, '')) * 1.1).toLocaleString(),
          saleQty: '0',
          totalSales: '0',
          gp: '0',
          roi: '0%',
          month: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
          createdAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'containers', newId), newContainer);

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
              linkedRecordId: newId
            });
          }
          setTempDocuments(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `containers/${formData.id || 'new'}`);
      }
    }
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'containers', containerToDelete.id));
      setIsDeleteModalOpen(false);
      setContainerToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `containers/${containerToDelete.id}`);
    }
  };

  const containerSchema = {
    id: { label: 'Container No.', required: true },
    supplier: { label: 'Supplier', required: true },
    product: { label: 'Product', required: true },
    origin: { label: 'Origin', required: true },
    qty: { label: 'Qty', required: true },
    purchaseValue: { label: 'Purchase (AED)', required: true },
    status: { label: 'Status', required: true },
  };

  const handleImport = async (data: any[]) => {
    const batch = writeBatch(db);
    data.forEach((item) => {
      const rawId = item.id || `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newId = String(rawId).trim().replace(/\//g, '-');
      
      // Auto-update status logic for import
      const pVal = parseFloat(String(item.purchaseValue || '0').replace(/,/g, ''));
      const tSales = parseFloat(String(item.totalSales || '0').replace(/,/g, ''));
      const q = String(item.qty || '').replace(/[^0-9.]/g, '');
      const sQ = String(item.saleQty || '0').replace(/[^0-9.]/g, '');

      let status = item.status || 'Open';
      if (q !== '' && q === sQ && tSales >= pVal && pVal > 0) {
        status = 'Closed';
      }

      const newContainer = {
        ...item,
        id: newId,
        status,
        totalCost: (parseFloat(String(item.purchaseValue || '0').replace(/,/g, '')) * 1.1).toLocaleString(),
        saleQty: item.saleQty || '0',
        totalSales: item.totalSales || '0',
        gp: item.gp || '0',
        roi: item.roi || '0%',
        month: item.month || new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        createdAt: serverTimestamp()
      };
      const docRef = doc(db, 'containers', newId);
      batch.set(docRef, newContainer);
    });
    
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'containers/batch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search containers..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-import text-green-600"></i> Import Excel
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={handleExportExcel}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-excel text-green-600"></i> Export Excel
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={handleOpenNewModal}
              className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
            >
              <i className="fa-solid fa-plus"></i> New Container
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    Container No. {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('purchaseValue')}>
                  <div className="flex items-center justify-end gap-1">
                    Purchase (AED) {sortConfig?.key === 'purchaseValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('totalSales')}>
                  <div className="flex items-center justify-end gap-1">
                    Sales (AED) {sortConfig?.key === 'totalSales' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('gp')}>
                  <div className="flex items-center justify-end gap-1">
                    GP (AED) {sortConfig?.key === 'gp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('roi')}>
                  <div className="flex items-center justify-end gap-1">
                    ROI {sortConfig?.key === 'roi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
              {filteredContainers.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.id || row.container_number}</td>
                  <td className="px-6 py-4 text-slate-600">{row.supplier || row.supplier_name}</td>
                  <td className="px-6 py-4 text-slate-600">{row.product || row.product_name}</td>
                  <td className="px-6 py-4 text-slate-500">{row.qty || row.total_quantity}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.purchaseValue || row.total_amount}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">
                    {typeof row.totalSales === 'number' ? row.totalSales.toLocaleString() : (parseFloat(String(row.totalSales || '0').replace(/,/g, '')) || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">
                    {typeof row.gp === 'number' ? row.gp.toLocaleString() : (parseFloat(String(row.gp || '0').replace(/,/g, '')) || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${row.roi.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                      {row.roi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${row.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => setSelectedContainer(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteModal(row)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"
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
      </div>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedContainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContainer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <div>
                  <h2 className="text-xl font-bold">Container Details: {selectedContainer.id}</h2>
                  <p className="text-white/60 text-sm">{selectedContainer.supplier} | {selectedContainer.month}</p>
                </div>
                <button onClick={() => setSelectedContainer(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Product Info</div>
                    <div className="font-bold text-slate-800">{selectedContainer.product}</div>
                    <div className="text-sm text-slate-500">{selectedContainer.origin}</div>
                    <div className="text-sm text-slate-500 mt-2">Qty: {selectedContainer.qty}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Financial Summary</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Purchase:</span>
                      <span className="font-bold text-slate-800">AED {selectedContainer.purchaseValue}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Total Cost:</span>
                      <span className="font-bold text-slate-800">AED {selectedContainer.totalCost}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200 mt-1">
                      <span className="text-slate-500">Sales:</span>
                      <span className="font-bold text-slate-800">AED {selectedContainer.totalSales}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Performance</div>
                    <div className="text-2xl font-bold text-green-600">{selectedContainer.roi}</div>
                    <div className="text-sm text-slate-500">Gross Profit: AED {selectedContainer.gp}</div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${selectedContainer.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                      {selectedContainer.status}
                    </div>
                  </div>
                </div>

                {/* Traceability Timeline */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-route text-[#1F4E79]"></i> Traceability Timeline
                  </h3>
                  <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                    {[
                      { step: 'Order Confirmed', docType: 'Commercial Invoice', icon: 'fa-file-invoice' },
                      { step: 'Quality Inspection', docType: 'Inspection Report', icon: 'fa-microscope' },
                      { step: 'Shipped from Port', docType: 'Bill of Lading', icon: 'fa-ship' },
                      { step: 'Arrived at Destination', docType: 'GRN', icon: 'fa-warehouse' },
                      { step: 'Customs Cleared', docType: 'Clearing Document', icon: 'fa-shield-halved' },
                    ].map((item, i) => {
                      const existingDoc = containerDocuments.find(d => d.docType === item.docType);
                      return (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center ${
                            existingDoc ? 'border-green-500' : 'border-slate-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${existingDoc ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                          </div>
                          <div className="flex items-center justify-between group">
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <i className={`fa-solid ${item.icon} ${existingDoc ? 'text-green-600' : 'text-slate-400'} text-xs`}></i>
                                {item.step}
                              </div>
                              <div className="text-xs text-slate-400">
                                {existingDoc 
                                  ? `Completed on ${new Date(existingDoc.uploadDate).toLocaleDateString()}` 
                                  : 'Pending Document Upload'}
                              </div>
                            </div>
                            {!existingDoc && (
                              <button 
                                onClick={() => handleOpenUploadModal(item.docType)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100"
                              >
                                <i className="fa-solid fa-upload mr-1"></i> Upload {item.docType}
                              </button>
                            )}
                            {existingDoc && isAdmin && (
                              <div className="flex gap-2">
                                <a 
                                  href={existingDoc.fileUrl || `data:application/pdf;base64,${existingDoc.base64Data}`} 
                                  download={existingDoc.fileName}
                                  target={existingDoc.fileUrl ? "_blank" : undefined}
                                  rel={existingDoc.fileUrl ? "noopener noreferrer" : undefined}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <i className="fa-solid fa-download text-xs"></i>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-paperclip text-[#1F4E79]"></i> Attached Documents
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Commercial Invoice', 'Bill of Lading', 'Packing List', 'Payment Slip', 'Inspection Report', 'GRN'].map((docType, i) => {
                      const existingDoc = containerDocuments.find(d => d.docType === docType);
                      return (
                        <div key={i} className="relative group">
                          <button 
                            onClick={() => existingDoc ? null : handleOpenUploadModal(docType)}
                            className={`w-full p-4 border rounded-xl transition-all flex flex-col items-center gap-2 ${
                              existingDoc 
                                ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                                : 'border-slate-200 hover:bg-slate-50 border-dashed'
                            }`}
                          >
                            <i className={`fa-solid ${existingDoc ? 'fa-file-circle-check text-green-600' : 'fa-file-arrow-up text-slate-400'} text-2xl`}></i>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{docType}</span>
                            {existingDoc && (
                              <span className="text-[8px] text-green-600 font-medium">Uploaded</span>
                            )}
                          </button>
                          {existingDoc && isAdmin && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={existingDoc.fileUrl || `data:application/pdf;base64,${existingDoc.base64Data}`} 
                                download={existingDoc.fileName}
                                target={existingDoc.fileUrl ? "_blank" : undefined}
                                rel={existingDoc.fileUrl ? "noopener noreferrer" : undefined}
                                className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                                title="Download"
                              >
                                <i className="fa-solid fa-download"></i>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New/Edit Container Modal */}
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingContainer ? 'Edit Container' : 'Add New Container'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl text-slate-400"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {!editingContainer && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Pre-fill</p>
                        <p className="text-[10px] text-blue-700">Upload Invoice or BL to auto-complete this form</p>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Container No.</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. TFC-EX040" 
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.replace(/\//g, '-') })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    >
                      <option value="">Select Supplier</option>
                      <option value="Tabuk Fisheries">Tabuk Fisheries</option>
                      <option value="QUE KY FOODS">QUE KY FOODS</option>
                      <option value="Hong Long Seafood">Hong Long Seafood</option>
                      <option value="FMA Pakistan">FMA Pakistan</option>
                      <option value="PAKTHAI IMPEX">PAKTHAI IMPEX</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. Sea Bream" 
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. Saudi Arabia" 
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 12,000 KG" 
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Value (AED)</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 280,000" 
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {editingContainer ? 'Update Container' : 'Save Container'}
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
        message={`Are you sure you want to delete container ${containerToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete Container"
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Containers"
        schema={containerSchema}
        templateData={[
          {
            'Container No.': 'TFC-EX040-25',
            'Supplier': 'Tabuk Fisheries',
            'Product': 'Sea Bream',
            'Origin': 'Saudi Arabia',
            'Qty': '12,000 KG',
            'Purchase (AED)': '280,000',
            'Status': 'Open'
          }
        ]}
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialDocType={uploadDocType}
        linkedRecordId={selectedContainer?.id}
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
