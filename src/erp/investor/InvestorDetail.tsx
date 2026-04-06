import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Package, 
  Users, 
  Activity, 
  Plus, 
  MoreVertical,
  ChevronRight,
  Info,
  Eye
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, getDocs } from 'firebase/firestore';
import { downloadAgreement } from './utils/agreement-generator';
import { getInvestorAging, generateReminderMessage } from './utils/investor-tracker';

const InvestorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [investor, setInvestor] = useState<any>(null);
  const [investment, setInvestment] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Transfer');

  useEffect(() => {
    if (!id) return;

    const unsubInvestors = onSnapshot(query(collection(db, 'investors'), where('id', '==', id)), (snapshot) => {
      if (!snapshot.empty) {
        setInvestor(snapshot.docs[0].data());
      }
    });

    const unsubInvestments = onSnapshot(query(collection(db, 'investments'), where('investorId', '==', id)), (snapshot) => {
      if (!snapshot.empty) {
        setInvestment(snapshot.docs[0].data());
      }
    });

    const unsubAgreements = onSnapshot(query(collection(db, 'agreements'), where('investorId', '==', id)), (snapshot) => {
      if (!snapshot.empty) {
        setAgreement(snapshot.docs[0].data());
      }
    });

    const unsubSchedules = onSnapshot(query(collection(db, 'payment_schedules'), where('investorId', '==', id)), (snapshot) => {
      setSchedules(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubDistributions = onSnapshot(query(collection(db, 'distributions'), where('investorId', '==', id)), (snapshot) => {
      setDistributions(snapshot.docs.map(doc => doc.data()));
    });
    
    return () => {
      unsubInvestors();
      unsubInvestments();
      unsubAgreements();
      unsubSchedules();
      unsubDistributions();
    };
  }, [id]);

  if (!investor) return <div className="p-10 text-center text-slate-400">Investor not found.</div>;

  const totalPaid = schedules.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const balance = investment ? investment.totalProfit - totalPaid : 0;
  const progress = investment ? (totalPaid / investment.totalProfit) * 100 : 0;
  const aging = getInvestorAging(investor.id, schedules);

  const handleMarkAsPaid = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    try {
      if (!selectedPayment.firestoreId) {
        // Find the document if firestoreId is missing
        const q = query(collection(db, 'payment_schedules'), where('id', '==', selectedPayment.id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await updateDoc(doc(db, 'payment_schedules', snapshot.docs[0].id), {
            status: 'paid',
            paidAmount: parseFloat(paymentAmount),
            paidDate: new Date().toISOString().split('T')[0],
            paymentMode: paymentMode,
            recordedDate: new Date().toISOString()
          });
        }
      } else {
        await updateDoc(doc(db, 'payment_schedules', selectedPayment.firestoreId), {
          status: 'paid',
          paidAmount: parseFloat(paymentAmount),
          paidDate: new Date().toISOString().split('T')[0],
          paymentMode: paymentMode,
          recordedDate: new Date().toISOString()
        });
      }
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/erp/investors" className="p-2 hover:bg-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{investor.fullName}</h1>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{investor.id}</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                ${investor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}
              `}>
                {investor.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm">{investor.email} | {investor.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agreement && (
            <button 
              onClick={() => downloadAgreement(agreement)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Agreement
            </button>
          )}
          <button className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#163a5a] transition-colors">
            <FileText className="w-4 h-4" />
            Statement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'investment', label: 'Investment', icon: TrendingUp },
          { id: 'payments', label: 'Payments', icon: DollarSign },
          { id: 'distribution', label: 'Distribution', icon: Users },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#1F4E79] text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'overview' && (
          <>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-3xl border-4 border-white shadow-lg">
                    {investor.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{investor.fullName}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">{investor.nationality}</p>
                  </div>
                </div>
                <div className="mt-8 space-y-4 border-t pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">NID Number</span>
                    <span className="font-bold text-slate-700">{investor.nidNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Member Since</span>
                    <span className="font-bold text-slate-700">{new Date(investor.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 uppercase font-bold">Address</span>
                    <span className="text-sm text-slate-700">{investor.address}</span>
                  </div>
                </div>
              </div>

              {aging.totalOverdue > 0 && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Payment Overdue</h4>
                  </div>
                  <p className="text-xs text-red-700">This investor has {aging.overdueCount} overdue payments totaling <span className="font-bold">{investment?.currency} {aging.totalOverdue.toLocaleString()}</span>.</p>
                  <button 
                    onClick={() => {
                      const msg = generateReminderMessage(investor.fullName, aging.totalOverdue, investment?.currency, aging.nextPayment?.dueDate || '');
                      alert(msg);
                    }}
                    className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    Generate Reminder
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Capital Invested</p>
                  <h3 className="text-xl font-bold text-slate-800">{investment?.currency} {parseFloat(investment?.capitalAmount || 0).toLocaleString()}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Returns Paid</p>
                  <h3 className="text-xl font-bold text-emerald-600">{investment?.currency} {totalPaid.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">ROI Percentage</p>
                  <h3 className="text-xl font-bold text-blue-600">{investment?.roiPercent}%</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800">Investment Progress</h4>
                  <span className="text-xs font-bold text-slate-500">{progress.toFixed(1)}% Complete</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Trade Cycle</p>
                    <p className="text-sm font-bold text-slate-700">{investment?.tradeCycle} Days</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
                    <p className="text-sm font-bold text-slate-700">{investment?.durationMonths} Months</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Start Date</p>
                    <p className="text-sm font-bold text-slate-700">{investment?.startDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">End Date</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(new Date(investment?.startDate).setMonth(new Date(investment?.startDate).getMonth() + parseInt(investment?.durationMonths))).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Next Payment</h4>
                {aging.nextPayment ? (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{new Date(aging.nextPayment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Cycle {aging.nextPayment.cycleNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#1F4E79]">{investment?.currency} {aging.nextPayment.amount.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Upcoming</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No upcoming payments scheduled.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'payments' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm">Full Payment Schedule</h4>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Paid
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Overdue
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Cycle</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Paid Date</th>
                      <th className="px-6 py-4">Payment Mode</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {schedules.map((row, i) => (
                      <tr key={`${row.id}-${i}`} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-700">{row.cycleNumber}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(row.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{investment?.currency} {row.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${row.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                              row.status === 'overdue' ? 'bg-red-100 text-red-700' : 
                              'bg-amber-100 text-amber-700'}
                          `}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{row.paidDate ? new Date(row.paidDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-slate-500">{row.paymentMode || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {row.status !== 'paid' ? (
                            <button 
                              onClick={() => handleMarkAsPaid(row)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <button className="text-xs font-bold text-slate-400 hover:text-slate-600">
                              View Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investment' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-6">Investment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Capital Amount</p>
                  <p className="text-xl font-bold text-slate-800">{investment?.currency} {parseFloat(investment?.capitalAmount || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Expected Profit</p>
                  <p className="text-xl font-bold text-emerald-600">{investment?.currency} {parseFloat(investment?.totalProfit || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">ROI Percentage</p>
                  <p className="text-xl font-bold text-blue-600">{investment?.roiPercent}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Trade Cycle</p>
                  <p className="text-lg font-bold text-slate-700">{investment?.tradeCycle} Days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Duration</p>
                  <p className="text-lg font-bold text-slate-700">{investment?.durationMonths} Months</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Payment Frequency</p>
                  <p className="text-lg font-bold text-slate-700">{investment?.paymentFrequency}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm">Fund Allocations</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Container No.</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4 text-right">Allocated Amount</th>
                      <th className="px-6 py-4 text-center">Share %</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {distributions.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.containerId}</td>
                        <td className="px-6 py-4 text-slate-700 font-bold">{row.product}</td>
                        <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{investment?.currency} {row.allocatedAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-slate-600">{row.allocatedPercent}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {distributions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No allocations found for this investor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agreement && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Investment Agreement</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF Document</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadAgreement(agreement)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 italic">Add New Document</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="lg:col-span-3">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-6">Recent Activity</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Investor profile created and verified.</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(investor.createdDate).toLocaleString()}</p>
                  </div>
                </div>
                {investment && (
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700 font-medium">Investment of {investment.currency} {parseFloat(investment.capitalAmount).toLocaleString()} confirmed.</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(investment.startDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {schedules.filter(s => s.status === 'paid').map((p, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700 font-medium">Payment of {investment?.currency} {p.amount.toLocaleString()} recorded via {p.paymentMode}.</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(p.paidDate).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{investment?.currency}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <button 
                  onClick={confirmPayment}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                >
                  Confirm & Record Payment
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

export default InvestorDetail;
