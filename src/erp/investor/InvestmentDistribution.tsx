import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const InvestmentDistribution: React.FC = () => {
  const [investors, setInvestors] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  
  // Form state
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [selectedContainer, setSelectedContainer] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');

  const parseCurrency = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const unsubInvestors = onSnapshot(collection(db, 'investors'), (snapshot) => {
      setInvestors(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id || doc.id })));
    });

    const unsubInvestments = onSnapshot(collection(db, 'investments'), (snapshot) => {
      setInvestments(snapshot.docs.map(doc => doc.data()));
    });

    const unsubContainers = onSnapshot(collection(db, 'containers'), (snapshot) => {
      setContainers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id || doc.id })));
    });

    const unsubDistributions = onSnapshot(query(collection(db, 'distributions'), orderBy('createdAt', 'desc')), (snapshot) => {
      setDistributions(snapshot.docs.map(doc => doc.data()));
    });
    
    return () => {
      unsubInvestors();
      unsubInvestments();
      unsubContainers();
      unsubDistributions();
    };
  }, []);

  const totalCapital = investments.reduce((sum, i) => sum + parseCurrency(i.capitalAmount), 0);
  const totalAllocated = distributions.reduce((sum, d) => sum + parseCurrency(d.allocatedAmount), 0);
  const unallocated = totalCapital - totalAllocated;

  const chartData = {
    labels: ['Allocated', 'Unallocated'],
    datasets: [
      {
        data: [totalAllocated, unallocated],
        backgroundColor: ['#1F4E79', '#f1f5f9'],
        borderWidth: 0,
      },
    ],
  };

  const handleSaveAllocation = async () => {
    const investor = investors.find(i => i.id === selectedInvestor);
    const container = containers.find(c => c.id === selectedContainer);
    
    if (!investor || !container) return;

    try {
      const newDist = {
        id: `DIST-${Math.floor(1000 + Math.random() * 9000)}`,
        investorId: selectedInvestor,
        investorName: investor.fullName,
        containerId: selectedContainer,
        product: container.product,
        allocatedAmount: parseFloat(allocationAmount),
        allocatedPercent: ((parseFloat(allocationAmount) / totalCapital) * 100).toFixed(1),
        status: 'allocated',
        createdDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'distributions'), newDist);
      setShowAllocationModal(false);
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Failed to save allocation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Investment Distribution</h1>
          <p className="text-slate-500 text-sm">Allocate investor capital to specific containers and products.</p>
        </div>
        <button 
          onClick={() => setShowAllocationModal(true)}
          className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#163a5a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Allocation
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Capital</p>
            <h3 className="text-2xl font-bold text-slate-800">AED {totalCapital.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-2">Under management</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Allocated Funds</p>
            <h3 className="text-2xl font-bold text-[#1F4E79]">AED {totalAllocated.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">{((totalAllocated / totalCapital) * 100).toFixed(1)}% Allocated</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Unallocated Funds</p>
            <h3 className="text-2xl font-bold text-amber-600">AED {unallocated.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-500 font-bold mt-2">{((unallocated / totalCapital) * 100).toFixed(1)}% Remaining</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <div className="w-32 h-32">
            <Pie data={chartData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Allocation Mix</p>
        </div>
      </div>

      {/* Allocation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">Active Allocations</h4>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search allocations..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Investor</th>
              <th className="px-6 py-4">Container No.</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4 text-right">Allocated Amount</th>
              <th className="px-6 py-4 text-center">Share %</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {distributions.map((row, i) => (
              <tr key={`${row.id}-${i}`} className="hover:bg-blue-50/40 transition-all duration-200 group">
                <td className="px-6 py-4 font-bold text-slate-700">{row.investorName}</td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{row.containerId}</td>
                <td className="px-6 py-4 text-slate-700">{row.product}</td>
                <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">AED {row.allocatedAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-600">{row.allocatedPercent}%</span>
                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${row.allocatedPercent}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                      <Package className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Deallocate">
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {distributions.length === 0 && (
              <tr key="empty-distributions">
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                  No active allocations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Allocation Modal */}
      <AnimatePresence>
        {showAllocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800">New Fund Allocation</h3>
                <button onClick={() => setShowAllocationModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Investor</label>
                  <select 
                    value={selectedInvestor}
                    onChange={(e) => setSelectedInvestor(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="">Choose Investor</option>
                    {investors.map((i, index) => (
                      <option key={`${i.id}-${index}`} value={i.id}>{i.fullName} ({i.id})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Container</label>
                  <select 
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="">Choose Container</option>
                    {containers.map((c, index) => (
                      <option key={`${c.id}-${index}`} value={c.id}>{c.id} - {c.product}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocation Amount</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none pl-12"
                      placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">AED</span>
                  </div>
                </div>
                <button 
                  onClick={handleSaveAllocation}
                  className="w-full py-4 bg-[#1F4E79] text-white rounded-2xl font-bold text-sm hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20"
                >
                  Create Allocation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
  <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default InvestmentDistribution;
