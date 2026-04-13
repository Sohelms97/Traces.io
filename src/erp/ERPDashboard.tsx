import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Bar, Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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

export default function ERPDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const qContainers = query(collection(db, 'containers'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeContainers = onSnapshot(qContainers, (snapshot) => {
      setContainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qSales = query(collection(db, 'sales_orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeContainers();
      unsubscribeSales();
    };
  }, []);

  // Calculate KPIs
  const totalContainers = containers.length;
  const closedContainers = containers.filter(c => c.status === 'Closed').length;
  const openContainers = containers.filter(c => c.status === 'Open').length;
  const totalSalesVal = sales.reduce((acc, s) => acc + parseCurrency(s.total), 0);
  const totalPurchaseVal = containers.reduce((acc, c) => acc + parseCurrency(c.totalCost), 0);
  const totalGP = containers.reduce((acc, c) => acc + parseCurrency(c.gp), 0);
  const avgROI = totalContainers > 0 ? (containers.reduce((acc, c) => acc + parseCurrency(c.roi), 0) / totalContainers).toFixed(2) : '0';

  const kpiData = [
    { label: 'Total Containers', value: totalContainers.toString(), sub: 'In System', icon: 'fa-box', color: 'blue' },
    { label: 'Containers Closed', value: closedContainers.toString(), sub: 'Verified', icon: 'fa-circle-check', color: 'green' },
    { label: 'Containers Open', value: openContainers.toString(), sub: 'In Progress', icon: 'fa-clock', color: 'yellow' },
    { label: 'Total Purchase', value: `AED ${(totalPurchaseVal / 1000).toFixed(1)}K`, sub: 'Total Cost', icon: 'fa-cart-shopping', color: 'indigo' },
    { label: 'Total Sales', value: `AED ${(totalSalesVal / 1000).toFixed(1)}K`, sub: 'Revenue', icon: 'fa-sack-dollar', color: 'emerald' },
    { label: 'Gross Profit', value: `AED ${(totalGP / 1000).toFixed(1)}K`, sub: 'Net Performance', icon: 'fa-chart-line', color: 'teal' },
    { label: 'Overall ROI', value: `${avgROI}%`, sub: 'Average', icon: 'fa-percent', color: 'orange' },
    { label: 'Recent Orders', value: sales.length.toString(), sub: 'Last 10', icon: 'fa-receipt', color: 'red' },
  ];

  // Helper to get monthly stats for charts
  const getMonthlyStats = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last4Months = [];
    for (let i = 3; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      last4Months.push(months[idx]);
    }

    const stats = last4Months.map(m => ({ month: m, sales: 0, cost: 0, gp: 0 }));

    containers.forEach(c => {
      const mIdx = last4Months.indexOf(c.month);
      if (mIdx !== -1) {
        stats[mIdx].sales += parseCurrency(c.totalSales);
        stats[mIdx].cost += parseCurrency(c.totalCost);
        stats[mIdx].gp += parseCurrency(c.gp);
      }
    });

    return {
      labels: last4Months,
      sales: stats.map(s => s.sales),
      costs: stats.map(s => s.cost),
      gp: stats.map(s => s.gp)
    };
  };

  const monthlyData = getMonthlyStats();

  // Chart Data
  const salesVsPurchaseData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Sales (AED)',
        data: monthlyData.sales,
        backgroundColor: '#10b981',
      },
      {
        label: 'Purchase Cost (AED)',
        data: monthlyData.costs,
        backgroundColor: '#1f4e79',
      },
    ],
  };

  const profitTrendData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Gross Profit (AED)',
        data: monthlyData.gp,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart Data
  const containerStatusData = {
    labels: ['Open', 'Closed', 'In Transit'],
    datasets: [
      {
        data: [
          openContainers,
          closedContainers,
          containers.filter(c => c.status === 'In Transit').length
        ],
        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  const topProductsData = {
    labels: sales.map(s => s.product).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
    datasets: [
      {
        label: 'Revenue (AED)',
        data: sales.reduce((acc: any[], s) => {
          const existing = acc.find(item => item.product === s.product);
          if (existing) {
            existing.total += parseCurrency(s.total);
          } else {
            acc.push({ product: s.product, total: parseCurrency(s.total) });
          }
          return acc;
        }, []).sort((a: any, b: any) => b.total - a.total).slice(0, 5).map((item: any) => item.total),
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

  const cleanAIResponse = (text: string) => {
    // Remove markdown code blocks if present
    return text.replace(/```json\n?|```/g, '').trim();
  };

  const fetchAIInsights = async () => {
    const apiKey = process.env.GEMINI_API_KEY || localStorage.getItem('traces_api_key');
    if (!apiKey) {
      alert('AI Insights requires a Gemini API key. Please ensure it is configured in the environment or settings.');
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: localStorage.getItem('traces_ai_model') || 'gemini-3-flash-preview',
        contents: [{
          parts: [{
            text: `You are a senior business analyst for Farmers Market Asia, a seafood trading company.
            Analyze the following ERP data and provide 4-5 actionable business insights.
            Data:
            - Total Sales Revenue: AED ${totalSalesVal.toFixed(2)}
            - Total Purchase Cost: AED ${totalPurchaseVal.toFixed(2)}
            - Gross Profit: AED ${totalGP.toFixed(2)}
            - Average ROI: ${avgROI}%
            - Total Containers: ${totalContainers}
            - Open Containers: ${openContainers}
            - Closed Containers: ${closedContainers}
            - Recent Sales Orders: ${sales.length}
            
            Context:
            - Top Products (based on recent data): ${sales.map(s => s.product).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).join(', ')}
            
            Return ONLY a JSON array of objects with this structure:
            [
              {
                "type": "opportunity/risk/efficiency",
                "title": "Short title",
                "description": "Detailed analysis",
                "recommendation": "Actionable step",
                "impact": "high/medium/low"
              }
            ]`
          }]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const cleanedText = cleanAIResponse(response.text || '[]');
      const data = JSON.parse(cleanedText);
      setInsights(data);
      setLastUpdated(new Date().toLocaleString());
      localStorage.setItem('traces_ai_insights', JSON.stringify({ data, timestamp: new Date().toISOString() }));
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("Failed to generate AI insights. Check your API key and connection.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('traces_ai_insights');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      setInsights(data);
      setLastUpdated(new Date(timestamp).toLocaleString());
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Sparkles size={14} className={activeTab === 'insights' ? 'text-blue-600' : ''} />
          AI Insights
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => navigate('/erp/containers', { state: { openNewModal: true } })}
                      className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-lg shadow-blue-900/10"
                    >
                      <i className="fa-solid fa-plus"></i> New Container
                    </button>
                    <button 
                      onClick={() => navigate('/erp/purchases', { state: { openNewModal: true } })}
                      className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <i className="fa-solid fa-cart-plus"></i> New Purchase Order
                    </button>
                    <button 
                      onClick={() => navigate('/erp/shipments', { state: { openNewModal: true } })}
                      className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <i className="fa-solid fa-truck-fast"></i> New Shipment
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/erp/reports')}
                  className="text-[#1F4E79] font-bold text-sm flex items-center gap-2 hover:underline"
                >
                  <i className="fa-solid fa-file-export"></i> View Reports
                </button>
              </div>

              {/* Quick Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="fa-solid fa-box-open"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Latest Container</p>
                    <p className="text-sm font-bold text-slate-700">{containers[0]?.id || 'None'}</p>
                  </div>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Latest PO</p>
                    <p className="text-sm font-bold text-slate-700">PO-{sales[0]?.id?.slice(-4) || '0000'}</p>
                  </div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <i className="fa-solid fa-truck-ramp-box"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active Shipments</p>
                    <p className="text-sm font-bold text-slate-700">{containers.filter(c => c.status === 'In Transit').length} In Transit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {kpiData.map((kpi, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-default group"
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
                  <div className="w-full max-w-[300px]">
                    <Bar 
                      data={containerStatusData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true } }
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
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
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
                      <th className="px-6 py-4 text-right">Sales (AED)</th>
                      <th className="px-6 py-4 text-right">GP (AED)</th>
                      <th className="px-6 py-4 text-right">ROI</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {containers.length > 0 ? containers.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
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
                        <td className="px-6 py-4 text-right font-medium text-slate-700">{row.totalSales || '0'}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-700">{row.gp || '0'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${row.roi?.toString().startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                            {row.roi || '0'}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                          No containers found. Add your first container or seed demo data in Settings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">AI Business Insights</h3>
                <p className="text-sm text-slate-500">Actionable recommendations based on your ERP data.</p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <span className="text-xs text-slate-400 font-medium italic">Last updated: {lastUpdated}</span>
                )}
                <button 
                  onClick={fetchAIInsights}
                  disabled={isGeneratingInsights}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isGeneratingInsights ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {isGeneratingInsights ? 'Analyzing...' : 'Refresh Insights'}
                </button>
              </div>
            </div>

            {insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map((insight, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${
                        insight.type === 'opportunity' ? 'bg-green-50 text-green-600' :
                        insight.type === 'risk' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {insight.type === 'opportunity' ? <TrendingUp size={24} /> :
                         insight.type === 'risk' ? <AlertTriangle size={24} /> :
                         <Lightbulb size={24} />}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                        insight.impact === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {insight.impact} Impact
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{insight.title}</h4>
                    <p className="text-sm text-slate-600 mb-4 flex-1">{insight.description}</p>
                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recommendation</p>
                      <p className="text-sm font-bold text-blue-700">{insight.recommendation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">No Insights Generated Yet</h4>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">Click the refresh button to let Gemini AI analyze your business performance.</p>
                </div>
                <button 
                  onClick={fetchAIInsights}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                >
                  Generate First Insights
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
