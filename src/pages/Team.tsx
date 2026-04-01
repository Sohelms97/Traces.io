import { motion } from "motion/react";
import { Linkedin, Mail } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const team = {
  leadership: [
    { name: "Ahmed Al-Farsi", role: "Chief Executive Officer", bio: "20+ years of experience in international trade and logistics. Visionary behind the TRACES platform.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
    { name: "Sarah Chen", role: "Chief Operations Officer", bio: "Expert in supply chain optimization and Asian market dynamics. Former logistics lead at a Fortune 500 company.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400" },
    { name: "Marcus Thorne", role: "Chief Technology Officer", bio: "Pioneer in blockchain and traceability systems. Leading the technical evolution of Farmers Market Asia.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" }
  ],
  operations: [
    { name: "Elena Rodriguez", role: "Head of Quality Assurance", bio: "Ensuring every product meets our rigorous TRACES certification standards.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
    { name: "David Kim", role: "Supply Chain Manager", bio: "Managing global sourcing and partner relationships across 12+ countries.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" },
    { name: "Fatima Zahra", role: "Logistics Coordinator", bio: "Expert in Middle Eastern customs and real-time shipment monitoring.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" }
  ],
  tech: [
    { name: "James Wilson", role: "Lead Data Scientist", bio: "Turning complex logistics data into actionable insights for our investors.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400" },
    { name: "Li Na", role: "Full Stack Developer", bio: "Building the seamless user interface of the TRACES investor portal.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" }
  ]
};

export default function Team() {
  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-blue-950 mb-6"
          >
            The People Behind <span className="text-green-600">TRACES</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto"
          >
            A diverse team of experts dedicated to bringing transparency and trust to the global food supply chain.
          </motion.p>
        </div>
      </section>

      {/* Team Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {/* Leadership */}
        <section>
          <h2 className="text-3xl font-bold text-blue-950 mb-12 flex items-center gap-4">
            Leadership Team
            <div className="h-px bg-slate-200 flex-1" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.leadership.map((member, i) => (
              <TeamCard key={i} member={member} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* Operations */}
        <section>
          <h2 className="text-3xl font-bold text-blue-950 mb-12 flex items-center gap-4">
            Operations Team
            <div className="h-px bg-slate-200 flex-1" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.operations.map((member, i) => (
              <TeamCard key={i} member={member} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* Tech & Data */}
        <section>
          <h2 className="text-3xl font-bold text-blue-950 mb-12 flex items-center gap-4">
            Tech & Data Team
            <div className="h-px bg-slate-200 flex-1" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {team.tech.map((member, i) => (
              <TeamCard key={i} member={member} delay={i * 0.1} />
            ))}
          </div>
        </section>
      </div>
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
      <div className="relative mb-6 rounded-[2rem] overflow-hidden aspect-[4/5] bg-slate-100">
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
      <h3 className="text-2xl font-bold text-blue-950 mb-1">{member.name}</h3>
      <p className="text-green-600 font-semibold text-sm mb-4 uppercase tracking-wider">{member.role}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
    </motion.div>
  );
}
