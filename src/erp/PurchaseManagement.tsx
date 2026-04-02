import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function PurchaseManagement() {
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [pos, setPos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('traces_purchase_orders');
    const initialPOs = [
      { id: 'PO-2025-001', supplier: 'Tabuk Fisheries', product: 'Sea Bream', qty: '12,000 KG', unitPrice: '23.35', total: '280,200', status: 'Fully Paid', date: 'Oct 15, 2025' },
      { id: 'PO-2025-002', supplier: 'Hong Long Seafood', product: 'Keski', qty: '3,000 Box', unitPrice: '33.33', total: '100,000', status: 'Fully Paid', date: 'Nov 05, 2025' },
      { id: 'PO-2025-003', supplier: 'FMA Pakistan', product: 'Squid', qty: '2,260 Box', unitPrice: '123.89', total: '280,000', status: '70% Paid', date: 'Nov 12, 2025' },
      { id: 'PO-2026-001', supplier: 'PAKTHAI IMPEX', product: 'Rohu', qty: '27,000 KG', unitPrice: '5.55', total: '150,000', status: 'Advance Paid', date: 'Jan 02, 2026' },
      { id: 'PO-2026-002', supplier: 'QUE KY FOODS', product: 'Pangasius Fillet', qty: '25,000 KG', unitPrice: '4.40', total: '110,000', status: 'Advance Paid', date: 'Feb 10, 2026' },
    ];

    if (stored) {
      setPos(JSON.parse(stored));
    } else {
      setPos(initialPOs);
      localStorage.setItem('traces_purchase_orders', JSON.stringify(initialPOs));
    }
  }, []);

  const suppliers = [
    { name: 'Tabuk Fisheries', country: 'Saudi Arabia', products: 'Sea Bream', orders: 4, value: '1,120,800', status: 'Active' },
    { name: 'QUE KY FOODS', country: 'Vietnam', products: 'Pangasius Fillet', orders: 2, value: '220,000', status: 'Active' },
    { name: 'HONG LONG SEAFOOD', country: 'Vietnam', products: 'Keski', orders: 3, value: '300,000', status: 'Active' },
    { name: 'FMA Pakistan', country: 'Pakistan', products: 'Squid', orders: 1, value: '280,000', status: 'Active' },
    { name: 'Apex Foods Ltd.', country: 'Bangladesh', products: 'Scampi Shrimp', orders: 1, value: '185,000', status: 'Active' },
  ];

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
            onClick={() => setIsModalOpen(true)}
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
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{po.id || po.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-600">{po.supplier || po.supplier_name}</td>
                    <td className="px-6 py-4 text-slate-600">{po.product || po.product_description}</td>
                    <td className="px-6 py-4 text-slate-500">{po.qty || po.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{po.unitPrice || po.unit_price}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{po.total || po.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${po.status === 'Fully Paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{po.date}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <>
                            <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"><i className="fa-solid fa-pen-to-square"></i></button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
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
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{supplier.name}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.country}</td>
                    <td className="px-6 py-4 text-slate-600">{supplier.products}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{supplier.orders}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{supplier.value}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"><i className="fa-solid fa-pen-to-square"></i></button>
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

      {/* PO Form Modal Placeholder */}
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
                <h2 className="text-xl font-bold">{activeTab === 'pos' ? 'Create Purchase Order' : 'Add New Supplier'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {activeTab === 'pos' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
                          <option>Select Supplier</option>
                          {suppliers.map(s => <option key={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="e.g. Sea Bream" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none">
                          <option>KG</option>
                          <option>Box</option>
                          <option>MT</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price (SAR)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500">Total Amount:</span>
                      <span className="text-xl font-bold text-[#1F4E79]">SAR 0.00</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier Name</label>
                      <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors">
                    {activeTab === 'pos' ? 'Create PO' : 'Add Supplier'}
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
