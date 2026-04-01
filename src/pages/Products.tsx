import { useState } from "react";
import { motion } from "motion/react";
import { Search, Filter, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const categories = ["All", "Fish & Seafood", "Vegetables", "Other Products"];

const products = [
  { id: "F001", name: "Sea Bream", category: "Fish & Seafood", origin: "Greece", supplier: "Aegean Fisheries", status: "Fully Traced", image: "https://images.unsplash.com/photo-1534604973900-c41ab4c5e036?auto=format&fit=crop&q=80&w=600" },
  { id: "F002", name: "Pangasius Fillet", category: "Fish & Seafood", origin: "Vietnam", supplier: "Mekong Delta Co.", status: "Fully Traced", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600" },
  { id: "F003", name: "Squid Rings", category: "Fish & Seafood", origin: "Thailand", supplier: "Siam Seafood", status: "In Progress", image: "https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&q=80&w=600" },
  { id: "V001", name: "Organic Spinach", category: "Vegetables", origin: "India", supplier: "Green Valley Farms", status: "Fully Traced", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600" },
  { id: "V002", name: "Baby Carrots", category: "Vegetables", origin: "Australia", supplier: "OzFresh", status: "Fully Traced", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600" },
  { id: "O001", name: "Extra Virgin Olive Oil", category: "Other Products", origin: "Spain", supplier: "Iberian Groves", status: "Fully Traced", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600" },
  { id: "F004", name: "Scampi Shrimp", category: "Fish & Seafood", origin: "Bangladesh", supplier: "Bengal Bay", status: "Pending", image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=600" },
  { id: "F005", name: "Rohu Fish", category: "Fish & Seafood", origin: "Myanmar", supplier: "Irrawaddy Sourcing", status: "Fully Traced", image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=600" },
];

const origins = ["All", ...Array.from(new Set(products.map(p => p.origin))).sort()];
const suppliers = ["All", ...Array.from(new Set(products.map(p => p.supplier))).sort()];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOrigin, setActiveOrigin] = useState("All");
  const [activeSupplier, setActiveSupplier] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
      <section className="py-12 bg-white border-b border-slate-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              {/* Categories */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                      activeCategory === cat 
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <Filter size={18} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-900">Filter by:</span>
              </div>

              {/* Origin Filter */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin Country</label>
                <select 
                  value={activeOrigin}
                  onChange={(e) => setActiveOrigin(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-green-500 transition-colors"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-green-500 transition-colors"
                >
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(activeCategory !== "All" || activeOrigin !== "All" || activeSupplier !== "All" || searchQuery !== "") && (
                <button 
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveOrigin("All");
                    setActiveSupplier("All");
                    setSearchQuery("");
                  }}
                  className="mt-auto mb-1 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-24 bg-slate-50 min-h-screen">
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
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group"
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
                    <div className="text-xs text-slate-400 font-mono mb-1">ID: {product.id}</div>
                    <h3 className="text-xl font-bold text-blue-950 mb-4">{product.name}</h3>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Origin:</span>
                        <span className="text-slate-700 font-semibold">{product.origin}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Supplier:</span>
                        <span className="text-slate-700 font-semibold">{product.supplier}</span>
                      </div>
                    </div>

                    <Link 
                      to={`/trace?id=${product.id}`}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
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
              <div className="text-slate-300 mb-4 flex justify-center">
                <Search size={64} />
              </div>
              <h3 className="text-2xl font-bold text-slate-400">No products found</h3>
              <p className="text-slate-400 mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
