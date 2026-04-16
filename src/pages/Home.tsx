import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Users, Cpu, ArrowRight, Anchor, Leaf, Box, Truck, Warehouse, CheckCircle2, TrendingUp, Globe, Database, LayoutDashboard, Megaphone, X, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useCMS } from "../hooks/useCMS";
import { useState, useEffect } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Home() {
  const { cmsData, loading } = useCMS();
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // SEO Handling
  useEffect(() => {
    if (cmsData.seo) {
      document.title = cmsData.seo.title || "TRACES.IO | Global Food Traceability";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", cmsData.seo.description || "");
      }
    }
  }, [cmsData.seo]);
  
  const hero = cmsData.homepage || {
    title: "Transparency You Can Trust",
    subtitle: "Tracing every product from source to your table. Farmers Market Asia brings you the future of food traceability.",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=2000",
    showStats: true
  };

  const stats = cmsData.stats || [
    { id: '1', label: 'Containers Traded', value: '38+' },
    { id: '2', label: 'Countries Sourced', value: '12+' },
    { id: '3', label: 'Products Traced', value: '100%' },
    { id: '4', label: 'Active Investors', value: '50+' }
  ];

  const partners = cmsData.partners || [];

  return (
    <div className="w-full relative">
      {/* Announcement Bar */}
      <AnimatePresence>
        {showAnnouncement && (cmsData.announcements || []).filter((a: any) => a.active).length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-600 text-white py-2 px-4 relative z-[60] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm font-bold">
              <Megaphone size={16} className="shrink-0" />
              <div className="flex gap-8 overflow-hidden">
                {(cmsData.announcements || []).filter((a: any) => a.active).map((a: any, i: number) => (
                  <span key={a.id || i} className="whitespace-nowrap">{a.text}</span>
                ))}
              </div>
              <button 
                onClick={() => setShowAnnouncement(false)}
                className="absolute right-4 hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-blue-950/40 z-10" />
        
        {/* Background Image/Video Placeholder */}
        <img 
          src={hero.image} 
          alt="Hero Background" 
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-slow-zoom"
          referrerPolicy="no-referrer"
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight whitespace-pre-line">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-light">
              {hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/products" 
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
              >
                Explore Products
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/trace" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                🔗 Trace a Product
                <Anchor size={20} />
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
      <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-green-100 dark:bg-green-900/20 rounded-full blur-3xl opacity-50 -z-10" />
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
              <span className="inline-block px-4 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-6">
                Radical Transparency
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-950 dark:text-white mb-8 leading-tight">
                Every Product Has <br /> <span className="text-green-600">A Story to Tell.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">
                We bridge the gap between the source and your table. TRACES isn't just a platform—it's our promise of safety, quality, and ethical sourcing for every single item we trade.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 dark:text-white">Verified</h4>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Third-party certified quality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 dark:text-white">Real-time</h4>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Live logistics data tracking.</p>
                  </div>
                </div>
              </div>

              <Link to="/about" className="group inline-flex items-center gap-3 bg-blue-950 dark:bg-slate-800 text-white px-8 py-4 rounded-full font-bold transition-all hover:bg-blue-900 dark:hover:bg-slate-700 shadow-lg hover:shadow-blue-900/20">
                Discover Our Mission
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-blue-950 dark:bg-slate-900 text-white overflow-hidden">
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
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-blue-800 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
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
                  <div className="w-20 h-20 rounded-full bg-blue-900 dark:bg-slate-800 border-4 border-blue-800 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:border-green-500 transition-all duration-500 text-green-400 group-hover:text-white">
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
      <section id="products-preview" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-4 block">Our Catalog</span>
              <h2 className="text-4xl font-bold text-blue-950 dark:text-white">Featured Products</h2>
            </div>
            <Link to="/products" className="bg-blue-950 dark:bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-900 dark:hover:bg-slate-700 transition-all">
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((_, i) => (
                <div key={i} className="card-modern p-0 overflow-hidden animate-pulse">
                  <div className="h-64 img-skeleton" />
                  <div className="p-8 space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mt-4" />
                  </div>
                </div>
              ))
            ) : (
              (cmsData.products || []).filter((p: any) => p.featured).slice(0, 3).map((product: any, i: number) => (
                <motion.div 
                  key={product.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card-modern p-0 overflow-hidden group"
                >
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={product.image || product.mainImage || "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800"} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800";
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                        {product.traceStatus || 'Traceable'}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">{product.name}</h3>
                    <p className="text-accent-primary font-bold text-sm mb-4">{product.category}</p>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-sm mb-8 line-clamp-3">{product.description || product.shortDescription}</p>
                    <div className="flex gap-2">
                      <Link to="/products" className="flex-1 py-3 border border-border-main dark:border-dark-border-main rounded-xl font-bold text-text-primary dark:text-dark-text-primary hover:bg-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-all flex items-center justify-center gap-2">
                        Details
                      </Link>
                      <Link to={`/trace?id=${product.id}`} className="flex-1 py-3 bg-accent-primary text-white rounded-xl font-bold hover:bg-accent-primary/90 transition-all flex items-center justify-center gap-2">
                        Trace <Anchor size={18} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {!loading && (cmsData.products || []).filter((p: any) => p.featured).length === 0 && (
              <div className="col-span-full py-20 text-center text-text-muted">
                <p className="text-xl font-medium">Featured products coming soon</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Investor Trust Section */}
      <section id="investor-preview" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-950 dark:bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
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
                  {stats.slice(0, 4).map((stat: any) => (
                    <div key={stat.id}>
                      <div className="text-4xl font-bold text-green-400 mb-2">{stat.value}</div>
                      <div className="text-blue-200/50 text-sm uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
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
                  {stats.slice(4, 8).map((stat: any) => (
                    <div key={stat.id} className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-blue-200/50">{stat.label}</span>
                      <span className="font-bold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-white/5 rounded-xl text-xs text-blue-200/40 leading-relaxed italic">
                  "{cmsData.testimonials?.[0]?.content || "The level of transparency provided by TRACES has completely transformed how we evaluate our investment performance."}"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs mb-10">Trusted by Global Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale dark:invert hover:grayscale-0 transition-all">
            {partners.length > 0 ? partners.map((p: any) => (
              <div key={p.id} className="flex flex-col items-center gap-2">
                {p.logo ? (
                  <img src={p.logo} alt={p.name} className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{p.name}</div>
                )}
              </div>
            )) : (
              <>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">TABUK FISHERIES</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">QUE KY CORP</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">ASIA AGRO</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">ME FOODS</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">GLOBAL LOGISTICS</div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-4 block">Visual Journey</span>
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-4">Our Operations Gallery</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">A glimpse into our global sourcing and logistics operations.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(cmsData.gallery || []).map((item: any, i: number) => (
              <motion.div 
                key={item.id || i}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-square shadow-soft hover:shadow-soft-lg transition-all duration-500"
              >
                <img 
                  src={item.url} 
                  alt={item.caption || "Gallery image"} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end">
                  <p className="text-white text-sm font-bold transform translate-y-4 hover:translate-y-0 transition-transform duration-500">{item.caption}</p>
                </div>
              </motion.div>
            ))}
            {(!cmsData.gallery || cmsData.gallery.length === 0) && (
              <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center gap-4">
                <ImageIcon size={48} />
                <p>No gallery images uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Everything you need to know about our traceability platform.</p>
          </div>
          <div className="space-y-4">
            {(cmsData.faqs || []).map((faq: any, i: number) => (
              <motion.div 
                key={faq.id || i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                <details className="group">
                  <summary className="flex justify-between items-center p-6 cursor-pointer list-none bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <span className="text-lg font-bold text-blue-950 dark:text-white">{faq.question}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform duration-300">
                      <ArrowRight size={20} className="rotate-90" />
                    </span>
                  </summary>
                  <div className="p-6 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </div>
                </details>
              </motion.div>
            ))}
            {(!cmsData.faqs || cmsData.faqs.length === 0) && (
              <div className="text-center py-10 text-slate-400 italic">
                No FAQs available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
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
