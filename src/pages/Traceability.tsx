import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Search, MapPin, ShieldCheck, Truck, Warehouse, CheckCircle2, Anchor, FileText, QrCode, Users, Loader2, AlertCircle } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

export default function Traceability() {
  const location = useLocation();
  const [searchId, setSearchId] = useState("");
  const [tracedProduct, setTracedProduct] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTraces, setRecentTraces] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_traces');
    if (saved) setRecentTraces(JSON.parse(saved));

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setSearchId(id);
      handleTrace(id);
    }
  }, [location]);

  const handleTrace = async (id: string) => {
    if (!id) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const productDoc = await getDoc(doc(db, "products", id));
      if (productDoc.exists()) {
        const productData = { id: productDoc.id, ...productDoc.data() };
        setTracedProduct(productData);
        
        // Save to recent
        const newRecent = [productData, ...recentTraces.filter(p => p.id !== id)].slice(0, 5);
        setRecentTraces(newRecent);
        localStorage.setItem('recent_traces', JSON.stringify(newRecent));

        // Fetch timeline
        const timelineQuery = query(
          collection(db, "products", id, "traceability"),
          orderBy("order", "asc")
        );
        const timelineSnapshot = await getDocs(timelineQuery);
        const timelineData = timelineSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((stage: any) => stage.showPublicly !== false);
        
        setTimeline(timelineData);
      } else {
        setTracedProduct(null);
        setError("Product not found. Please check the ID or scan a valid QR code.");
      }
    } catch (err) {
      console.error("Error tracing product:", err);
      setError("An error occurred while fetching data. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Anchor': return <Anchor size={24} />;
      case 'ShieldCheck': return <ShieldCheck size={24} />;
      case 'Truck': return <Truck size={24} />;
      case 'FileText': return <FileText size={24} />;
      case 'Warehouse': return <Warehouse size={24} />;
      case 'CheckCircle2': return <CheckCircle2 size={24} />;
      default: return <MapPin size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-600 text-white";
      case "In Progress": return "bg-blue-600 text-white";
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
    <div className="pt-20 bg-bg-primary dark:bg-dark-bg-primary min-h-screen">
      {/* Search Header */}
      <section className="bg-dark-bg-primary py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-bold mb-6 border border-accent-primary/30"
            >
              <QrCode size={16} />
              REAL-TIME TRACEABILITY SYSTEM
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black mb-8 tracking-tighter"
            >
              From Source to <span className="text-accent-primary italic">Table</span>
            </motion.h1>
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-accent-primary to-accent-secondary rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
                <div className="flex items-center pl-6 text-slate-400">
                  <Search size={24} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Product ID or SKU..." 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrace(searchId)}
                  className="w-full px-6 py-6 bg-transparent text-xl focus:outline-none placeholder:text-slate-500 font-medium"
                />
                <button 
                  onClick={() => handleTrace(searchId)}
                  disabled={isSearching}
                  className="bg-accent-primary hover:bg-accent-primary/90 text-white px-10 py-6 font-black transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="animate-spin" /> : "Trace Now"}
                </button>
              </div>
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}
            
            {recentTraces.length > 0 && !tracedProduct && (
              <div className="mt-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Traces</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {recentTraces.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {setSearchId(p.id); handleTrace(p.id)}}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {tracedProduct ? (
        <section className="py-24 bg-bg-secondary dark:bg-dark-bg-primary min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Product Info Card */}
              <div className="lg:col-span-1 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card-modern p-8 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-xs font-bold text-accent-primary dark:text-dark-accent-primary uppercase tracking-widest">{tracedProduct.category}</span>
                      <h2 className="text-3xl font-black text-text-primary dark:text-dark-text-primary mt-1">{tracedProduct.name}</h2>
                    </div>
                    <div className="w-14 h-14 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-2xl flex items-center justify-center text-text-primary dark:text-dark-text-primary border border-border-main dark:border-dark-border-main">
                      <QrCode size={28} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-2xl border border-border-main dark:border-dark-border-main">
                        <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Product ID</span>
                        <span className="text-sm font-black text-text-primary dark:text-dark-text-primary">{tracedProduct.id}</span>
                      </div>
                      <div className="p-4 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-2xl border border-border-main dark:border-dark-border-main">
                        <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">SKU</span>
                        <span className="text-sm font-black text-text-primary dark:text-dark-text-primary">{tracedProduct.sku || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: "Origin", value: tracedProduct.originCountry },
                        { label: "Region", value: tracedProduct.originRegion },
                        { label: "Source", value: tracedProduct.sourceType },
                        { label: "Supplier", value: tracedProduct.supplierName },
                        { label: "Harvest Season", value: tracedProduct.harvestSeason },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-border-main dark:border-dark-border-main last:border-0">
                          <span className="text-sm text-text-secondary dark:text-dark-text-secondary font-medium">{item.label}</span>
                          <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">{item.value || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-dark-bg-primary rounded-3xl text-center text-white shadow-soft-lg">
                    <div className="w-32 h-32 bg-white mx-auto mb-4 flex items-center justify-center rounded-2xl p-2">
                      <QrCode size={100} className="text-dark-bg-primary" />
                    </div>
                    <h4 className="font-black mb-1">Digital Passport</h4>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest">Scan to share this traceability report</p>
                  </div>
                </motion.div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-black text-text-primary dark:text-dark-text-primary">Journey Timeline</h2>
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-text-secondary dark:text-dark-text-secondary">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-text-secondary dark:text-dark-text-secondary">In Transit</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-border-main dark:bg-dark-border-main hidden md:block" />

                  <div className="space-y-12">
                    {timeline.length > 0 ? timeline.map((step: any, i: number) => (
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
                          {getIcon(step.icon)}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 card-modern p-8 group">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                              <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${getStatusBadge(step.status)}`}>
                                {step.status}
                              </div>
                              <h3 className="text-2xl font-black text-text-primary dark:text-dark-text-primary">{step.name}</h3>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-black text-text-primary dark:text-dark-text-primary font-mono">{step.date}</div>
                              <div className="text-sm text-text-muted flex items-center sm:justify-end gap-1 font-medium">
                                <MapPin size={14} />
                                {step.location || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <p className="text-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed font-medium">
                            {step.publicDescription}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-main dark:border-dark-border-main">
                            <div>
                              <span className="text-[10px] uppercase font-black text-text-muted block mb-2 tracking-widest">Responsible Party</span>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-bg-tertiary dark:bg-dark-bg-tertiary flex items-center justify-center text-text-primary dark:text-dark-text-primary">
                                  <Users size={16} />
                                </div>
                                <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">{step.party || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {step.documents && step.documents.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-black text-text-muted block mb-2 tracking-widest">Verified Documents</span>
                                <div className="flex flex-wrap gap-2">
                                  {step.documents.map((doc: any, idx: number) => (
                                    <a 
                                      key={idx} 
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-xl text-[10px] text-accent-primary dark:text-dark-accent-primary font-black border border-border-main dark:border-dark-border-main hover:bg-accent-primary hover:text-white transition-all"
                                    >
                                      <FileText size={12} />
                                      {doc.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="card-modern p-12 text-center">
                        <p className="text-text-muted font-medium">No public traceability stages available for this product.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-32 bg-bg-primary dark:bg-dark-bg-primary text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="w-32 h-32 bg-bg-tertiary dark:bg-dark-bg-tertiary rounded-[2.5rem] flex items-center justify-center text-text-muted mx-auto mb-10 rotate-12 shadow-soft-lg">
              <Search size={64} />
            </div>
            <h2 className="text-4xl font-black text-text-primary dark:text-dark-text-primary mb-6 tracking-tighter">Ready to verify your shipment?</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary text-lg mb-10 leading-relaxed font-medium">
              Our end-to-end traceability system provides absolute transparency. Enter a Product ID or SKU above to access real-time logistics data, quality certificates, and origin verification.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { icon: <Anchor className="text-blue-500" />, title: "Origin", desc: "Verified source data" },
                { icon: <ShieldCheck className="text-accent-primary" />, title: "Quality", desc: "Inspection reports" },
                { icon: <Truck className="text-amber-500" />, title: "Logistics", desc: "Real-time tracking" },
              ].map((item, i) => (
                <div key={i} className="p-6 card-modern">
                  <div className="mb-4">{item.icon}</div>
                  <h4 className="font-black text-text-primary dark:text-dark-text-primary mb-1">{item.title}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
