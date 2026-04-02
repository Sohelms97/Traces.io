import { motion } from "motion/react";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
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
              <Shield size={14} />
              Data Protection
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold mb-6"
            >
              Privacy <span className="text-green-400">Policy</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-200/70"
            >
              Last updated: April 2, 2026. Your privacy is our top priority. Learn how we protect and manage your data.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="flex items-center gap-4 mb-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Lock size={24} />
                </div>
                <p className="text-blue-900 dark:text-blue-100 font-medium m-0">
                  We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, please contact us at privacy@traces.com.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">1. Information We Collect</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>Personal information provided by you (names, phone numbers, email addresses, etc.)</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>Payment data (processed by our secure third-party payment processors)</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>Social media login data (if you choose to register with us using your social media account)</span>
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">2. How We Use Your Information</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We use the information we collect or receive:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>To facilitate account creation and logon process.</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>To post testimonials with your consent.</span>
                </li>
                <li className="flex gap-3 text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>To request feedback and contact you about your use of our Services.</span>
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">3. Sharing Your Information</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">4. Cookies and Tracking</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
              </p>

              <h2 className="text-2xl font-bold text-blue-950 dark:text-white mt-12 mb-6">5. Data Security</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>

              <div className="mt-16 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-4">Questions about our Privacy Policy?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Our data protection officer is ready to help you with any inquiries.</p>
                <a 
                  href="mailto:privacy@traces.com"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Contact Privacy Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
