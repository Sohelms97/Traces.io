import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const salesOrders = [
  { id: 'INV-101', customer: 'Abdullah Bin Hathboor', product: 'Sea Bream', container: 'TFC/EX026/25', qty: '5,000 KG', price: '26.85', total: '134,250', type: 'Credit', status: 'Paid', due: 'Dec 30, 2025' },
  { id: 'INV-102', customer: 'Bait Al Qaseed', product: 'Sea Bream', container: 'TFC/EX026/25', qty: '7,000 KG', price: '26.85', total: '187,950', type: 'Credit', status: 'Paid', due: 'Dec 30, 2025' },
  { id: 'INV-103', customer: 'Fresh Shrimp', product: 'Keski', container: 'FBIU5326683', qty: '2,850 Box', price: '46.26', total: '131,850', type: 'Cash', status: 'Paid', due: 'Jan 10, 2026' },
  { id: 'INV-104', customer: 'Abdullah Bin Hathboor', product: 'Squid', container: 'Inv.34', qty: '2,260 Box', price: '138.32', total: '312,610', type: 'Credit', status: 'Paid', due: 'Jan 15, 2026' },
  { id: 'INV-105', customer: 'Bait Al Qaseed', product: 'Rohu', container: 'SZLU9069865', qty: '5,000 KG', price: '7.50', total: '37,500', type: 'Credit', status: 'Outstanding', due: 'Feb 28, 2026' },
];

const customers = [
  { name: 'Abdullah Bin Hathboor', orders: 12, value: '1,450,000', balance: '0', status: 'Active' },
  { name: 'Bait Al Qaseed', orders: 8, value: '820,000', balance: '37,500', status: 'Active' },
  { name: 'Fresh Shrimp', orders: 5, value: '450,000', balance: '0', status: 'Active' },
];

export default function SalesManagement() {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'receivables'>('orders');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sales Orders
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customers' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Customer Master
        </button>
        <button 
          onClick={() => setActiveTab('receivables')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'receivables' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Accounts Receivable
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'orders' ? 'invoices' : 'customers'}...`} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fa-solid fa-receipt"></i> Payment Receipt
          </button>
          <button className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm">
            <i className="fa-solid fa-plus"></i> New Sales Invoice
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Container</th>
                  <th className="px-6 py-4 text-right">Qty Sold</th>
                  <th className="px-6 py-4 text-right">Total Sales (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {salesOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{order.id}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{order.product}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{order.container}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{order.qty}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-eye"></i></button>
                        <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"><i className="fa-solid fa-print"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'customers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4 text-center">Total Orders</th>
                  <th className="px-6 py-4 text-right">Total Value (SAR)</th>
                  <th className="px-6 py-4 text-right">Outstanding (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {customers.map((customer, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{customer.name}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{customer.orders}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{customer.value}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{customer.balance}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-user-pen"></i></button>
                        <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"><i className="fa-solid fa-file-lines"></i></button>
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
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4 text-right">Amount (SAR)</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Days Overdue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { customer: 'Bait Al Qaseed', inv: 'INV-105', amount: '37,500', due: 'Feb 28, 2026', days: 32, status: 'Overdue' },
                  { customer: 'Fresh Shrimp', inv: 'INV-106', amount: '12,400', due: 'Mar 15, 2026', days: 17, status: 'Overdue' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{row.inv}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amount}</td>
                    <td className="px-6 py-4 text-slate-500">{row.due}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">{row.days} Days</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Follow-up Log">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </button>
                    </td>
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
