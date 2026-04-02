import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, Cpu, CheckCircle2, Target, Eye, Award, History, Leaf, TrendingUp } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function About() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-32 bg-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover"
            alt="Farm background"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Our Story & Mission
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-200/80 max-w-3xl mx-auto"
          >
            Redefining the global food supply chain through radical transparency and cutting-edge traceability.
          </motion.p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp}>
              <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-8">How It All Started</h2>
              <div className="space-y-6 text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                <p>
                  Farmers Market Asia was founded on a simple yet powerful premise: consumers and investors deserve to know exactly where their food comes from. In an era of complex global logistics, the origin of our food had become a mystery.
                </p>
                <p>
                  We saw a gap in the market—a lack of trust and a surplus of ambiguity. That's why we created TRACES, our proprietary platform that provides end-to-end visibility from the moment a product is harvested to the moment it reaches the consumer.
                </p>
                <p>
                  Today, we are more than just a trading company. We are a technology-driven logistics partner that prioritizes food safety, ethical sourcing, and investor confidence above all else.
                </p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                alt="Market" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              {...fadeInUp}
              className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8">
                <Target size={32} />
              </div>
              <h3 className="text-3xl font-bold text-blue-950 dark:text-white mb-6">Our Mission</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                To empower consumers and investors with real-time, verified data about every product we handle, ensuring the highest standards of food safety and ethical trade practices across Asia and beyond.
              </p>
            </motion.div>
            <motion.div 
              {...fadeInUp}
              className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-8">
                <Eye size={32} />
              </div>
              <h3 className="text-3xl font-bold text-blue-950 dark:text-white mb-6">Our Vision</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                To become the global benchmark for food traceability, where "TRACES Certified" is synonymous with absolute trust, quality, and sustainability in the international marketplace.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-4">Our Core Values</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">The principles that guide every decision we make.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <ShieldCheck size={32} />, title: "Transparency", desc: "We hide nothing. Every step is recorded and accessible." },
              { icon: <Award size={32} />, title: "Integrity", desc: "Honesty in our data and our relationships is non-negotiable." },
              { icon: <Leaf size={32} />, title: "Sustainability", desc: "Protecting the sources that provide our food for future generations." },
              { icon: <Cpu size={32} />, title: "Innovation", desc: "Constantly evolving our tech to provide better traceability." }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 shadow-inner dark:shadow-slate-800">
                  {value.icon}
                </div>
                <h4 className="text-xl font-bold text-blue-950 dark:text-white mb-3">{value.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-blue-950 dark:bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-blue-200/60">Milestones that shaped Farmers Market Asia.</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-800 dark:bg-slate-800 -translate-x-1/2 hidden md:block" />
            <div className="space-y-12">
              {[
                { year: "2023", title: "Founding", desc: "Farmers Market Asia established with a focus on regional seafood trade." },
                { year: "2024", title: "TRACES Launch", desc: "Development and launch of our proprietary traceability platform." },
                { year: "2025", title: "Global Expansion", desc: "Expanded sourcing to 12+ countries and reached 38+ container milestones." },
                { year: "2026", title: "Investor Portal", desc: "Launched real-time financial transparency tools for our partners." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1 text-center md:text-left">
                    <div className={`p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 ${i % 2 === 0 ? 'md:text-right' : ''}`}>
                      <span className="text-green-400 font-bold text-2xl mb-2 block">{item.year}</span>
                      <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                      <p className="text-blue-200/60">{item.desc}</p>
                    </div>
                  </div>
                  <div className="relative z-10 w-12 h-12 bg-green-500 rounded-full border-4 border-blue-950 dark:border-slate-900 flex items-center justify-center">
                    <History size={20} className="text-blue-950" />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Traceability Matters */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white border border-slate-800">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold mb-8">Why Traceability Matters</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Food Safety</h4>
                    <p className="text-slate-400">Rapid response to any quality issues by knowing exactly where every batch originated.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Customer Trust</h4>
                    <p className="text-slate-400">Providing the peace of mind that comes from knowing your food is ethically and safely sourced.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Investor Confidence</h4>
                    <p className="text-slate-400">Transparent data leads to better investment decisions and long-term financial stability.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-950 dark:bg-slate-800 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-8">Ready to See TRACES in Action?</h2>
              <p className="text-blue-200/70 text-lg mb-10">Experience the power of full transparency. Explore our traceable products or meet the team behind the platform.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products" className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold transition-all">
                  Explore Products
                </Link>
                <Link to="/team" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-10 py-4 rounded-full font-bold transition-all">
                  Meet the Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
