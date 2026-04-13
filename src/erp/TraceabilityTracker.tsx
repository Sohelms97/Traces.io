import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function TraceabilityTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    setError(null);
    setShowResult(false);

    try {
      const id = searchTerm.trim().replace(/\//g, '-');
      
      // Fetch documents linked to this ID
      const docsQuery = query(
        collection(db, 'documents'),
        where('linkedRecordId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const docsSnap = await getDocs(docsQuery);
      setDocuments(docsSnap.docs.map(d => ({ ...d.data(), id: d.id })));

      // Try to find in shipments first
      const shipRef = doc(db, 'shipments', id);
      const shipSnap = await getDoc(shipRef);

      if (shipSnap.exists()) {
        const data = shipSnap.data();
        setResultData({
          ...data,
          type: 'Shipment',
          status: data.status
        });
        setShowResult(true);
      } else {
        // Try containers
        const contRef = doc(db, 'containers', id);
        const contSnap = await getDoc(contRef);
        if (contSnap.exists()) {
          const data = contSnap.data();
          setResultData({
            ...data,
            type: 'Container',
            status: data.status
          });
          setShowResult(true);
        } else {
          setError('No record found for this ID.');
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  const getTraceSteps = (data: any) => {
    const steps = [
      { step: 'Origin & Sourcing', location: data.origin || 'Origin Port', date: data.etd || 'TBD', status: 'Verified', icon: 'fa-location-dot', details: `Sourced from ${data.supplier || 'Supplier'}. Batch tracking active.` },
      { step: 'Processing & Packing', location: 'Supplier Facility', date: data.etd || 'TBD', status: 'Verified', icon: 'fa-box-open', details: 'Packed and prepared for shipment.' },
      { step: 'Port of Loading', location: data.origin || 'Origin Port', date: data.etd || 'TBD', status: 'Verified', icon: 'fa-ship', details: `Loaded into container ${data.id || data.containerNo}. Vessel: ${data.vessel || 'TBD'}.` },
      { step: 'In Transit', location: 'At Sea', date: data.etd || 'TBD', status: data.status === 'In Transit' ? 'Current' : 'Completed', icon: 'fa-anchor', details: `Vessel: ${data.vessel || 'TBD'}. BL: ${data.bl || 'TBD'}.` },
    ];

    if (data.status === 'Arrived' || data.status === 'Cleared' || data.status === 'Open' || data.status === 'Closed') {
      steps.push({ step: 'Port of Discharge', location: data.dest || 'Destination Port', date: data.eta || 'TBD', status: 'Completed', icon: 'fa-truck-ramp-box', details: 'Unloaded and cleared customs.' });
      steps.push({ step: 'Warehouse Delivery', location: 'FMA Central Warehouse', date: data.eta || 'TBD', status: 'Completed', icon: 'fa-warehouse', details: 'Stored in cold storage facility.' });
    }

    return steps;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto">
          <i className="fa-solid fa-link"></i>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Internal Traceability Tracker</h2>
          <p className="text-slate-500 max-w-md mx-auto">Search by Container No., Product, or BL Number to view the full internal lifecycle and documents.</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Enter Container No. (e.g. TFC/EX026/25)" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#1F4E79] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Now'}
          </button>
        </form>
        {error && <p className="text-red-500 font-bold">{error}</p>}
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {showResult && resultData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <div className="bg-[#1F4E79] text-white p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest">Tracking {resultData.type}</div>
                <div className="text-3xl font-bold">{resultData.id || resultData.containerNo}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded uppercase ${resultData.status === 'Closed' ? 'bg-red-500' : 'bg-green-500'}`}>
                    Status: {resultData.status}
                  </span>
                  <span className="text-white/60 text-xs">Product: {resultData.product}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://traces.io/trace/${resultData.id}`} alt="QR Code" className="w-20 h-20" referrerPolicy="no-referrer" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Public Link</div>
                  <button className="text-sm font-bold text-white hover:underline flex items-center gap-2">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Open Public Page
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-10 flex items-center gap-3">
                <i className="fa-solid fa-list-check text-green-600"></i> Full Traceability Steps
              </h3>
              <div className="relative pl-12 border-l-2 border-slate-100 space-y-12">
                {getTraceSteps(resultData).map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[61px] top-0 w-12 h-12 rounded-2xl bg-white border-2 border-green-500 flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                      <i className={`fa-solid ${step.icon} text-xl`}></i>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg text-slate-800">{step.step}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{step.date}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                        <i className="fa-solid fa-circle-check"></i> {step.status} • {step.location}
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                        {step.details}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        {documents.filter(d => d.docType.toLowerCase().includes(step.step.toLowerCase().split(' ')[0])).map((d, di) => (
                          <a 
                            key={di}
                            href={d.fileUrl || `data:application/pdf;base64,${d.base64Data}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#1F4E79] hover:underline flex items-center gap-1"
                          >
                            <i className="fa-solid fa-file-pdf"></i> View {d.docType}
                          </a>
                        ))}
                        {documents.filter(d => d.docType.toLowerCase().includes(step.step.toLowerCase().split(' ')[0])).length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">No documents uploaded for this step</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Linked Documents */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <i className="fa-solid fa-paperclip text-blue-600"></i> All Linked Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {documents.map((d, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                        <i className={`fa-solid ${d.fileName.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{d.fileName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{d.docType}</div>
                      </div>
                    </div>
                    <a 
                      href={d.fileUrl || `data:application/pdf;base64,${d.base64Data}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <i className="fa-solid fa-download"></i>
                    </a>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="col-span-full py-10 text-center text-slate-400 italic">
                    No documents found for this record.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
