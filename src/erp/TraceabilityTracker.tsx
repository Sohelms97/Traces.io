import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Search, Link as LinkIcon, QrCode, ArrowUpRight, CheckCircle2, MapPin, Box, Anchor, Truck, Warehouse, FileText, Users, Loader2, AlertCircle } from 'lucide-react';

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

      // Try shipments
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
          // Try products
          const prodRef = doc(db, 'products', id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const data = prodSnap.data();
            setResultData({
              ...data,
              type: 'Product',
              status: 'Active'
            });
            setShowResult(true);
          } else {
            setError('No record found for this ID. Please check the ID or scan a valid QR code.');
          }
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('An error occurred during search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTraceSteps = (data: any) => {
    const steps = [
      { step: 'Origin & Sourcing', location: data.origin || data.originCountry || 'Origin Port', date: data.etd || 'TBD', status: 'Verified', icon: <MapPin size={20} />, details: `Sourced from ${data.supplier || data.supplierName || 'Supplier'}. Batch tracking active.` },
      { step: 'Processing & Packing', location: 'Supplier Facility', date: data.etd || 'TBD', status: 'Verified', icon: <Box size={20} />, details: 'Packed and prepared for shipment.' },
      { step: 'Port of Loading', location: data.origin || 'Origin Port', date: data.etd || 'TBD', status: 'Verified', icon: <Anchor size={20} />, details: `Loaded into container ${data.id || data.containerNo}. Vessel: ${data.vessel || 'TBD'}.` },
      { step: 'In Transit', location: 'At Sea', date: data.etd || 'TBD', status: data.status === 'In Transit' ? 'Current' : 'Completed', icon: <Truck size={20} />, details: `Vessel: ${data.vessel || 'TBD'}. BL: ${data.bl || 'TBD'}.` },
    ];

    if (data.status === 'Arrived' || data.status === 'Cleared' || data.status === 'Open' || data.status === 'Closed') {
      steps.push({ step: 'Port of Discharge', location: data.dest || 'Destination Port', date: data.eta || 'TBD', status: 'Completed', icon: <Warehouse size={20} />, details: 'Unloaded and cleared customs.' });
      steps.push({ step: 'Warehouse Delivery', location: 'FMA Central Warehouse', date: data.eta || 'TBD', status: 'Completed', icon: <CheckCircle2 size={20} />, details: 'Stored in cold storage facility.' });
    }

    return steps;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Search Section */}
      <div className="card-modern p-10 text-center space-y-8">
        <div className="w-20 h-20 bg-accent-primary/10 text-accent-primary rounded-3xl flex items-center justify-center mx-auto shadow-soft-lg">
          <LinkIcon size={32} />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-text-primary dark:text-dark-text-primary tracking-tighter">Internal Traceability Tracker</h2>
          <p className="text-text-secondary dark:text-dark-text-secondary max-w-md mx-auto font-medium">Search by Container No., Product ID, or BL Number to view the full internal lifecycle and documents.</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-4 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={24} />
            <input 
              type="text" 
              placeholder="Enter ID (e.g. TFC/EX026/25 or PRD-123)" 
              className="w-full pl-14 pr-6 py-5 bg-bg-tertiary dark:bg-dark-bg-tertiary border border-border-main dark:border-dark-border-main rounded-3xl focus:ring-4 focus:ring-accent-primary/10 outline-none text-lg font-bold text-text-primary dark:text-dark-text-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-accent-primary text-white px-10 py-5 rounded-3xl font-black hover:bg-accent-primary/90 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Track Now'}
          </button>
        </form>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 p-4 rounded-2xl border border-red-100 max-w-md mx-auto"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {showResult && resultData && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Card */}
            <div className="bg-dark-bg-primary text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-wrap items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                  Tracking {resultData.type}
                </div>
                <div className="text-4xl font-black tracking-tighter">{resultData.id || resultData.containerNo}</div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest ${resultData.status === 'Closed' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {resultData.status}
                  </span>
                  <span className="text-white/60 text-sm font-bold">Product: {resultData.product || resultData.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white p-3 rounded-2xl shadow-soft-lg">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/trace?id=${resultData.id}`} alt="QR Code" className="w-24 h-24" referrerPolicy="no-referrer" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Public Passport</div>
                  <a 
                    href={`/trace?id=${resultData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-all border border-white/10"
                  >
                    View Public Page <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card-modern p-10">
              <h3 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-12 flex items-center gap-3">
                <CheckCircle2 className="text-accent-primary" size={28} /> Full Traceability Journey
              </h3>
              <div className="relative pl-12 border-l-2 border-border-main dark:border-dark-border-main space-y-12">
                {getTraceSteps(resultData).map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[61px] top-0 w-12 h-12 rounded-2xl bg-bg-primary dark:bg-dark-bg-primary border-2 border-accent-primary flex items-center justify-center text-accent-primary shadow-soft-lg group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-black text-xl text-text-primary dark:text-dark-text-primary tracking-tight">{step.step}</div>
                        <div className="text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">{step.date}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-accent-primary uppercase tracking-widest">
                        <CheckCircle2 size={14} /> {step.status} • {step.location}
                      </div>
                      <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed bg-bg-tertiary dark:bg-dark-bg-tertiary p-5 rounded-3xl border border-border-main dark:border-dark-border-main group-hover:bg-accent-primary/5 group-hover:border-accent-primary/20 transition-all font-medium">
                        {step.details}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {documents.filter(d => d.docType.toLowerCase().includes(step.step.toLowerCase().split(' ')[0])).map((d, di) => (
                          <a 
                            key={di}
                            href={d.fileUrl || `data:application/pdf;base64,${d.base64Data}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-primary dark:bg-dark-bg-primary border border-border-main dark:border-dark-border-main rounded-xl text-[10px] font-black text-accent-primary hover:bg-accent-primary hover:text-white transition-all uppercase tracking-widest"
                          >
                            <FileText size={14} /> View {d.docType}
                          </a>
                        ))}
                        {documents.filter(d => d.docType.toLowerCase().includes(step.step.toLowerCase().split(' ')[0])).length === 0 && (
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">No documents linked to this step</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Linked Documents */}
            <div className="card-modern p-10">
              <h3 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-8 flex items-center gap-3">
                <FileText className="text-blue-600" size={28} /> All Linked Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {documents.map((d, i) => (
                  <div key={i} className="p-5 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-3xl border border-border-main dark:border-dark-border-main flex items-center justify-between group hover:bg-accent-primary/5 hover:border-accent-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-bg-primary dark:bg-dark-bg-primary rounded-2xl flex items-center justify-center text-accent-primary shadow-soft-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-text-primary dark:text-dark-text-primary truncate max-w-[120px] tracking-tight">{d.fileName}</div>
                        <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">{d.docType}</div>
                      </div>
                    </div>
                    <a 
                      href={d.fileUrl || `data:application/pdf;base64,${d.base64Data}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-text-muted hover:text-accent-primary transition-colors"
                    >
                      <ArrowUpRight size={20} />
                    </a>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="col-span-full py-16 text-center">
                    <div className="w-16 h-16 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-2xl flex items-center justify-center text-text-muted mx-auto mb-4">
                      <FileText size={32} />
                    </div>
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No documents found for this record.</p>
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
