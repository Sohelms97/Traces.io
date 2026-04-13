import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI } from "@google/genai";

const reportTabs = [
  { id: 'container', name: 'Container-wise P&L', icon: 'fa-box' },
  { id: 'monthly', name: 'Monthly Summary', icon: 'fa-calendar-days' },
  { id: 'aging', name: 'Aging Summary', icon: 'fa-clock' },
  { id: 'performance', name: 'Performance Analysis', icon: 'fa-chart-line' },
  { id: 'cashflow', name: 'Cash Flow', icon: 'fa-money-bill-transfer' },
  { id: 'supplier', name: 'Supplier-wise', icon: 'fa-truck-field' },
  { id: 'customer', name: 'Customer-wise', icon: 'fa-users' },
];

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState('container');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const [containers, setContainers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const qContainers = query(collection(db, 'containers'), orderBy('createdAt', 'desc'));
    const qSales = query(collection(db, 'sales_orders'), orderBy('createdAt', 'desc'));

    const unsubContainers = onSnapshot(qContainers, (snapshot) => {
      setContainers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });

    return () => {
      unsubContainers();
      unsubSales();
    };
  }, []);

  const generateAIInsights = async () => {
    const apiKey = process.env.GEMINI_API_KEY || localStorage.getItem('traces_api_key');
    if (!apiKey) {
      alert('Please add your Gemini API Key in Settings -> Integrations first.');
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Prepare data summary for AI
      const totalSales = sales.reduce((acc, s) => acc + parseCurrency(s.total), 0);
      const totalCost = containers.reduce((acc, c) => acc + parseCurrency(c.totalCost), 0);
      const avgROI = containers.length > 0 
        ? containers.reduce((acc, c) => acc + parseCurrency(c.roi), 0) / containers.length 
        : 0;
      
      const prompt = `Analyze this ERP financial data for Farmers Market Asia and provide 3-5 strategic insights and actionable recommendations.
      
      Financial Summary:
      - Total Sales Revenue: AED ${totalSales.toLocaleString()}
      - Total Purchase/Operating Cost: AED ${totalCost.toLocaleString()}
      - Average Container ROI: ${avgROI.toFixed(2)}%
      - Total Containers: ${containers.length}
      - Total Sales Orders: ${sales.length}
      
      Recent Performance:
      ${containers.slice(0, 5).map(c => `- Container ${c.id}: ROI ${c.roi}, Status ${c.status}`).join('\n')}
      
      Please provide the insights in a clear, professional bulleted list with a focus on profitability, risk management, and operational efficiency.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiInsights(response.text || "No insights generated.");
    } catch (error) {
      console.error("AI Insights error:", error);
      alert('Failed to generate AI insights. Please check your API key.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Helper to group data by month
  const getMonthlySummary = () => {
    const summary: any = {};
    
    containers.forEach(c => {
      const month = c.month || 'Unknown';
      if (!summary[month]) summary[month] = { month, containers: 0, sales: 0, cost: 0 };
      summary[month].containers += 1;
      summary[month].cost += parseCurrency(c.totalCost);
      summary[month].sales += parseCurrency(c.totalSales);
    });

    return Object.values(summary).sort((a: any, b: any) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [mA, yA] = a.month.split(' ');
      const [mB, yB] = b.month.split(' ');
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return months.indexOf(mB) - months.indexOf(mA);
    });
  };

  // Helper for supplier-wise report
  const getSupplierSummary = () => {
    const summary: any = {};
    containers.forEach(c => {
      const s = c.supplier || 'Unknown';
      if (!summary[s]) summary[s] = { name: s, count: 0, value: 0, products: new Set() };
      summary[s].count += 1;
      summary[s].value += parseCurrency(c.purchaseValue);
      summary[s].products.add(c.product);
    });
    return Object.values(summary).map((s: any) => ({
      ...s,
      products: Array.from(s.products).join(', ')
    }));
  };

  // Helper for customer-wise report
  const getCustomerSummary = () => {
    const summary: any = {};
    sales.forEach(s => {
      const c = s.customer || 'Unknown';
      if (!summary[c]) summary[c] = { name: c, sales: 0, paid: 0, balance: 0 };
      const total = parseCurrency(s.total);
      summary[c].sales += total;
      if (s.status === 'Paid') summary[c].paid += total;
      else summary[c].balance += total;
    });
    return Object.values(summary);
  };

  return (
    <div className="space-y-6">
      {/* Header & AI Insights Button */}
      <div className="flex items-center justify-between">
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
        <button 
          onClick={generateAIInsights}
          disabled={isGeneratingInsights}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
        >
          <i className={`fa-solid ${isGeneratingInsights ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
          {isGeneratingInsights ? 'Analyzing Data...' : 'AI Insights'}
        </button>
      </div>

      {/* AI Insights Display */}
      <AnimatePresence>
        {aiInsights && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-6 rounded-[2rem] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setAiInsights(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 text-xl shadow-sm shrink-0">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">AI Strategic Insights</h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {aiInsights}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="px-6 py-4 text-right">Purchase Cost (AED)</th>
                  <th className="px-6 py-4 text-right">Sales (AED)</th>
                  <th className="px-6 py-4 text-right">GP (AED)</th>
                  <th className="px-6 py-4 text-right">ROI</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {containers.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.id}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.totalCost}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">{row.totalSales}</td>
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
                  <th className="px-6 py-4 text-right">Total Sales (AED)</th>
                  <th className="px-6 py-4 text-right">Total Cost (AED)</th>
                  <th className="px-6 py-4 text-right">Gross Profit (AED)</th>
                  <th className="px-6 py-4 text-right">GP %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {getMonthlySummary().map((row: any, i) => {
                  const gp = row.sales - row.cost;
                  const gpPerc = row.sales > 0 ? ((gp / row.sales) * 100).toFixed(1) + '%' : '0%';
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{row.month}</td>
                      <td className="px-6 py-4 text-center text-slate-600 font-bold">{row.containers}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">{row.sales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">{row.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{gp.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">{gpPerc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'aging' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4 text-right">Amount (AED)</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sales.filter(s => s.status !== 'Paid').map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{row.id}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.total}</td>
                    <td className="px-6 py-4 text-slate-500">{row.due || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {sales.filter(s => s.status !== 'Paid').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No outstanding receivables</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-chart-line text-4xl mb-4"></i>
            <p className="font-bold">Performance Analysis Coming Soon</p>
          </div>
        )}

        {activeTab === 'cashflow' && (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-money-bill-transfer text-4xl mb-4"></i>
            <p className="font-bold">Cash Flow Statement Coming Soon</p>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-center">No. of Containers</th>
                  <th className="px-6 py-4 text-right">Total Purchase Value (AED)</th>
                  <th className="px-6 py-4">Main Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {getSupplierSummary().map((row: any, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-bold">{row.count}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.value.toLocaleString()}</td>
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
                  <th className="px-6 py-4 text-right">Total Sales (AED)</th>
                  <th className="px-6 py-4 text-right">Total Paid (AED)</th>
                  <th className="px-6 py-4 text-right">Outstanding (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {getCustomerSummary().map((row: any, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{row.sales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.paid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.balance.toLocaleString()}</td>
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
