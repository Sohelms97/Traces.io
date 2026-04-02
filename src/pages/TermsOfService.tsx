import { motion } from "motion/react";
import { Scale, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <section className="bg-blue-950 py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Scale size={14} />
              Legal Agreement
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold mb-6"
            >
              Terms of <span className="text-green-400">Service</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-200/70"
            >
              Last updated: April 2, 2026. Please read these terms carefully before using our services.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="flex items-center gap-4 mb-12 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <p className="text-amber-900 dark:text-amber-100 font-medium m-0">
                  By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">1. Agreement to Terms</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and TRACES ("we," "us," or "our"), concerning your access to and use of the traces.com website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">2. Intellectual Property Rights</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">3. User Representations</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                By using the Site, you represent and warrant that:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-1" />
                  <span>All registration information you submit will be true, accurate, current, and complete.</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-1" />
                  <span>You will maintain the accuracy of such information and promptly update such registration information as necessary.</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-1" />
                  <span>You have the legal capacity and you agree to comply with these Terms of Service.</span>
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">4. Prohibited Activities</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">5. Limitation of Liability</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">6. Governing Law</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the jurisdiction in which TRACES is headquartered, without regard to its conflict of law principles.
              </p>

              <div className="mt-16 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-4">Need clarification on our Terms?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Our legal team is available to answer your questions.</p>
                <a 
                  href="mailto:legal@traces.com"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Contact Legal Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
