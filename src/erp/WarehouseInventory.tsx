import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const inventory = [
  { name: 'Sea Bream', category: 'Seafood', origin: 'Saudi Arabia', supplier: 'Tabuk Fisheries', container: 'TFC/EX026/25', qtyIn: '12,000 KG', qtySold: '12,000 KG', qtyRem: '0 KG', unitCost: '23.35', value: '0', status: 'Out of Stock' },
  { name: 'Keski', category: 'Seafood', origin: 'Vietnam', supplier: 'Hong Long Seafood', container: 'FBIU5326683', qtyIn: '3,000 Box', qtySold: '2,850 Box', qtyRem: '150 Box', unitCost: '33.33', value: '4,999', status: 'Low Stock' },
  { name: 'Squid', category: 'Seafood', origin: 'Pakistan', supplier: 'FMA Pakistan', container: 'Inv.34', qtyIn: '2,260 Box', qtySold: '2,260 Box', qtyRem: '0 Box', unitCost: '123.89', value: '0', status: 'Out of Stock' },
  { name: 'Rohu', category: 'Seafood', origin: 'Thailand', supplier: 'PAKTHAI IMPEX', container: 'SZLU9069865', qtyIn: '27,000 KG', qtySold: '0 KG', qtyRem: '27,000 KG', unitCost: '5.55', value: '149,850', status: 'In Stock' },
  { name: 'Pangasius Fillet', category: 'Seafood', origin: 'Vietnam', supplier: 'QUE KY FOODS', container: 'OTPU6690769', qtyIn: '25,000 KG', qtySold: '0 KG', qtyRem: '25,000 KG', unitCost: '4.40', value: '110,000', status: 'In Stock' },
];

const movementLog = [
  { date: 'Nov 30, 2025', product: 'Sea Bream', container: 'TFC/EX026/25', type: 'IN', qty: '12,000 KG', ref: 'GRN-001', by: 'Warehouse Admin' },
  { date: 'Dec 05, 2025', product: 'Sea Bream', container: 'TFC/EX026/25', type: 'OUT', qty: '5,000 KG', ref: 'INV-101', by: 'Sales Admin' },
  { date: 'Dec 10, 2025', product: 'Keski', container: 'FBIU5326683', type: 'IN', qty: '3,000 Box', ref: 'GRN-002', by: 'Warehouse Admin' },
  { date: 'Jan 15, 2026', product: 'Rohu', container: 'SZLU9069865', type: 'IN', qty: '27,000 KG', ref: 'GRN-003', by: 'Warehouse Admin' },
  { date: 'Jan 20, 2026', product: 'Rohu', container: 'SZLU9069865', type: 'DAMAGE', qty: '200 KG', ref: 'ADJ-001', by: 'Warehouse Admin' },
];

export default function WarehouseInventory() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movement'>('stock');

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total SKUs</div>
          <div className="text-2xl font-bold text-slate-800">24</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stock Value</div>
          <div className="text-2xl font-bold text-[#1F4E79]">SAR 264,849</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-orange-500">3</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damaged Items</div>
          <div className="text-2xl font-bold text-red-500">200 KG</div>
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
          <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fa-solid fa-file-invoice"></i> Generate GRN
          </button>
          <button className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm">
            <i className="fa-solid fa-plus"></i> Stock Adjustment
          </button>
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
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{item.container}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtyIn}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.qtySold}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{item.qtyRem}</td>
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
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-eye"></i></button>
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
                {movementLog.map((log, i) => (
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
    </div>
  );
}
