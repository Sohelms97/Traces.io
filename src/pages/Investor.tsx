import { motion } from "motion/react";
import { TrendingUp, BarChart3, PieChart, ShieldCheck, ArrowRight, FileText, DollarSign, Globe, Database } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Containers", value: "38", sub: "Nov 2025 – Feb 2026" },
  { label: "Total Sales", value: "AED 10,395,310", sub: "Verified Revenue" },
  { label: "Gross Profit", value: "AED 271,224", sub: "Net Performance" },
  { label: "Active Investors", value: "52", sub: "Global Network" }
];

const features = [
  { icon: <BarChart3 />, title: "P&L Visibility", desc: "Container-wise profit and loss statements updated in real-time." },
  { icon: <TrendingUp />, title: "ROI Reporting", desc: "Detailed breakdown of return on investment for every shipment." },
  { icon: <ShieldCheck />, title: "Risk Management", desc: "Full transparency into logistics and insurance coverage." },
  { icon: <PieChart />, title: "Market Insights", desc: "Access to regional demand data and pricing trends." }
];

export default function Investor() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-blue-950 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500/5 -skew-x-12 translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-8 leading-tight"
            >
              Investing in <br /> <span className="text-green-400">Transparency</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-200/70 mb-10 leading-relaxed"
            >
              Farmers Market Asia provides a unique investment opportunity backed by real-time data and full traceability. We bridge the gap between capital and global food trade.
            </motion.p>
            <Link 
              to="/contact"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-green-600/20"
            >
              Become an Investor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center"
              >
                <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</div>
                <div className="text-3xl font-bold text-blue-950 dark:text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 dark:text-slate-500 text-xs">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-6">Transparency Features</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">We provide our investors with the tools they need to track their performance with absolute clarity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex gap-8 p-10 bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-950 dark:text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-blue-950 dark:text-white mb-6">Investment Process</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">A simple, secure, and transparent journey for our partners.</p>
          </div>
          
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
              {[
                { step: "01", title: "Contract", desc: "Sign investment agreement." },
                { step: "02", title: "Transfer", desc: "Secure fund transfer." },
                { step: "03", title: "Receipt", desc: "Official money receipt." },
                { step: "04", title: "Sourcing", desc: "Product shipped." },
                { step: "05", title: "Sales", desc: "Product sold in market." },
                { step: "06", title: "ROI", desc: "Returns distributed." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 text-green-600 dark:text-green-400 font-bold shadow-sm">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-blue-950 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-600 dark:bg-green-700 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-8">Start Your Investment Journey</h2>
              <p className="text-green-50 dark:text-green-100 text-lg mb-10">Join a network of investors who value transparency as much as performance. Get in touch with our team for a detailed prospectus.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/contact"
                  className="bg-white text-green-700 px-10 py-4 rounded-full font-bold hover:bg-green-50 transition-all flex items-center justify-center"
                >
                  Request Prospectus
                </Link>
                <Link 
                  to="/contact"
                  className="bg-green-700 text-white px-10 py-4 rounded-full font-bold hover:bg-green-800 transition-all flex items-center justify-center"
                >
                  Contact Advisor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
