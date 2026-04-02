import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ArrowRight, ShieldCheck, X, Info, Award, History, CheckCircle2, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

const categories = ["All", "Fish & Seafood", "Vegetables", "Other Products"];

const products = [
  { 
    id: "F001", 
    name: "Sea Bream", 
    category: "Fish & Seafood", 
    origin: "Greece", 
    supplier: "Aegean Fisheries", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1534604973900-c41ab4c5e036?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 96, Protein 20g, Fat 1.7g, Omega-3 0.4g",
    certifications: ["ASC Certified", "GlobalG.A.P.", "ISO 22000"],
    supplierHistory: "Aegean Fisheries has been a leader in sustainable aquaculture since 1985, operating in the pristine waters of the Aegean Sea."
  },
  { 
    id: "F002", 
    name: "Pangasius Fillet", 
    category: "Fish & Seafood", 
    origin: "Vietnam", 
    supplier: "Mekong Delta Co.", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 92, Protein 15g, Fat 3.5g, Sodium 65mg",
    certifications: ["BAP 4-Star", "HACCP", "BRCGS"],
    supplierHistory: "Mekong Delta Co. partners with over 500 local farmers to bring high-quality, responsibly raised pangasius to global markets."
  },
  { 
    id: "F003", 
    name: "Squid Rings", 
    category: "Fish & Seafood", 
    origin: "Thailand", 
    supplier: "Siam Seafood", 
    status: "In Progress", 
    image: "https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 92, Protein 15.6g, Fat 1.4g, Cholesterol 233mg",
    certifications: ["MSC Certified", "GMP", "HALAL"],
    supplierHistory: "Siam Seafood specializes in wild-caught cephalopods, utilizing modern processing facilities in Samut Sakhon."
  },
  { 
    id: "V001", 
    name: "Organic Spinach", 
    category: "Vegetables", 
    origin: "India", 
    supplier: "Green Valley Farms", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 23, Protein 2.9g, Iron 2.7mg, Vitamin A 469µg",
    certifications: ["USDA Organic", "India Organic", "Fair Trade"],
    supplierHistory: "Green Valley Farms is a cooperative of 200 small-scale organic farmers in the foothills of the Himalayas."
  },
  { 
    id: "V002", 
    name: "Baby Carrots", 
    category: "Vegetables", 
    origin: "Australia", 
    supplier: "OzFresh", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 41, Fiber 2.8g, Vitamin A 835µg, Potassium 320mg",
    certifications: ["Freshcare", "HARPS", "ACO Organic"],
    supplierHistory: "OzFresh utilizes advanced hydroponic and traditional farming methods across Western Australia to ensure year-round supply."
  },
  { 
    id: "O001", 
    name: "Extra Virgin Olive Oil", 
    category: "Other Products", 
    origin: "Spain", 
    supplier: "Iberian Groves", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 15ml: Calories 120, Total Fat 14g, Saturated Fat 2g, Vitamin E 1.9mg",
    certifications: ["PDO Estepa", "EU Organic", "Non-GMO Project Verified"],
    supplierHistory: "Iberian Groves manages ancient olive orchards in Andalusia, producing cold-pressed oils using traditional stone mills."
  },
  { 
    id: "F004", 
    name: "Scampi Shrimp", 
    category: "Fish & Seafood", 
    origin: "Bangladesh", 
    supplier: "Bengal Bay", 
    status: "Pending", 
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 99, Protein 24g, Fat 0.3g, Selenium 38µg",
    certifications: ["ASC Certified", "HACCP"],
    supplierHistory: "Bengal Bay focuses on black tiger shrimp farming in the coastal regions of Khulna, emphasizing mangrove conservation."
  },
  { 
    id: "F005", 
    name: "Rohu Fish", 
    category: "Fish & Seafood", 
    origin: "Myanmar", 
    supplier: "Irrawaddy Sourcing", 
    status: "Fully Traced", 
    image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=600",
    nutritionalFacts: "Per 100g: Calories 97, Protein 17g, Fat 2.5g, Calcium 650mg",
    certifications: ["GlobalG.A.P.", "ISO 9001"],
    supplierHistory: "Irrawaddy Sourcing works with freshwater aquaculture farms along the Irrawaddy River, prioritizing local community development."
  },
];

