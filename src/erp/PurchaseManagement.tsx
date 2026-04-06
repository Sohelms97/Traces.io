import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function PurchaseManagement() {
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const { isAdmin } = useAuth();

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

      if (editingPO) {
        await updateDoc(doc(db, 'purchase_orders', editingPO.id), poData);
      } else {
        const newId = poForm.id || `PO-${Date.now()}`;
        await setDoc(doc(db, 'purchase_orders', newId), { ...poData, id: newId });
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

  const handleDeletePO = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PO?')) return;
    try {
      await deleteDoc(doc(db, 'purchase_orders', id));
    } catch (error) {
      console.error("Error deleting PO:", error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      console.error("Error deleting supplier:", error);
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
          />
        </div>
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

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'pos' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-right">Unit Price</th>
                  <th className="px-6 py-4 text-right">Total (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pos.map((po, i) => (
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
                              onClick={() => handleDeletePO(po.id)}
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
                  <th className="px-6 py-4">Supplier Name</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4 text-center">Total Orders</th>
                  <th className="px-6 py-4 text-right">Total Value (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {suppliers.map((supplier, i) => (
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
                              onClick={() => handleDeleteSupplier(supplier.id)}
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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price (SAR)</label>
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
                        SAR {(parseFloat(poForm.qty || '0') * parseFloat(poForm.unitPrice || '0')).toLocaleString()}
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
    </div>
  );
}
