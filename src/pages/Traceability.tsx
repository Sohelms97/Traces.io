import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Search, MapPin, ShieldCheck, Truck, Warehouse, CheckCircle2, Anchor, FileText, QrCode, Users } from "lucide-react";

const steps = [
  { 
    id: 1, 
    title: "Sourcing & Origin", 
    status: "Completed", 
    date: "2026-03-10", 
    party: "Aegean Fisheries Ltd.", 
    location: "Chios, Greece", 
    icon: <Anchor size={24} />, 
    description: "Product harvested and initial quality check performed at source.",
    docs: ["Certificate of Origin", "Health Certificate", "Harvest Log"] 
  },
  { 
    id: 2, 
    title: "Quality Inspection", 
    status: "Completed", 
    date: "2026-03-12", 
    party: "SGS Global Services", 
    location: "Athens Port Terminal", 
    icon: <ShieldCheck size={24} />, 
    description: "Third-party inspection for compliance with international food safety standards.",
    docs: ["Inspection Report", "Lab Analysis", "Compliance Cert"] 
  },
  { 
    id: 3, 
    title: "International Shipment", 
    status: "In Progress", 
    date: "2026-03-15", 
    party: "Maersk Line Logistics", 
    location: "Mediterranean Sea (In Transit)", 
    icon: <Truck size={24} />, 
    description: "Container loaded and shipped via refrigerated vessel 'Maersk Columbus'.",
    docs: ["Bill of Lading", "Packing List", "Temperature Log"] 
  },
  { 
    id: 4, 
    title: "Customs Clearance", 
    status: "Pending", 
    date: "Expected 2026-03-28", 
    party: "Dubai Customs Authority", 
    location: "Jebel Ali Port, UAE", 
    icon: <FileText size={24} />, 
    description: "Import documentation review and customs duty processing.",
    docs: [] 
  },
  { 
    id: 5, 
    title: "Local Warehousing", 
    status: "Pending", 
    date: "TBD", 
    party: "Farmers Market Asia Hub", 
    location: "Dubai Logistics City", 
    icon: <Warehouse size={24} />, 
    description: "Final quality check and storage in temperature-controlled facility.",
    docs: [] 
  },
  { 
    id: 6, 
    title: "Final Delivery", 
    status: "Pending", 
    date: "TBD", 
    party: "Premium Retail Partner", 
    location: "Dubai, UAE", 
    icon: <CheckCircle2 size={24} />, 
    description: "Last-mile delivery to the customer or retail point.",
    docs: [] 
  },
];

