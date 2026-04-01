import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Search, MapPin, ShieldCheck, Truck, Warehouse, CheckCircle2, Anchor, FileText, QrCode } from "lucide-react";

const steps = [
  { id: 1, title: "Origin", status: "Completed", date: "2026-03-10", party: "Aegean Fisheries", location: "Greece", icon: <Anchor />, docs: ["Certificate of Origin", "Health Certificate"] },
  { id: 2, title: "Inspection", status: "Completed", date: "2026-03-12", party: "SGS Global", location: "Athens Port", icon: <ShieldCheck />, docs: ["Inspection Report", "Lab Analysis"] },
  { id: 3, title: "Shipment", status: "In Progress", date: "2026-03-15", party: "Maersk Line", location: "Mediterranean Sea", icon: <Truck />, docs: ["Bill of Lading", "Packing List"] },
  { id: 4, title: "Customs", status: "Pending", date: "TBD", party: "Dubai Customs", location: "Jebel Ali Port", icon: <FileText />, docs: [] },
  { id: 5, title: "Warehouse", status: "Pending", date: "TBD", party: "Farmers Market Asia", location: "Dubai Logistics City", icon: <Warehouse />, docs: [] },
  { id: 6, title: "Delivered", status: "Pending", date: "TBD", party: "End Buyer", location: "Dubai, UAE", icon: <CheckCircle2 />, docs: [] },
];

export default function Traceability() {
  const location = useLocation();
  const [searchId, setSearchId] = useState("");
  const [tracedProduct, setTracedProduct] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      setSearchId(id);
      handleTrace(id);
    }
  }, [location]);

  const handleTrace = (id: string) => {
    // Mock tracing logic
    if (id.length > 2) {
      setTracedProduct({
        id,
        name: id.startsWith("F") ? "Sea Bream" : "Organic Spinach",
        origin: "Global Sourcing",
        container: "MSKU9283741",
        vessel: "Maersk Columbus"
      });
    } else {
      setTracedProduct(null);
    }
  };

  return (
    <div className="pt-20">
      {/* Search Header */}
      <section className="bg-slate-900 py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-8"
            >
              Trace Your <span className="text-green-400">Product</span>
            </motion.h1>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input 
                type="text" 
                placeholder="Enter Product ID or Container Number (e.g., F001)..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrace(searchId)}
                className="w-full pl-16 pr-32 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl text-xl focus:outline-none focus:border-green-500 transition-all"
              />
              <button 
                onClick={() => handleTrace(searchId)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all"
              >
                Trace
              </button>
            </div>
            <p className="mt-6 text-slate-400 text-sm">
              Example IDs: <span className="text-green-400 cursor-pointer" onClick={() => {setSearchId("F001"); handleTrace("F001")}}>F001</span>, 
              <span className="text-green-400 ml-2 cursor-pointer" onClick={() => {setSearchId("V002"); handleTrace("V002")}}>V002</span>
            </p>
          </div>
        </div>
      </section>

      {tracedProduct ? (
        <section className="py-24 bg-slate-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Product Info Card */}
              <div className="lg:col-span-1 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-blue-950">{tracedProduct.name}</h2>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-blue-950">
                      <QrCode size={24} />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Product ID</span>
                      <span className="text-slate-900 font-bold">{tracedProduct.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Container #</span>
                      <span className="text-slate-900 font-bold">{tracedProduct.container}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Vessel</span>
                      <span className="text-slate-900 font-bold">{tracedProduct.vessel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Status</span>
                      <span className="text-amber-600 font-bold">In Transit</span>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl text-center">
                    <div className="w-32 h-32 bg-white mx-auto mb-4 flex items-center justify-center border border-slate-200 rounded-xl">
                      <QrCode size={80} className="text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400">Scan to trace this product on your mobile device</p>
                  </div>
                </motion.div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <div className="space-y-8">
                  {steps.map((step, i) => (
                    <motion.div 
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex gap-8"
                    >
                      {/* Line */}
                      {i !== steps.length - 1 && (
                        <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2" />
                      )}

                      {/* Icon Node */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg ${
                        step.status === "Completed" ? "bg-green-600 text-white" :
                        step.status === "In Progress" ? "bg-amber-500 text-white animate-pulse" :
                        "bg-white text-slate-300 border border-slate-200"
                      }`}>
                        {step.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-blue-950">{step.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MapPin size={14} />
                              {step.location} • {step.party}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                              step.status === "Completed" ? "text-green-600" :
                              step.status === "In Progress" ? "text-amber-600" :
                              "text-slate-400"
                            }`}>
                              {step.status}
                            </div>
                            <div className="text-sm text-slate-400 font-mono">{step.date}</div>
                          </div>
                        </div>

                        {step.docs.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                            {step.docs.map((doc, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-blue-900 font-medium border border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors">
                                <FileText size={14} />
                                {doc}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-32 bg-white text-center">
          <div className="max-w-xl mx-auto px-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8">
              <Search size={48} />
            </div>
            <h2 className="text-3xl font-bold text-blue-950 mb-4">Enter a Product ID to Begin</h2>
            <p className="text-slate-500">
              Our end-to-end traceability system allows you to verify every step of a product's journey. Enter a valid ID above to see live data.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
