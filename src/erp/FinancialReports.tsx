import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const reportTabs = [
  { id: 'container', name: 'Container-wise P&L', icon: 'fa-box' },
  { id: 'monthly', name: 'Monthly Summary', icon: 'fa-calendar-days' },
  { id: 'supplier', name: 'Supplier-wise', icon: 'fa-truck-field' },
  { id: 'customer', name: 'Customer-wise', icon: 'fa-users' },
  { id: 'investor', name: 'Investor ROI', icon: 'fa-hand-holding-dollar' },
];

const containerPL = [
  { id: 'TFC/EX026/25', cost: '312,360', sales: '322,200', gp: '9,840', roi: '3.15%', status: 'Closed', month: 'Nov 2025' },
  { id: 'FBIU5326683', cost: '115,036', sales: '131,850', gp: '16,814', roi: '14.62%', status: 'Closed', month: 'Dec 2025' },
  { id: 'Inv.34', cost: '325,890', sales: '312,610', gp: '-13,280', roi: '-4.08%', status: 'Closed', month: 'Dec 2025' },
  { id: 'SZLU9069865', cost: '165,000', sales: '0', gp: '0', roi: '0%', status: 'Open', month: 'Jan 2026' },
  { id: 'OTPU6690769', cost: '121,477', sales: '0', gp: '0', roi: '0%', status: 'Open', month: 'Feb 2026' },
];

const monthlySummary = [
  { month: 'Nov 2025', containers: 4, sales: '2,450,000', cost: '1,800,000', gp: '650,000', gpPerc: '26.5%' },
  { month: 'Dec 2025', containers: 13, sales: '3,120,000', cost: '2,400,000', gp: '720,000', gpPerc: '23.1%' },
  { month: 'Jan 2026', containers: 13, sales: '2,100,000', cost: '1,500,000', gp: '600,000', gpPerc: '28.6%' },
  { month: 'Feb 2026', containers: 7, sales: '2,725,310', cost: '1,950,000', gp: '775,310', gpPerc: '28.4%' },
];

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState('container');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/50 p-1 rounded-xl w-fit">
        {reportTabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">From:</span>
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To:</span>
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <button className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#163a5a] transition-colors">Apply Filter</button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="Export Excel"><i className="fa-solid fa-file-excel text-xl"></i></button>
          <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Export PDF"><i className="fa-solid fa-file-pdf text-xl"></i></button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Print"><i className="fa-solid fa-print text-xl"></i></button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'container' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Container No.</th>
                  <th className="px-6 py-4 text-right">Purchase Cost (SAR)</th>
                  <th className="px-6 py-4 text-right">Sales (SAR)</th>
                  <th className="px-6 py-4 text-right">GP (SAR)</th>
                  <th className="px-6 py-4 text-right">ROI</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {containerPL.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.id}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.cost}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.sales}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.gp}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.roi}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${row.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{row.month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4 text-center">Total Containers</th>
                  <th className="px-6 py-4 text-right">Total Sales (SAR)</th>
                  <th className="px-6 py-4 text-right">Total Cost (SAR)</th>
                  <th className="px-6 py-4 text-right">Gross Profit (SAR)</th>
                  <th className="px-6 py-4 text-right">GP %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {monthlySummary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.month}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-bold">{row.containers}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.sales}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.cost}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.gp}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.gpPerc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-center">No. of Containers</th>
                  <th className="px-6 py-4 text-right">Total Purchase Value (SAR)</th>
                  <th className="px-6 py-4">Main Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { name: 'Tabuk Fisheries', count: 4, value: '1,120,800', products: 'Sea Bream' },
                  { name: 'QUE KY FOODS', count: 2, value: '220,000', products: 'Pangasius Fillet' },
                  { name: 'HONG LONG SEAFOOD', count: 3, value: '300,000', products: 'Keski' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-bold">{row.count}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.value}</td>
                    <td className="px-6 py-4 text-slate-500">{row.products}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Total Sales (SAR)</th>
                  <th className="px-6 py-4 text-right">Total Paid (SAR)</th>
                  <th className="px-6 py-4 text-right">Outstanding (SAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { name: 'Abdullah Bin Hathboor', sales: '1,450,000', paid: '1,450,000', balance: '0' },
                  { name: 'Bait Al Qaseed', sales: '820,000', paid: '782,500', balance: '37,500' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.sales}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.paid}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'investor' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Investor</th>
                  <th className="px-6 py-4 text-right">Investment (SAR)</th>
                  <th className="px-6 py-4 text-right">Returns (SAR)</th>
                  <th className="px-6 py-4 text-right">ROI %</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { name: 'Abdullah Al-Saud', amount: '500,000', returns: '62,500', roi: '12.5%', status: 'Active' },
                  { name: 'Fahad Bin Khalid', amount: '250,000', returns: '0', roi: '15.0%', status: 'Active' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.amount}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.returns}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">{row.roi}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        {row.status}
                      </span>
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
