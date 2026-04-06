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
  deleteDoc,
  limit
} from 'firebase/firestore';

export default function WarehouseInventory() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movement'>('stock');
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { isAdmin } = useAuth();

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

  useEffect(() => {
    const inventoryQuery = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultInventory = [
          { name: 'Sea Bream', category: 'Seafood', origin: 'Saudi Arabia', supplier: 'Tabuk Fisheries', container: 'TFC/EX026/25', qtyIn: 12000, qtySold: 12000, unit: 'KG', unitCost: 23.35, location: 'Cold Store A-12', status: 'Out of Stock', createdAt: serverTimestamp() },
          { name: 'Keski', category: 'Seafood', origin: 'Vietnam', supplier: 'Hong Long Seafood', container: 'FBIU5326683', qtyIn: 3000, qtySold: 2850, unit: 'Box', unitCost: 33.33, location: 'Cold Store B-05', status: 'Low Stock', createdAt: serverTimestamp() },
          { name: 'Rohu', category: 'Seafood', origin: 'Thailand', supplier: 'PAKTHAI IMPEX', container: 'SZLU9069865', qtyIn: 27000, qtySold: 0, unit: 'KG', unitCost: 5.55, location: 'Cold Store A-14', status: 'In Stock', createdAt: serverTimestamp() },
        ];
        defaultInventory.forEach(async (item) => {
          const id = `${item.name}-${item.container}`.replace(/\//g, '-');
          await setDoc(doc(db, 'inventory', id), item);
        });
      } else {
        setInventory(docs);
      }
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
          await setDoc(doc(db, 'inventory_movements', `MOV-${Date.now()}-${Math.random()}`), mov);
        });
      } else {
        setMovements(docs);
      }
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

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
      } else {
        const id = `${itemForm.name}-${itemForm.container}`.replace(/\//g, '-');
        await setDoc(doc(db, 'inventory', id), itemData);
      }

      // Log movement if stock changed significantly or new item
      if (!editingItem || editingItem.qtyIn !== qtyInNum) {
        await setDoc(doc(db, 'inventory_movements', `MOV-${Date.now()}`), {
          date: new Date().toLocaleDateString(),
          product: itemForm.name,
          container: itemForm.container,
          type: 'IN',
          qty: `${qtyInNum} ${itemForm.unit}`,
          ref: editingItem ? 'ADJ-001' : 'GRN-NEW',
          by: 'Admin',
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving inventory item:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      console.error("Error deleting inventory item:", error);
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
          <div className="text-2xl font-bold text-[#1F4E79]">SAR {inventory.reduce((acc, item) => acc + (parseFloat(item.value?.replace(/,/g, '') || '0')), 0).toLocaleString()}</div>
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
          />
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
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
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Container No.</th>
                  <th className="px-6 py-4 text-right">Qty In</th>
                  <th className="px-6 py-4 text-right">Qty Sold</th>
                  <th className="px-6 py-4 text-right">Qty Remaining</th>
                  <th className="px-6 py-4 text-right">Stock Value (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {inventory.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{item.container}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtyIn} {item.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtySold} {item.unit}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{item.qtyRem} {item.unit}</td>
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
                              onClick={() => handleDeleteItem(item.id)}
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
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Container</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {movements.map((log, i) => (
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Cost (SAR)</label>
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
    </div>
  );
}
