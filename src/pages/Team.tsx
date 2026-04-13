import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Linkedin, Mail } from "lucide-react";
import { useCMS } from "../hooks/useCMS";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Team() {
  const { cmsData, loading } = useCMS();
  
  const teamData = cmsData.team || [];
  
  // Group team members by department if needed, or just show all
  const departments = Array.from(new Set(teamData.map((m: any) => m.department || 'General')));

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-slate-50 dark:bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-blue-950 dark:text-white mb-6"
          >
            The People Behind <span className="text-green-600 dark:text-green-400">TRACES</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            A diverse team of experts dedicated to bringing transparency and trust to the global food supply chain.
          </motion.p>
        </div>
      </section>

      {/* Team Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {departments.length > 0 ? departments.map((dept: string) => (
          <section key={dept}>
            <h2 className="text-3xl font-bold text-blue-950 dark:text-white mb-12 flex items-center gap-4">
              {dept} Team
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {teamData.filter((m: any) => (m.department || 'General') === dept).map((member: any, i: number) => (
                <TeamCard key={member.id || i} member={member} delay={i * 0.1} />
              ))}
            </div>
          </section>
        )) : (
          <div className="text-center py-20 text-slate-400">No team members found.</div>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-600 dark:bg-green-700 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-8">Join the TRACES Network</h2>
              <p className="text-green-50 dark:text-green-100 text-lg mb-10">Whether you're a supplier, customer, or potential investor, we'd love to hear from you. Let's build a more transparent future together.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="bg-white text-green-700 px-10 py-4 rounded-full font-bold transition-all hover:bg-green-50">
                  Contact Our Team
                </Link>
                <Link to="/investor" className="bg-green-700 text-white border border-green-500 px-10 py-4 rounded-full font-bold transition-all hover:bg-green-800">
                  Investor Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamCard({ member, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="group"
    >
      <div className="relative mb-6 rounded-[2rem] overflow-hidden aspect-[4/5] bg-slate-100 dark:bg-slate-800">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-green-500 transition-colors">
              <Linkedin size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-green-500 transition-colors">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-blue-950 dark:text-white mb-1">{member.name}</h3>
      <p className="text-green-600 dark:text-green-400 font-semibold text-sm mb-4 uppercase tracking-wider">{member.role}</p>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{member.bio}</p>
    </motion.div>
  );
}
