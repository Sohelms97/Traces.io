import React from "react";
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

const DEPARTMENT_ORDER = [
  'Leadership',
  'Operations',
  'Sales',
  'Finance',
  'Warehouse',
  'Tech',
  'Other'
];

export default function Team() {
  const { cmsData, loading } = useCMS();
  
  const teamData = cmsData.team || [];
  
  // Group team members by department and sort by DEPARTMENT_ORDER
  const departments = Array.from(new Set(teamData.map((m: any) => m.department || 'Other')))
    .sort((a: any, b: any) => {
      const indexA = DEPARTMENT_ORDER.indexOf(a);
      const indexB = DEPARTMENT_ORDER.indexOf(b);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

  return (
    <div className="pt-20 bg-bg-primary dark:bg-dark-bg-primary min-h-screen">
      {/* Header */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-text-primary dark:text-dark-text-primary mb-6 tracking-tight"
          >
            The People Behind <span className="text-accent-primary dark:text-dark-accent-primary">TRACES</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto font-medium"
          >
            A diverse team of experts dedicated to bringing transparency and trust to the global food supply chain.
          </motion.p>
        </div>
      </section>

      {/* Team Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-slate-200 dark:bg-slate-800 rounded-[2rem] mb-6" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : departments.length > 0 ? departments.map((dept: any) => (
          <section key={dept}>
            <div className="flex items-center gap-6 mb-12">
              <h2 className="text-3xl font-black text-text-primary dark:text-dark-text-primary whitespace-nowrap">
                {dept} {dept === 'Leadership' ? '' : 'Team'}
              </h2>
              <div className="h-px bg-border-main dark:bg-dark-border-main flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {teamData
                .filter((m: any) => (m.department || 'Other') === dept)
                .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((member: any, i: number) => (
                  <TeamCard key={member.id || i} member={member} delay={i * 0.1} />
                ))}
            </div>
          </section>
        )) : (
          <div className="text-center py-20 text-text-muted">No team members found.</div>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent-primary dark:bg-dark-bg-secondary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-soft-lg">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-black mb-8">Join the TRACES Network</h2>
              <p className="text-green-50 dark:text-dark-text-secondary text-lg mb-10">Whether you're a supplier, customer, or potential investor, we'd love to hear from you. Let's build a more transparent future together.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="bg-white text-accent-primary px-10 py-4 rounded-full font-bold transition-all hover:bg-green-50 shadow-lg">
                  Contact Our Team
                </Link>
                <Link to="/investor" className="bg-accent-primary/20 text-white border border-white/30 px-10 py-4 rounded-full font-bold transition-all hover:bg-white/10">
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
  const [isBioExpanded, setIsBioExpanded] = React.useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className="group card-modern p-0 overflow-hidden"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e: any) => {
            e.target.src = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=800";
          }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-accent-secondary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
          <div className="flex gap-4">
            {member.linkedin && (
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent-primary transition-colors">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            )}
            {member.twitter && (
              <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black transition-colors">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent-primary transition-colors">
                <i className="fa-solid fa-envelope"></i>
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-1">{member.name}</h3>
        <p className="text-accent-primary dark:text-dark-accent-primary font-bold text-sm mb-2 uppercase tracking-widest">{member.role}</p>
        <p className="text-text-muted text-xs font-bold uppercase mb-4">{member.department}</p>
        
        {member.expertise && member.expertise.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {member.expertise.slice(0, 3).map((exp: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-bg-tertiary dark:bg-dark-bg-tertiary text-accent-primary dark:text-dark-accent-primary text-[10px] font-bold rounded uppercase tracking-wider">
                {exp}
              </span>
            ))}
          </div>
        )}

        <div className={`text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed mb-4 ${isBioExpanded ? '' : 'line-clamp-3'}`}>
          {member.bio}
        </div>
        
        {member.bio && member.bio.length > 100 && (
          <button 
            onClick={() => setIsBioExpanded(!isBioExpanded)}
            className="text-accent-primary font-bold text-xs hover:underline flex items-center gap-1"
          >
            {isBioExpanded ? 'Read Less' : 'Read More'} 
            <i className={`fa-solid fa-chevron-${isBioExpanded ? 'up' : 'down'}`}></i>
          </button>
        )}
      </div>
    </motion.div>
  );
}