const origins = ["All", ...Array.from(new Set(products.map(p => p.origin))).sort()];
const suppliers = ["All", ...Array.from(new Set(products.map(p => p.supplier))).sort()];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOrigin, setActiveOrigin] = useState("All");
  const [activeSupplier, setActiveSupplier] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasActiveFilters = activeCategory !== "All" || activeOrigin !== "All" || activeSupplier !== "All" || searchQuery !== "";

  const resetFilters = () => {
    setActiveCategory("All");
    setActiveOrigin("All");
    setActiveSupplier("All");
    setSearchQuery("");
  };

  const filteredProducts = products.filter(p => 
    (activeCategory === "All" || p.category === activeCategory) &&
    (activeOrigin === "All" || p.origin === activeOrigin) &&
    (activeSupplier === "All" || p.supplier === activeSupplier) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-blue-950 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-6"
          >
            Our <span className="text-green-400">Products</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-200/70 max-w-2xl mx-auto"
          >
            Explore our range of premium, fully traceable food items sourced from the finest producers globally.
          </motion.p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className={`sticky top-16 z-40 transition-all duration-500 ${
        isScrolled 
          ? "py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-lg" 
          : "py-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-500 ${isScrolled ? "space-y-0" : "space-y-8"}`}>
            <div className={`flex flex-col lg:flex-row justify-between items-center gap-4 transition-all duration-500 ${isScrolled ? "lg:gap-8" : "gap-8"}`}>
              {/* Categories */}
              <div className={`flex flex-wrap justify-center gap-2 transition-all duration-500 ${isScrolled ? "scale-90 origin-left" : ""}`}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 outline-none ${
                      activeCategory === cat 
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Reset */}
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className={`relative transition-all duration-500 ${isScrolled ? "w-full lg:w-64" : "w-full lg:w-96"}`}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={isScrolled ? 16 : 20} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 ${
                      isScrolled ? "py-2 text-sm" : "py-3"
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      onClick={resetFilters}
                      className={`flex items-center gap-2 font-bold transition-all shrink-0 border ${
                        isScrolled 
                          ? "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700" 
                          : "px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40"
                      }`}
                    >
                      <RotateCcw size={isScrolled ? 14 : 16} />
                      <span>{isScrolled ? "Reset" : "Reset Filters"}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className={`flex flex-wrap items-center gap-6 transition-all duration-500 overflow-hidden ${
              isScrolled ? "h-0 opacity-0 pt-0 border-0" : "h-auto opacity-100 pt-6 border-t border-slate-50 dark:border-slate-800"
            }`}>
              <div className="flex items-center gap-3">
                <Filter size={18} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter by:</span>
              </div>

              {/* Origin Filter */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin Country</label>
                <select 
                  value={activeOrigin}
                  onChange={(e) => setActiveOrigin(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  aria-label="Filter by Origin Country"
                >
                  {origins.map(origin => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                <select 
                  value={activeSupplier}
                  onChange={(e) => setActiveSupplier(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  aria-label="Filter by Supplier"
                >
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800 group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        product.status === "Fully Traced" ? "bg-green-500 text-white" :
                        product.status === "In Progress" ? "bg-amber-500 text-white" :
                        "bg-slate-400 text-white"
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-1">ID: {product.id}</div>
                    <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-4">{product.name}</h3>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 dark:text-slate-500">Origin:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{product.origin}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 dark:text-slate-500">Supplier:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{product.supplier}</span>
                      </div>
                    </div>

                    <Link 
                      to={`/trace?id=${product.id}`}
                      className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ShieldCheck size={18} />
                      Trace This Product
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-slate-300 dark:text-slate-700 mb-4 flex justify-center">
                <Search size={64} />
              </div>
              <h3 className="text-2xl font-bold text-slate-400 dark:text-slate-600">No products found</h3>
              <p className="text-slate-400 dark:text-slate-600 mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-blue-950/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedProduct.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>

              <div className="lg:w-1/2 h-64 lg:h-auto relative">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${
                    selectedProduct.status === "Fully Traced" ? "bg-green-500 text-white" :
                    selectedProduct.status === "In Progress" ? "bg-amber-500 text-white" :
                    "bg-slate-400 text-white"
                  }`}>
                    {selectedProduct.status}
                  </span>
                </div>
              </div>

              <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-2">ID: {selectedProduct.id}</div>
                <h2 className="text-3xl font-bold text-blue-950 dark:text-white mb-2">{selectedProduct.name}</h2>
                <div className="text-green-600 font-bold mb-8">{selectedProduct.category}</div>

                <div className="space-y-8">
                  {/* Nutritional Facts */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-950 dark:text-white mb-1">Nutritional Facts</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{selectedProduct.nutritionalFacts}</p>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                      <Award size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-950 dark:text-white mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.certifications.map((cert: string) => (
                          <span key={cert} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-green-500" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Supplier History */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <History size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-950 dark:text-white mb-1">Supplier History</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                        "{selectedProduct.supplierHistory}"
                      </p>
                      <div className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Partner: {selectedProduct.supplier}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                  <Link 
                    to={`/trace?id=${selectedProduct.id}`}
                    className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-slate-900/10"
                  >
                    <ShieldCheck size={20} />
                    View Full Traceability Report
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
