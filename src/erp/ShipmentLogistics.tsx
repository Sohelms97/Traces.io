import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';

export default function ShipmentLogistics() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const { isAdmin } = useAuth();

  // Form State
  const [shipmentForm, setShipmentForm] = useState({
    id: '',
    supplier: '',
    product: '',
    origin: '',
    dest: '',
    etd: '',
    eta: '',
    vessel: '',
    bl: '',
    status: 'In Transit',
    cost: '0'
  });

  useEffect(() => {
    const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultShipments = [
          { id: 'TFC/EX026/25', supplier: 'Tabuk Fisheries', product: 'Sea Bream', origin: 'Tabuk Port', dest: 'Jeddah Port', etd: 'Nov 02, 2025', eta: 'Nov 25, 2025', vessel: 'MSC LILY', bl: 'BL-992341', status: 'Cleared', cost: '12,500', createdAt: serverTimestamp() },
          { id: 'FBIU5326683', supplier: 'Hong Long Seafood', product: 'Keski', origin: 'Ho Chi Minh', dest: 'Dammam Port', etd: 'Nov 15, 2025', eta: 'Dec 10, 2025', vessel: 'MAERSK SEOUL', bl: 'BL-881234', status: 'Cleared', cost: '8,200', createdAt: serverTimestamp() },
        ];
        defaultShipments.forEach(async (shp) => {
          await setDoc(doc(db, 'shipments', shp.id), shp);
        });
      } else {
        setShipments(docs);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingShipment(item);
      setShipmentForm({
        id: item.id,
        supplier: item.supplier,
        product: item.product,
        origin: item.origin,
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
      setShipmentForm({ id: '', supplier: '', product: '', origin: '', dest: '', etd: '', eta: '', vessel: '', bl: '', status: 'In Transit', cost: '0' });
    }
    setIsModalOpen(true);
  };

  const handleSaveShipment = async () => {
    try {
      const shipmentData = {
        ...shipmentForm,
        updatedAt: serverTimestamp(),
        createdAt: editingShipment ? editingShipment.createdAt : serverTimestamp()
      };

      if (editingShipment) {
        await updateDoc(doc(db, 'shipments', editingShipment.id), shipmentData);
      } else {
        const newId = shipmentForm.id || `SHP-${Date.now()}`;
        await setDoc(doc(db, 'shipments', newId), { ...shipmentData, id: newId });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving shipment:", error);
    }
  };

  const handleDeleteShipment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    try {
      await deleteDoc(doc(db, 'shipments', id));
      if (selectedShipment?.id === id) {
        setSelectedShipment(null);
      }
    } catch (error) {
      console.error("Error deleting shipment:", error);
    }
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
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
          >
            <i className="fa-solid fa-plus"></i> New Shipment
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Container No.</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Vessel</th>
                <th className="px-6 py-4">BL Number</th>
                <th className="px-6 py-4">ETD</th>
                <th className="px-6 py-4">ETA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Clearing Cost (SAR)</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {shipments.map((ship, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                  <td className="px-6 py-4 font-bold text-slate-700">{ship.id}</td>
                  <td className="px-6 py-4 text-slate-600">{ship.supplier}</td>
                  <td className="px-6 py-4 text-slate-600">{ship.vessel}</td>
                  <td className="px-6 py-4 text-slate-500">{ship.bl}</td>
                  <td className="px-6 py-4 text-slate-500">{ship.etd}</td>
                  <td className="px-6 py-4 text-slate-500">{ship.eta}</td>
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
                            onClick={() => handleDeleteShipment(ship.id)}
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
                    <div className="text-xs text-slate-500">ETD: {selectedShipment.etd}</div>
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
                    <div className="text-xs text-slate-500">ETA: {selectedShipment.eta}</div>
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
                    <div className="font-bold text-slate-800">SAR {selectedShipment.cost}</div>
                    <div className="text-sm text-slate-500">Total Logistics Cost</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Current Location</div>
                    <div className="font-bold text-blue-600">{selectedShipment.status === 'Cleared' ? 'Warehouse' : 'In Transit'}</div>
                    <div className="text-sm text-slate-500">Last Updated: Just now</div>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ETD</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Nov 02, 2025"
                      value={shipmentForm.etd}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, etd: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ETA</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                      placeholder="e.g. Nov 25, 2025"
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clearing Cost (SAR)</label>
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
    </div>
  );
}
