import { motion } from "motion/react";
import { ShieldCheck, Users, Cpu, ArrowRight, Anchor, Leaf, Box, Truck, Warehouse, CheckCircle2, TrendingUp, Globe, Database } from "lucide-react";
import { Link } from "react-router-dom";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-blue-950/40 z-10" />
        
        {/* Background Image/Video Placeholder */}
        <img 
          src="https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=2000" 
          alt="Fresh Produce Ocean" 
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-slow-zoom"
          referrerPolicy="no-referrer"
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Transparency You <br /> <span className="text-green-400">Can Trust</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-light">
              Tracing every product from source to your table. Farmers Market Asia brings you the future of food traceability.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/products" 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Explore Products
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/team" 
                className="w-full sm:w-auto bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center"
              >
                Meet Our Team
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* About Section - Concise & High Impact */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 -z-10" />
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-square md:aspect-video lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                  alt="Farmers Market" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <div className="text-sm uppercase tracking-widest font-semibold text-green-400">Traceable Origin</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest mb-6">
                Radical Transparency
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-8 leading-tight">
                Every Product Has <br /> <span className="text-green-600">A Story to Tell.</span>
              </h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-xl">
                We bridge the gap between the source and your table. TRACES isn't just a platform—it's our promise of safety, quality, and ethical sourcing for every single item we trade.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">Verified</h4>
                    <p className="text-slate-500 text-sm">Third-party certified quality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">Real-time</h4>
                    <p className="text-slate-500 text-sm">Live logistics data tracking.</p>
                  </div>
                </div>
              </div>

              <Link to="/about" className="group inline-flex items-center gap-3 bg-blue-950 text-white px-8 py-4 rounded-full font-bold transition-all hover:bg-blue-900 shadow-lg hover:shadow-blue-900/20">
                Discover Our Mission
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-blue-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2 
              {...fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              The Journey of Traceability
            </motion.h2>
            <motion.p 
              {...fadeInUp}
              className="text-blue-200/70 text-lg max-w-2xl mx-auto"
            >
              From the moment a product is sourced until it reaches your table, every milestone is recorded and verified.
            </motion.p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-blue-800 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", icon: <Anchor />, title: "Product Origin", desc: "Sourced directly from certified farms and fisheries." },
                { step: "02", icon: <ShieldCheck />, title: "Certification", desc: "Rigorous inspection and quality certification." },
                { step: "03", icon: <Truck />, title: "Logistics", desc: "Monitored shipment with real-time tracking." },
                { step: "04", icon: <Warehouse />, title: "Inventory", desc: "Secure storage in our state-of-the-art warehouses." },
                { step: "05", icon: <Box />, title: "Delivery", desc: "Final delivery to our valued customers." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-full bg-blue-900 border-4 border-blue-800 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:border-green-500 transition-all duration-500 text-green-400 group-hover:text-white">
                    {item.icon}
                  </div>
                  <span className="text-green-500 font-mono font-bold mb-2">{item.step}</span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-blue-200/60 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section id="products-preview" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-4 block">Our Catalog</span>
              <h2 className="text-4xl font-bold text-blue-950">Premium Products</h2>
            </div>
            <Link to="/products" className="bg-blue-950 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-900 transition-all">
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Fish & Seafood", 
                image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
                items: ["Sea Bream", "Pangasius Fillet", "Squid", "Shrimp"]
              },
              { 
                title: "Fresh Vegetables", 
                image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&q=80&w=800",
                items: ["Organic Greens", "Root Vegetables", "Exotic Produce"]
              },
              { 
                title: "Global Commodities", 
                image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
                items: ["Grains", "Oils", "Specialty Items"]
              }
            ].map((cat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100"
              >
                <div className="h-64 overflow-hidden">
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-blue-950 mb-4">{cat.title}</h3>
                  <ul className="space-y-2 mb-8">
                    {cat.items.map((item, idx) => (
                      <li key={idx} className="text-slate-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/products" className="w-full py-3 border border-slate-200 rounded-xl font-bold text-blue-950 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    Explore Category <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Trust Section */}
      <section id="investor-preview" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-950 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                  Empowering Investors with Real-Time Data
                </h2>
                <p className="text-blue-200/70 text-lg mb-10 leading-relaxed">
                  We believe that financial transparency is as important as product traceability. Our investor portal provides unprecedented access to shipment performance, P&L visibility, and ROI tracking.
                </p>
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                    <div className="text-4xl font-bold text-green-400 mb-2">38+</div>
                    <div className="text-blue-200/50 text-sm uppercase tracking-wider">Containers Traded</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-400 mb-2">12+</div>
                    <div className="text-blue-200/50 text-sm uppercase tracking-wider">Countries Sourced</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-400 mb-2">100%</div>
                    <div className="text-blue-200/50 text-sm uppercase tracking-wider">Products Traced</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
                    <div className="text-blue-200/50 text-sm uppercase tracking-wider">Active Investors</div>
                  </div>
                </div>
                <Link to="/investor" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold transition-all">
                  Access Investor Portal <TrendingUp size={20} />
                </Link>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <Database size={20} />
                    </div>
                    <span className="font-bold">Live Tracking Data</span>
                  </div>
                  <span className="text-xs text-green-400 animate-pulse flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    LIVE
                  </span>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: "Total Sales", value: "SAR 10,395,310", color: "text-white" },
                    { label: "Gross Profit", value: "SAR 271,224", color: "text-green-400" },
                    { label: "Active Shipments", value: "14 Containers", color: "text-white" },
                    { label: "Market Reach", value: "Asia & Middle East", color: "text-white" }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-blue-200/50">{stat.label}</span>
                      <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-white/5 rounded-xl text-xs text-blue-200/40 leading-relaxed italic">
                  "The level of transparency provided by TRACES has completely transformed how we evaluate our investment performance in the food sector."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Trusted by Global Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="text-2xl font-black text-slate-900 tracking-tighter">TABUK FISHERIES</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">QUE KY CORP</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">ASIA AGRO</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">ME FOODS</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">GLOBAL LOGISTICS</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[3rem] overflow-hidden bg-green-600 p-12 md:p-20 text-center text-white">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Trace Your Next Shipment?</h2>
              <p className="text-green-50 text-xl mb-10">
                Experience the power of full transparency. Join the Farmers Market Asia network today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="bg-white text-green-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-green-50 transition-all">
                  Contact Us
                </Link>
                <Link to="/investor" className="bg-green-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-green-800 transition-all">
                  Become an Investor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
