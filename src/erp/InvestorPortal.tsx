import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const defaultInvestors = [
  { name: 'Abdullah Al-Saud', amount: '500,000', date: 'Oct 01, 2025', product: 'Sea Bream', roi: '12.5%', paid: '62,500', outstanding: '0', status: 'Active' },
  { name: 'Fahad Bin Khalid', amount: '250,000', date: 'Nov 15, 2025', product: 'Keski', roi: '15.0%', paid: '0', outstanding: '37,500', status: 'Active' },
  { name: 'Sami Al-Otaibi', amount: '1,000,000', date: 'Jan 10, 2026', product: 'Rohu', roi: '10.0%', paid: '0', outstanding: '100,000', status: 'Active' },
];

const investmentSteps = [
  { step: 'Contract Signed', status: 'Completed', icon: 'fa-file-signature' },
  { step: 'Funds Transferred', status: 'Completed', icon: 'fa-money-bill-transfer' },
  { step: 'Money Receipt Issued', status: 'Completed', icon: 'fa-receipt' },
  { step: 'Product Sourced & Shipped', status: 'In Progress', icon: 'fa-ship' },
  { step: 'Product Sold', status: 'Pending', icon: 'fa-sack-dollar' },
  { step: 'ROI Returned', status: 'Pending', icon: 'fa-hand-holding-dollar' },
  { step: 'Statement of Account', status: 'Pending', icon: 'fa-file-lines' },
];

export default function InvestorPortal() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('traces_investors') || '[]');
    if (stored.length === 0) {
      setInvestors(defaultInvestors);
      localStorage.setItem('traces_investors', JSON.stringify(defaultInvestors));
    } else {
      setInvestors(stored);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search investors..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
          />
        </div>
        {isAdmin && (
          <Link 
            to="/erp/investors/new"
            className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
          >
            <i className="fa-solid fa-user-plus"></i> Add New Investor
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Investor Name</th>
                <th className="px-6 py-4 text-right">Investment (SAR)</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product / Container</th>
                <th className="px-6 py-4 text-right">ROI (%)</th>
                <th className="px-6 py-4 text-right">Returns Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {investors.map((investor, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{investor.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{investor.amount}</td>
                  <td className="px-6 py-4 text-slate-500">{investor.date}</td>
                  <td className="px-6 py-4 text-slate-600">{investor.product}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{investor.roi}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{investor.paid}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                      {investor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedInvestor(investor)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      {isAdmin && (
                        <button className="p-1.5 text-slate-400 hover:text-green-600 transition-colors"><i className="fa-solid fa-file-pdf"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedInvestor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvestor(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <div>
                  <h2 className="text-xl font-bold">Investor Profile: {selectedInvestor.name}</h2>
                  <p className="text-white/60 text-sm">Investment: SAR {selectedInvestor.amount} | {selectedInvestor.date}</p>
                </div>
                <button onClick={() => setSelectedInvestor(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Investment Flow */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <i className="fa-solid fa-diagram-project text-[#1F4E79]"></i> Investment Lifecycle
                  </h3>
                  <div className="relative flex justify-between items-start">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
                    {investmentSteps.map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 w-32 text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                          ${step.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 
                            step.status === 'In Progress' ? 'bg-white border-blue-500 text-blue-500 animate-pulse' : 
                            'bg-white border-slate-200 text-slate-300'}
                        `}>
                          <i className={`fa-solid ${step.icon}`}></i>
                        </div>
                        <div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider
                            ${step.status === 'Completed' ? 'text-green-600' : 
                              step.status === 'In Progress' ? 'text-blue-600' : 'text-slate-400'}
                          `}>{step.step}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{step.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Total ROI (Expected)</div>
                    <div className="text-3xl font-bold text-[#1F4E79]">SAR {selectedInvestor.outstanding || (parseFloat((selectedInvestor.amount || '0').replace(/,/g, '')) * parseFloat(selectedInvestor.roi || '0') / 100).toLocaleString()}</div>
                    <div className="text-xs text-green-600 font-bold mt-1">{selectedInvestor.roi} Yield</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Returns Paid</div>
                    <div className="text-3xl font-bold text-green-600">SAR {selectedInvestor.paid}</div>
                    <div className="text-xs text-slate-400 mt-1">Last Payment: Dec 20, 2025</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Linked Container</div>
                    <div className="text-lg font-bold text-slate-800">{selectedInvestor.product}</div>
                    <div className="text-xs text-blue-600 font-bold hover:underline cursor-pointer mt-1">View Container Details</div>
                  </div>
                </div>

                {/* Statement of Account Table */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Statement of Account</h3>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Debit</th>
                          <th className="px-4 py-3 text-right">Credit</th>
                          <th className="px-4 py-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-3 text-slate-500">{selectedInvestor.date}</td>
                          <td className="px-4 py-3 text-slate-700 font-medium">Initial Investment - {selectedInvestor.product}</td>
                          <td className="px-4 py-3 text-right text-slate-400">-</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{selectedInvestor.amount}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{selectedInvestor.amount}</td>
                        </tr>
                        {selectedInvestor.paid !== '0' && (
                          <tr>
                            <td className="px-4 py-3 text-slate-500">Dec 20, 2025</td>
                            <td className="px-4 py-3 text-slate-700 font-medium">ROI Payment #1</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">{selectedInvestor.paid}</td>
                            <td className="px-4 py-3 text-right text-slate-400">-</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{(parseFloat((selectedInvestor.amount || '0').replace(/,/g, '')) - parseFloat((selectedInvestor.paid || '0').replace(/,/g, ''))).toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
