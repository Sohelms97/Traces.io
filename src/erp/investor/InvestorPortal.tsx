import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  where, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { downloadAgreement } from './utils/agreement-generator';

const InvestorPortal: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [investors, setInvestors] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const unsubInvestors = onSnapshot(query(collection(db, 'investors'), orderBy('createdAt', 'desc')), (snapshot) => {
      setInvestors(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id || doc.id })));
    });

    const unsubInvestments = onSnapshot(collection(db, 'investments'), (snapshot) => {
      setInvestments(snapshot.docs.map(doc => doc.data()));
    });

    const unsubAgreements = onSnapshot(collection(db, 'agreements'), (snapshot) => {
      setAgreements(snapshot.docs.map(doc => doc.data()));
    });

    const unsubSchedules = onSnapshot(collection(db, 'payment_schedules'), (snapshot) => {
      setSchedules(snapshot.docs.map(doc => doc.data()));
    });
    
    return () => {
      unsubInvestors();
      unsubInvestments();
      unsubAgreements();
      unsubSchedules();
    };
  }, []);

  const getKPIs = () => {
    const totalCapital = investments.reduce((sum, i) => sum + (parseFloat(i.capitalAmount) || 0), 0);
    const totalReturnsPaid = schedules.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const pendingReturns = schedules.filter(s => s.status === 'overdue').reduce((sum, s) => sum + (s.amount || 0), 0);
    const activeInvestments = investments.filter(i => i.status === 'active').length;
    const closedInvestments = investments.filter(i => i.status === 'completed').length;
    const avgROI = investments.length > 0 ? (investments.reduce((sum, i) => sum + (parseFloat(i.roiPercent) || 0), 0) / investments.length).toFixed(1) : '0';
    const totalProfit = investments.reduce((sum, i) => sum + (parseFloat(i.totalProfit) || 0), 0);

    return [
      { label: 'Total Investors', value: investors.length, icon: Users, color: 'blue' },
      { label: 'Total Capital', value: `SAR ${totalCapital.toLocaleString()}`, icon: DollarSign, color: 'green' },
      { label: 'Returns Paid', value: `SAR ${totalReturnsPaid.toLocaleString()}`, icon: CheckCircle, color: 'emerald' },
      { label: 'Pending Returns', value: `SAR ${pendingReturns.toLocaleString()}`, icon: AlertCircle, color: 'red' },
      { label: 'Active Investments', value: activeInvestments, icon: TrendingUp, color: 'indigo' },
      { label: 'Closed Investments', value: closedInvestments, icon: Clock, color: 'slate' },
      { label: 'Average ROI', value: `${avgROI}%`, icon: FileText, color: 'amber' },
      { label: 'Total Profit', value: `SAR ${totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'cyan' },
    ];
  };

  const filteredInvestors = investors.filter(i => {
    const fullName = i.fullName || '';
    const id = i.id || '';
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || id.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && i.status === 'active';
    if (activeTab === 'pending') return matchesSearch && i.status === 'pending';
    if (activeTab === 'closed') return matchesSearch && i.status === 'closed';
    return matchesSearch;
  });

  const handleDeleteInvestor = async (investorId: string) => {
    if (window.confirm('Are you sure you want to delete this investor? All related data (investments, agreements, schedules) will be permanently removed.')) {
      try {
        const batch = writeBatch(db);

        // 1. Find and delete investor document
        const investorQuery = query(collection(db, 'investors'), where('id', '==', investorId));
        const investorSnap = await getDocs(investorQuery);
        investorSnap.forEach((d) => batch.delete(d.ref));

        // 2. Find and delete related investments
        const investmentQuery = query(collection(db, 'investments'), where('investorId', '==', investorId));
        const investmentSnap = await getDocs(investmentQuery);
        investmentSnap.forEach((d) => batch.delete(d.ref));

        // 3. Find and delete related distributions
        const distributionQuery = query(collection(db, 'distributions'), where('investorId', '==', investorId));
        const distributionSnap = await getDocs(distributionQuery);
        distributionSnap.forEach((d) => batch.delete(d.ref));

        // 4. Find and delete related agreements
        const agreementQuery = query(collection(db, 'agreements'), where('investorId', '==', investorId));
        const agreementSnap = await getDocs(agreementQuery);
        agreementSnap.forEach((d) => batch.delete(d.ref));

        // 5. Find and delete related payment schedules
        const scheduleQuery = query(collection(db, 'payment_schedules'), where('investorId', '==', investorId));
        const scheduleSnap = await getDocs(scheduleQuery);
        scheduleSnap.forEach((d) => batch.delete(d.ref));

        await batch.commit();
        alert('Investor and all related data deleted successfully.');
      } catch (error) {
        console.error('Error deleting investor:', error);
        alert('Failed to delete investor. Check console for details.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Investor Portal</h1>
          <p className="text-slate-500 text-sm">Manage agreements, investments, and distributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            Export All
          </button>
          <Link 
            to="/erp/investors/new"
            className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#163a5a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Investor
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {getKPIs().map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Investors' },
              { id: 'active', label: 'Active' },
              { id: 'pending', label: 'Pending' },
              { id: 'closed', label: 'Closed' },
              { id: 'agreements', label: 'Agreements' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-[#1F4E79] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full md:w-64"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeTab !== 'agreements' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Investor ID</th>
                  <th className="px-6 py-4">Investor Name</th>
                  <th className="px-6 py-4">Capital Invested</th>
                  <th className="px-6 py-4">ROI %</th>
                  <th className="px-6 py-4">Returns Paid</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Agreement</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInvestors.map((investor, i) => {
                  const investment = investments.find(inv => inv.investorId === investor.id);
                  const agreement = agreements.find(a => a.investorId === investor.id);
                  const returnsPaid = schedules
                    .filter(s => s.investorId === investor.id && s.status === 'paid')
                    .reduce((sum, s) => sum + (s.paidAmount || 0), 0);

                  return (
                    <tr key={`${investor.id}-${i}`} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{investor.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {(investor.fullName || 'I').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{investor.fullName || 'Unknown Investor'}</p>
                            <p className="text-[10px] text-slate-400">{investor.nationality || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {investment ? `${investment.currency} ${parseFloat(investment.capitalAmount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-blue-600 font-bold">
                        {investment ? `${investment.roiPercent}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">
                        SAR {returnsPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${investor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            investor.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-700'}
                        `}>
                          {investor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {agreement ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                            <CheckCircle className="w-3 h-3" />
                            SIGNED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                          <Link 
                            to={`/erp/investors/${investor.id}`}
                            className="p-1.5 text-slate-400 hover:text-[#1F4E79] hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {agreement && (
                            <button 
                              onClick={() => downloadAgreement(agreement)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Download Agreement"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteInvestor(investor.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvestors.length === 0 && (
                  <tr key="empty-investors">
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
                      No investors found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Agreement ID</th>
                  <th className="px-6 py-4">Investor Name</th>
                  <th className="px-6 py-4">Generated Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {agreements.map((agreement, i) => (
                  <tr key={`${agreement.id}-${i}`} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{agreement.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{agreement.investorName}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(agreement.generatedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        {agreement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => downloadAgreement(agreement)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agreements.length === 0 && (
                  <tr key="empty-agreements">
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                      No agreements generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorPortal;