export default function Traceability() {
  const location = useLocation();
  const [searchId, setSearchId] = useState("");
  const [tracedProduct, setTracedProduct] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setSearchId(id);
      handleTrace(id);
    }
  }, [location]);

  const handleTrace = (id: string) => {
    if (!id) return;
    
    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      if (id.length > 2) {
        setTracedProduct({
          id,
          name: id.startsWith("F") ? "Premium Sea Bream" : "Organic Baby Spinach",
          category: id.startsWith("F") ? "Seafood" : "Vegetables",
          origin: id.startsWith("F") ? "Greece" : "Netherlands",
          container: "MSKU-928374-1",
          vessel: "Maersk Columbus",
          batch: "B-2026-03-10-A",
          harvestDate: "March 10, 2026",
          tempRange: "-2°C to 2°C"
        });
      } else {
        setTracedProduct(null);
      }
      setIsSearching(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500 text-white";
      case "In Progress": return "bg-blue-500 text-white";
      case "Pending": return "bg-slate-200 text-slate-400";
      default: return "bg-slate-200 text-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Pending": return "bg-slate-100 text-slate-500 border-slate-200";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="pt-20">
      {/* Search Header */}
      <section className="bg-blue-950 py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold mb-6 border border-green-500/30"
            >
              <QrCode size={16} />
              REAL-TIME TRACEABILITY SYSTEM
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-8 tracking-tight"
            >
              From Source to <span className="text-green-500 italic">Table</span>
            </motion.h1>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
                <div className="flex items-center pl-6 text-slate-400">
                  <Search size={24} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Product ID or Container Number..." 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrace(searchId)}
                  className="w-full px-6 py-6 bg-transparent text-xl focus:outline-none placeholder:text-slate-500"
                />
                <button 
                  onClick={() => handleTrace(searchId)}
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? "Searching..." : "Trace Now"}
                </button>
              </div>
            </div>
            <p className="mt-6 text-blue-200/60 text-sm">
              Try searching for: <button className="text-green-400 hover:underline" onClick={() => {setSearchId("F001"); handleTrace("F001")}}>F001 (Seafood)</button> or <button className="text-green-400 hover:underline ml-2" onClick={() => {setSearchId("V002"); handleTrace("V002")}}>V002 (Vegetables)</button>
            </p>
          </div>
        </div>
      </section>

      {tracedProduct ? (
        <section className="py-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Product Info Card */}
              <div className="lg:col-span-1 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-slate-800 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">{tracedProduct.category}</span>
                      <h2 className="text-3xl font-bold text-blue-950 dark:text-white mt-1">{tracedProduct.name}</h2>
                    </div>
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-950 dark:text-white border border-slate-100 dark:border-slate-700">
                      <QrCode size={28} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Product ID</span>
                        <span className="text-sm font-bold text-blue-950 dark:text-white">{tracedProduct.id}</span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Batch #</span>
                        <span className="text-sm font-bold text-blue-950 dark:text-white">{tracedProduct.batch}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: "Origin", value: tracedProduct.origin },
                        { label: "Container #", value: tracedProduct.container },
                        { label: "Vessel", value: tracedProduct.vessel },
                        { label: "Harvest Date", value: tracedProduct.harvestDate },
                        { label: "Temp Range", value: tracedProduct.tempRange },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                          <span className="text-sm font-semibold text-blue-950 dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-blue-950 dark:bg-slate-800 rounded-3xl text-center text-white">
                    <div className="w-32 h-32 bg-white dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center rounded-2xl p-2">
                      <QrCode size={100} className="text-blue-950 dark:text-white" />
                    </div>
                    <h4 className="font-bold mb-1">Digital Passport</h4>
                    <p className="text-xs text-blue-200/60 dark:text-slate-400">Scan to share this traceability report</p>
                  </div>
                </motion.div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-bold text-blue-950 dark:text-white">Journey Timeline</h2>
                  <div className="flex gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-600 dark:text-slate-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-slate-600 dark:text-slate-400">In Transit</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                  <div className="space-y-12">
                    {steps.map((step, i) => (
                      <motion.div 
                        key={step.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="relative flex flex-col md:flex-row gap-8"
                      >
                        {/* Icon Node */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg transition-all duration-500 ${getStatusColor(step.status)}`}>
                          {step.icon}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                              <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-3 ${getStatusBadge(step.status)}`}>
                                {step.status}
                              </div>
                              <h3 className="text-2xl font-bold text-blue-950 dark:text-white">{step.title}</h3>
                            </div>
                            <div className="text-right sm:text-right">
                              <div className="text-lg font-bold text-blue-950 dark:text-white font-mono">{step.date}</div>
                              <div className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1">
                                <MapPin size={14} />
                                {step.location}
                              </div>
                            </div>
                          </div>

                          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            {step.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2">Responsible Party</span>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-950 dark:text-white">
                                  <Users size={16} />
                                </div>
                                <span className="text-sm font-bold text-blue-950 dark:text-white">{step.party}</span>
                              </div>
                            </div>
                            
                            {step.docs.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2">Verified Documents</span>
                                <div className="flex flex-wrap gap-2">
                                  {step.docs.map((doc, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] text-blue-900 dark:text-blue-400 font-bold border border-slate-100 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800 cursor-pointer transition-all">
                                      <FileText size={12} />
                                      {doc}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-32 bg-white dark:bg-slate-950 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-800 mx-auto mb-10 rotate-12">
              <Search size={64} />
            </div>
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-6 tracking-tight">Ready to verify your shipment?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed">
              Our end-to-end traceability system provides absolute transparency. Enter a Product ID or Container Number above to access real-time logistics data, quality certificates, and origin verification.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { icon: <Anchor className="text-blue-500" />, title: "Origin", desc: "Verified source data" },
                { icon: <ShieldCheck className="text-green-500" />, title: "Quality", desc: "Inspection reports" },
                { icon: <Truck className="text-amber-500" />, title: "Logistics", desc: "Real-time tracking" },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                  <div className="mb-4">{item.icon}</div>
                  <h4 className="font-bold text-blue-950 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
