import { motion } from "motion/react";
import { Cookie, Info, Settings, ShieldCheck } from "lucide-react";

export default function CookiePolicy() {
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
              <Cookie size={14} />
              Browsing Experience
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold mb-6"
            >
              Cookie <span className="text-green-400">Policy</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-200/70"
            >
              Last updated: April 2, 2026. We use cookies to improve your experience on our site.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="flex items-center gap-4 mb-12 p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-green-900 dark:text-green-100 font-medium m-0">
                  This Cookie Policy explains how TRACES uses cookies and similar technologies to recognize you when you visit our website.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">1. What are cookies?</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">2. Why do we use cookies?</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">3. Types of cookies we use</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-blue-950 dark:text-white mb-2">Essential Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-blue-950 dark:text-white mb-2">Performance Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-blue-950 dark:text-white mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-blue-950 dark:text-white mb-2">Advertising Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing.</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">4. How can I control cookies?</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
              </p>

              <div className="mt-16 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-4">Manage your cookie preferences</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">You can change your settings at any time in your browser or through our preference center.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                    Accept All Cookies
                  </button>
                  <button className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                    Reject Non-Essential
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
