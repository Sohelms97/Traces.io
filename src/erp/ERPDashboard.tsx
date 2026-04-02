import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'motion/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const kpiData = [
  { label: 'Total Containers', value: '12', sub: 'This Month', icon: 'fa-box', color: 'blue' },
  { label: 'Containers Closed', value: '8', sub: 'Verified', icon: 'fa-circle-check', color: 'green' },
  { label: 'Containers Open', value: '4', sub: 'In Progress', icon: 'fa-clock', color: 'yellow' },
  { label: 'Total Purchase', value: 'SAR 4.2M', sub: 'Nov-Feb', icon: 'fa-cart-shopping', color: 'indigo' },
  { label: 'Total Sales', value: 'SAR 10.4M', sub: 'Nov-Feb', icon: 'fa-sack-dollar', color: 'emerald' },
  { label: 'Gross Profit', value: 'SAR 271K', sub: 'Net Performance', icon: 'fa-chart-line', color: 'teal' },
  { label: 'Overall ROI', value: '6.45%', sub: 'Average', icon: 'fa-percent', color: 'orange' },
  { label: 'Pending Payments', value: 'SAR 1.1M', sub: 'Accounts Receivable', icon: 'fa-money-bill-transfer', color: 'red' },
];

const recentActivity = [
  { id: 'TFC/EX026/25', supplier: 'Tabuk Fisheries', product: 'Sea Bream', status: 'Closed', sales: '322,200', gp: '9,840', roi: '3.15%' },
  { id: 'FBIU5326683', supplier: 'Hong Long Seafood', product: 'Keski', status: 'Closed', sales: '131,850', gp: '16,814', roi: '14.62%' },
  { id: 'Inv.34', supplier: 'FMA Pakistan', product: 'Squid', status: 'Closed', sales: '312,610', gp: '13,280', roi: '-4.08%' },
  { id: 'SZLU9069865', supplier: 'PAKTHAI IMPEX', product: 'Rohu', status: 'Open', sales: '0', gp: '0', roi: '0%' },
  { id: 'OTPU6690769', supplier: 'QUE KY FOODS', product: 'Pangasius Fillet', status: 'Open', sales: '0', gp: '0', roi: '0%' },
];

export default function ERPDashboard() {
  // Chart Data
  const salesVsPurchaseData = {
    labels: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'],
    datasets: [
      {
        label: 'Sales (SAR)',
        data: [2450000, 3120000, 2100000, 2725310],
        backgroundColor: '#10b981',
      },
      {
        label: 'Purchase Cost (SAR)',
        data: [1800000, 2400000, 1500000, 1950000],
        backgroundColor: '#1f4e79',
      },
    ],
  };

  const profitTrendData = {
    labels: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'],
    datasets: [
      {
        label: 'Gross Profit (SAR)',
        data: [65000, 72000, 60000, 74224],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const containerStatusData = {
    labels: ['Open', 'Closed', 'In Transit'],
    datasets: [
      {
        data: [4, 8, 3],
        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  const topProductsData = {
    labels: ['Sea Bream', 'Pangasius', 'Keski', 'Squid', 'Scampi'],
    datasets: [
      {
        label: 'Revenue (SAR)',
        data: [322200, 245000, 131850, 312610, 185000],
        backgroundColor: [
          '#1f4e79',
          '#2c6693',
          '#3a7ead',
          '#4896c7',
          '#56aee1',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors">
            <i className="fa-solid fa-plus"></i> New Container
          </button>
          <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <i className="fa-solid fa-cart-plus"></i> New Purchase Order
          </button>
          <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <i className="fa-solid fa-truck-fast"></i> New Shipment
          </button>
        </div>
        <button className="text-[#1F4E79] font-bold text-sm flex items-center gap-2 hover:underline">
          <i className="fa-solid fa-file-export"></i> View Reports
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpiData.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg
                ${kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                ${kpi.color === 'green' ? 'bg-green-50 text-green-600' : ''}
                ${kpi.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' : ''}
                ${kpi.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : ''}
                ${kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
                ${kpi.color === 'teal' ? 'bg-teal-50 text-teal-600' : ''}
                ${kpi.color === 'orange' ? 'bg-orange-50 text-orange-600' : ''}
                ${kpi.color === 'red' ? 'bg-red-50 text-red-600' : ''}
              `}>
                <i className={`fa-solid ${kpi.icon}`}></i>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</div>
              <div className="text-[10px] text-slate-400">{kpi.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Sales vs Purchase Cost</h3>
          <div className="h-80">
            <Bar 
              data={salesVsPurchaseData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Gross Profit Trend</h3>
          <div className="h-80">
            <Line 
              data={profitTrendData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Container Status Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <div className="w-64 h-64">
              <Doughnut 
                data={containerStatusData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Products by Revenue</h3>
          <div className="h-80">
            <Bar 
              data={topProductsData} 
              options={{ 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Recent Container Transactions</h3>
          <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Container No.</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Sales (SAR)</th>
                <th className="px-6 py-4 text-right">GP (SAR)</th>
                <th className="px-6 py-4 text-right">ROI</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentActivity.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.id}</td>
                  <td className="px-6 py-4 text-slate-600">{row.supplier}</td>
                  <td className="px-6 py-4 text-slate-600">{row.product}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${row.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}
                    `}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.sales}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.gp}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${row.roi.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                      {row.roi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="View">
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" title="Edit">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
