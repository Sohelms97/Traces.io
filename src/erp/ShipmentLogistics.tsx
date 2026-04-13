import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  where,
  orderBy, 
  setDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export default function ShipmentLogistics() {
  const location = useLocation();
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArrivedModalOpen, setIsArrivedModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<any>(null);
  const [shipmentToMarkArrived, setShipmentToMarkArrived] = useState<any>(null);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [shipmentDocuments, setShipmentDocuments] = useState<any[]>([]);
  const [tempDocuments, setTempDocuments] = useState<{ data: any, files: { file: File; base64: string }[] } | null>(null);
  const [isPreFillModalOpen, setIsPreFillModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Auto-Detect');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { isAdmin } = useAuth();

  // Form State
  const [shipmentForm, setShipmentForm] = useState({
    id: '',
    supplier: '',
    product: '',
    origin: '',
    qty: '',
    unit: 'KG',
    dest: '',
    etd: '',
    eta: '',
    vessel: '',
    bl: '',
    status: 'In Transit',
    cost: '0'
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

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
    const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultShipments = [
          { id: 'TFC/EX026/25', supplier: 'Tabuk Fisheries', product: 'Sea Bream', origin: 'Tabuk Port', dest: 'Jeddah Port', etd: '2025-11-02', eta: '2025-11-25', vessel: 'MSC LILY', bl: 'BL-992341', status: 'Cleared', cost: '12,500', createdAt: serverTimestamp() },
          { id: 'FBIU5326683', supplier: 'Hong Long Seafood', product: 'Keski', origin: 'Ho Chi Minh', dest: 'Dammam Port', etd: '2025-11-15', eta: '2025-12-10', vessel: 'MAERSK SEOUL', bl: 'BL-881234', status: 'Cleared', cost: '8,200', createdAt: serverTimestamp() },
        ];
        defaultShipments.forEach(async (shp) => {
          const sanitizedId = shp.id.replace(/\//g, '-');
          try {
            await setDoc(doc(db, 'shipments', sanitizedId), { ...shp, id: sanitizedId });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `shipments/${sanitizedId}`);
          }
        });
      } else {
        setShipments(docs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'shipments');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedShipment) {
      const q = query(
        collection(db, 'documents'),
        where('linkedRecordId', '==', selectedShipment.id),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setShipmentDocuments(docs);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'documents');
      });

      return () => unsubscribe();
    } else {
      setShipmentDocuments([]);
    }
  }, [selectedShipment]);

  useEffect(() => {
    if (location.state?.openNewModal) {
      handleOpenModal();
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenModal = (item?: any) => {
    setTempDocuments(null);
    if (item) {
      setEditingShipment(item);
      setShipmentForm({
        id: item.id,
        supplier: item.supplier,
        product: item.product,
        origin: item.origin,
        qty: item.qty?.toString() || '',
        unit: item.unit || 'KG',
        dest: item.dest,
        etd: item.etd,
        eta: item.eta,
        vessel: item.vessel,
        bl: item.bl,
        status: item.status,
        cost: item.cost
      });
    } else {
      setEditingShipment(null);
      setShipmentForm({ id: '', supplier: '', product: '', origin: '', qty: '', unit: 'KG', dest: '', etd: '', eta: '', vessel: '', bl: '', status: 'In Transit', cost: '0' });
    }
    setIsModalOpen(true);
  };

  const handleSaveShipment = async () => {
    try {
      const shipmentData = {
        ...shipmentForm,
        qty: parseFloat(shipmentForm.qty) || 0,
        updatedAt: serverTimestamp(),
        createdAt: editingShipment ? editingShipment.createdAt : serverTimestamp()
      };

      let finalId = '';

      if (editingShipment) {
        finalId = editingShipment.id;
        try {
          await updateDoc(doc(db, 'shipments', finalId), shipmentData);
          // Also update container if it exists
          try {
            await updateDoc(doc(db, 'containers', finalId), {
              supplier: shipmentForm.supplier,
              product: shipmentForm.product,
              origin: shipmentForm.origin,
              qty: shipmentForm.qty,
              status: shipmentForm.status === 'In Transit' ? 'Open' : 'Closed'
            });
          } catch (e) {
            // Container might not exist, that's fine
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `shipments/${finalId}`);
        }
      } else {
        const rawId = shipmentForm.id || `SHP-${Date.now()}`;
        finalId = rawId.trim().replace(/\//g, '-');
        try {
          await setDoc(doc(db, 'shipments', finalId), { ...shipmentData, id: finalId });
          
          // Create corresponding container entry
          const containerData = {
            id: finalId,
            containerNo: shipmentForm.id,
            supplier: shipmentForm.supplier,
            product: shipmentForm.product,
            origin: shipmentForm.origin,
            qty: shipmentForm.qty,
            purchaseValue: '0',
            totalCost: shipmentForm.cost,
            saleQty: '0',
            totalSales: '0',
            gp: '0',
            roi: '0%',
            status: shipmentForm.status === 'In Transit' ? 'Open' : 'Closed',
            month: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'containers', finalId), containerData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `shipments/${finalId}`);
        }
      }

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
            linkedRecordId: finalId
          });
        }
        setTempDocuments(null);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving shipment:", error);
      // Re-throw if it's not our JSON error to avoid double logging
      if (!(error instanceof Error && error.message.startsWith('{'))) {
        throw error;
      }
    }
  };

  const handleMarkArrived = (ship: any) => {
    setShipmentToMarkArrived(ship);
    setIsArrivedModalOpen(true);
  };

  const confirmMarkArrived = async () => {
    if (!shipmentToMarkArrived) return;
    try {
      const updatedStatus = 'Arrived';
      await updateDoc(doc(db, 'shipments', shipmentToMarkArrived.id), { 
        status: updatedStatus,
        updatedAt: serverTimestamp()
      });
      // Also update container status
      try {
        await updateDoc(doc(db, 'containers', shipmentToMarkArrived.id), {
          status: 'Open'
        });
      } catch (e) {}

      // SYNC: Update Inventory
      try {
        const inventoryId = `${shipmentToMarkArrived.product}-${shipmentToMarkArrived.id}`.replace(/\//g, '-');
        const qtyIn = parseFloat(shipmentToMarkArrived.qty) || 0;
        const inventoryData = {
          name: shipmentToMarkArrived.product,
          category: 'Seafood',
          origin: shipmentToMarkArrived.origin,
          supplier: shipmentToMarkArrived.supplier,
          container: shipmentToMarkArrived.id,
          qtyIn: qtyIn,
          qtySold: 0,
          qtyRem: qtyIn,
          unit: shipmentToMarkArrived.unit || 'KG',
          unitCost: 0,
          location: 'Pending Allocation',
          status: 'In Stock',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'inventory', inventoryId), inventoryData, { merge: true });
        
        // Log movement
        const movId = `MOV-${Date.now()}`;
        await setDoc(doc(db, 'inventory_movements', movId), {
          date: new Date().toLocaleDateString(),
          product: shipmentToMarkArrived.product,
          container: shipmentToMarkArrived.id,
          type: 'IN',
          qty: `${qtyIn} ${shipmentToMarkArrived.unit || 'KG'}`,
          ref: 'SHIP-ARR',
          by: auth.currentUser?.email || 'System',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error syncing to inventory:", e);
      }

      setIsArrivedModalOpen(false);
      setShipmentToMarkArrived(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shipments/${shipmentToMarkArrived.id}`);
    }
  };

  const handleDeleteShipment = (ship: any) => {
    setShipmentToDelete(ship);
    setIsDeleteModalOpen(true);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedShipments = React.useMemo(() => {
    let sortableItems = [...shipments];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
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
    return sortableItems;
  }, [shipments, sortConfig]);

  const handleExportAll = () => {
    if (sortedShipments.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = sortedShipments.map(ship => ({
      'Container No.': ship.id,
      'Supplier': ship.supplier,
      'Product': ship.product,
      'Origin': ship.origin,
      'Quantity': `${ship.qty} ${ship.unit || 'KG'}`,
      'Destination': ship.dest,
      'ETD': formatDate(ship.etd),
      'ETA': formatDate(ship.eta),
      'Vessel': ship.vessel,
      'BL Number': ship.bl,
      'Status': ship.status,
      'Clearing Cost (AED)': ship.cost
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');
    XLSX.writeFile(workbook, `Shipments_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const confirmDelete = async () => {
    if (!shipmentToDelete) return;
    try {
      const shipId = shipmentToDelete.id;
      await deleteDoc(doc(db, 'shipments', shipId));
      
      // SYNC: Delete from containers and inventory
      try {
        await deleteDoc(doc(db, 'containers', shipId));
      } catch (e) {
        console.error("Error deleting container:", e);
      }

      try {
        const inventoryId = `${shipmentToDelete.product}-${shipId}`.replace(/\//g, '-');
        await deleteDoc(doc(db, 'inventory', inventoryId));
        
        // Log movement
        const movId = `MOV-DEL-${Date.now()}`;
        await setDoc(doc(db, 'inventory_movements', movId), {
          date: new Date().toLocaleDateString(),
          product: shipmentToDelete.product,
          container: shipmentToDelete.id,
          type: 'OUT',
          qty: `${shipmentToDelete.qty} ${shipmentToDelete.unit || 'KG'}`,
          ref: 'SHIP-DEL',
          by: auth.currentUser?.email || 'System',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error deleting inventory:", e);
      }

      if (selectedShipment?.id === shipId) {
        setSelectedShipment(null);
      }
      setShipmentToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shipments/${shipmentToDelete.id}`);
    }
  };

  const handleDocumentSave = (data: any, files: { file: File; base64: string }[]) => {
    const logistics = data.logistics || data.extracted_data || data;
    const procurement = data.procurement || data.extracted_data || data;
    
    setShipmentForm(prev => ({
      ...prev,
      id: logistics.container_number || logistics.bl_number || prev.id,
      supplier: procurement.supplier_name || prev.supplier,
      product: procurement.product_description || procurement.items?.[0]?.description || prev.product,
      origin: logistics.port_of_loading || logistics.origin_country || prev.origin,
      qty: procurement.quantity || procurement.items?.[0]?.quantity || prev.qty,
      vessel: logistics.vessel_name || prev.vessel,
      bl: logistics.bl_number || prev.bl,
    }));

    setTempDocuments({ data, files });
    setIsPreFillModalOpen(false);
  };

  const handleOpenUploadModal = (type: string) => {
    setUploadDocType(type);
    setIsUploadModalOpen(true);
  };

  const timelineSteps = [
    { step: 'PO Confirmed', status: 'Completed', date: 'Oct 15, 2025' },
    { step: 'Pre-Shipment Inspection', status: 'Completed', date: 'Oct 22, 2025' },
    { step: '70% Payment Released', status: 'Completed', date: 'Oct 28, 2025' },
    { step: 'BL Surrendered', status: 'Completed', date: 'Nov 01, 2025' },
    { step: 'In Transit', status: 'Completed', date: 'Nov 02, 2025' },
    { step: 'Arrived at Port', status: 'Completed', date: 'Nov 25, 2025' },
    { step: 'Customs Clearance', status: 'Completed', date: 'Nov 28, 2025' },
    { step: 'Delivered to Warehouse', status: 'Completed', date: 'Nov 30, 2025' },
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search shipments..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
          />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportAll}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <i className="fa-solid fa-file-import"></i> Import Excel
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
            >
              <i className="fa-solid fa-plus"></i> New Shipment
            </button>
          </div>
        )}
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
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('vessel')}>
                  <div className="flex items-center gap-1">
                    Vessel {sortConfig?.key === 'vessel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('bl')}>
                  <div className="flex items-center gap-1">
                    BL Number {sortConfig?.key === 'bl' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('etd')}>
                  <div className="flex items-center gap-1">
                    ETD {sortConfig?.key === 'etd' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('eta')}>
                  <div className="flex items-center gap-1">
                    ETA {sortConfig?.key === 'eta' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cost')}>
                  <div className="flex items-center justify-end gap-1">
                    Clearing Cost (AED) {sortConfig?.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedShipments.map((ship, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                  <td className="px-6 py-4 font-bold text-slate-700">{ship.id}</td>
                  <td className="px-6 py-4 text-slate-600">{ship.supplier}</td>
                  <td className="px-6 py-4 text-slate-600">{ship.vessel}</td>
                  <td className="px-6 py-4 text-slate-500">{ship.bl}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(ship.etd)}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(ship.eta)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${ship.status === 'Cleared' ? 'bg-green-100 text-green-700' : 
                        ship.status === 'Arrived' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                      {ship.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{ship.cost}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      {ship.status === 'In Transit' && isAdmin && (
                        <button 
                          onClick={() => handleMarkArrived(ship)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as Arrived"
                        >
                          <i className="fa-solid fa-anchor"></i>
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedShipment(ship)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => handleOpenModal(ship)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteShipment(ship)}
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
      </div>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShipment(null)}
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
                  <h2 className="text-xl font-bold">Shipment Details: {selectedShipment.id}</h2>
                  <p className="text-white/60 text-sm">{selectedShipment.vessel} | {selectedShipment.bl}</p>
                </div>
                <button onClick={() => setSelectedShipment(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Route Info */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Origin</div>
                    <div className="text-lg font-bold text-slate-800">{selectedShipment.origin}</div>
                    <div className="text-xs text-slate-500">ETD: {formatDate(selectedShipment.etd)}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-10">
                    <div className="w-full h-px bg-slate-200 relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1F4E79] bg-white px-2">
                        <i className="fa-solid fa-ship text-2xl"></i>
                      </div>
                    </div>
                    <div className="mt-4 text-xs font-bold text-[#1F4E79] uppercase tracking-widest">{selectedShipment.status}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination</div>
                    <div className="text-lg font-bold text-slate-800">{selectedShipment.dest}</div>
                    <div className="text-xs text-slate-500">ETA: {formatDate(selectedShipment.eta)}</div>
                  </div>
                </div>

                {/* Logistics Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Vessel Info</div>
                    <div className="font-bold text-slate-800">{selectedShipment.vessel}</div>
                    <div className="text-sm text-slate-500">BL: {selectedShipment.bl}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Clearing Details</div>
                    <div className="font-bold text-slate-800">AED {selectedShipment.cost}</div>
                    <div className="text-sm text-slate-500">Total Logistics Cost</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Current Location</div>
                    <div className="font-bold text-blue-600">{selectedShipment.status === 'Cleared' ? 'Warehouse' : 'In Transit'}</div>
                    <div className="text-sm text-slate-500">Last Updated: Just now</div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-paperclip text-[#1F4E79]"></i> Shipment Documents
                    </h3>
                    <button 
                      onClick={() => handleOpenUploadModal('Auto-Detect')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus"></i> Add Document
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Bill of Lading', 'Commercial Invoice', 'Packing List', 'Clearing Document'].map((docType, i) => {
                      const existingDoc = shipmentDocuments.find(d => d.docType === docType);
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
                  {editingShipment ? 'Edit Shipment' : 'New Shipment Registration'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {!editingShipment && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Pre-fill</p>
                        <p className="text-[10px] text-blue-700">Upload BL or Invoice to auto-complete this form</p>
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
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. TFC/EX026/25"
                      value={shipmentForm.id}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, id: e.target.value })}
                      disabled={!!editingShipment}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Tabuk Fisheries"
                      value={shipmentForm.supplier}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, supplier: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin Port</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Ho Chi Minh"
                      value={shipmentForm.origin}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, origin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dest Port</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Jeddah Port"
                      value={shipmentForm.dest}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, dest: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vessel</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. MSC LILY"
                      value={shipmentForm.vessel}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, vessel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">BL Number</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. BL-992341"
                      value={shipmentForm.bl}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, bl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. 12000"
                      value={shipmentForm.qty}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, qty: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                      value={shipmentForm.unit}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, unit: e.target.value })}
                    >
                      <option value="KG">KG</option>
                      <option value="Box">Box</option>
                      <option value="PCS">PCS</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ETD</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      value={shipmentForm.etd}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, etd: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ETA</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      value={shipmentForm.eta}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, eta: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                      value={shipmentForm.status}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, status: e.target.value })}
                    >
                      <option value="In Transit">In Transit</option>
                      <option value="Arrived">Arrived</option>
                      <option value="Cleared">Cleared</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clearing Cost (AED)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                    value={shipmentForm.cost}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, cost: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSaveShipment}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {editingShipment ? 'Update Shipment' : 'Register Shipment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Arrived Confirmation Modal */}
      <AnimatePresence>
        {isArrivedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsArrivedModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fa-solid fa-anchor"></i>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Confirm Arrival</h2>
              <p className="text-slate-500 mb-8">
                Are you sure you want to mark shipment <span className="font-bold text-slate-700">{shipmentToMarkArrived?.id}</span> as <span className="text-blue-600 font-bold">Arrived</span>? This will update its status in the system.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsArrivedModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMarkArrived}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                >
                  Confirm
                </button>
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
        message={`Are you sure you want to delete shipment ${shipmentToDelete?.id}? This action cannot be undone and will remove the shipment from the system.`}
        confirmText="Delete Shipment"
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (data) => {
          const batch = writeBatch(db);
          data.forEach((item) => {
            const id = (item.id || `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).trim().replace(/\//g, '-');
            const docRef = doc(db, 'shipments', id);
            batch.set(docRef, {
              ...item,
              id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }}
        schema={{
          id: { label: 'Container No.', required: true },
          supplier: { label: 'Supplier', required: true },
          product: { label: 'Product', required: true },
          origin: { label: 'Origin Port' },
          dest: { label: 'Dest Port' },
          vessel: { label: 'Vessel' },
          bl: { label: 'BL Number' },
          qty: { label: 'Quantity', type: 'number' },
          unit: { label: 'Unit' },
          etd: { label: 'ETD', type: 'date' },
          eta: { label: 'ETA', type: 'date' },
          status: { label: 'Status' },
          cost: { label: 'Clearing Cost', type: 'number' }
        }}
        templateData={[
          { 'Container No.': 'CONT-123456', 'Supplier': 'Global Trading', 'Product': 'Frozen Beef', 'Origin Port': 'Brazil', 'Dest Port': 'Jebel Ali', 'Vessel': 'Ocean Star', 'BL Number': 'BL987654', 'Quantity': 25000, 'Unit': 'KG', 'ETD': '2024-01-01', 'ETA': '2024-02-01', 'Status': 'In Transit', 'Clearing Cost': 5000 }
        ]}
        title="Import Shipments"
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialDocType={uploadDocType}
        linkedRecordId={selectedShipment?.id}
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
