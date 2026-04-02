import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const traceSteps = [
  { step: 'Origin & Sourcing', location: 'Tabuk, Saudi Arabia', date: 'Oct 15, 2025', status: 'Verified', icon: 'fa-location-dot', details: 'Sourced from Tabuk Fisheries. Batch #TF-2025-026. Certified sustainable farming.' },
  { step: 'Processing & Packing', location: 'Processing Plant A', date: 'Oct 20, 2025', status: 'Verified', icon: 'fa-box-open', details: 'Cleaned, gutted, and blast frozen at -40°C. Packed in 10kg master cartons.' },
  { step: 'Quality Inspection', location: 'Tabuk Lab', date: 'Oct 22, 2025', status: 'Verified', icon: 'fa-microscope', details: 'Passed all microbiological and chemical tests. Health certificate issued.' },
  { step: 'Port of Loading', location: 'Tabuk Port', date: 'Nov 02, 2025', status: 'Verified', icon: 'fa-ship', details: 'Loaded into reefer container TFC/EX026/25. Temp set to -18°C.' },
  { step: 'In Transit', location: 'Red Sea', date: 'Nov 15, 2025', status: 'Verified', icon: 'fa-anchor', details: 'Vessel: MSC LILY. Real-time temp monitoring active.' },
  { step: 'Port of Discharge', location: 'Jeddah Port', date: 'Nov 25, 2025', status: 'Verified', icon: 'fa-truck-ramp-box', details: 'Unloaded and cleared customs. Temp maintained at -18.5°C.' },
  { step: 'Warehouse Delivery', location: 'FMA Central Warehouse', date: 'Nov 30, 2025', status: 'Verified', icon: 'fa-warehouse', details: 'Stored in Cold Room 4. GRN-001 issued.' },
];

export default function TraceabilityTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) setShowResult(true);
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
          <button type="submit" className="bg-[#1F4E79] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20">
            Track Now
          </button>
        </form>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {showResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <div className="bg-[#1F4E79] text-white p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest">Tracking Container</div>
                <div className="text-3xl font-bold">{searchTerm}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase">Status: Closed</span>
                  <span className="text-white/60 text-xs">Product: Sea Bream</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://traces.io/trace/${searchTerm}`} alt="QR Code" className="w-20 h-20" />
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
                {traceSteps.map((step, i) => (
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
                      <p className="text-slate-500 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {step.details}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <button className="text-xs font-bold text-[#1F4E79] hover:underline flex items-center gap-1">
                          <i className="fa-solid fa-file-pdf"></i> View Certificate
                        </button>
                        <button className="text-xs font-bold text-[#1F4E79] hover:underline flex items-center gap-1">
                          <i className="fa-solid fa-camera"></i> View Photos
                        </button>
                        <button className="text-xs font-bold text-slate-400 hover:text-blue-600 ml-auto flex items-center gap-1">
                          <i className="fa-solid fa-pen"></i> Edit Step
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
