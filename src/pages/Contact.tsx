import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Phone, MapPin, Send, Globe, Facebook, Twitter, Linkedin, Instagram, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

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
            Get in <span className="text-green-600">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto"
          >
            Have questions about our products or investment opportunities? Our team is here to help you.
          </motion.p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-3xl font-bold text-blue-950 mb-8">Contact Information</h2>
                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-blue-950 mb-1">Our Office</h4>
                      <p className="text-slate-500">123 Business Bay, Dubai,<br />United Arab Emirates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <Mail size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-blue-950 mb-1">Email Us</h4>
                      <p className="text-slate-500">info@farmersmarket.asia<br />support@farmersmarket.asia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <Phone size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-blue-950 mb-1">Call Us</h4>
                      <p className="text-slate-500">+971 4 123 4567<br />+971 50 987 6543</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-blue-950 mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  {[
                    { icon: <Facebook size={20} />, label: "Facebook" },
                    { icon: <Twitter size={20} />, label: "Twitter" },
                    { icon: <Linkedin size={20} />, label: "Linkedin" },
                    { icon: <Instagram size={20} />, label: "Instagram" }
                  ].map((social, i) => (
                    <a 
                      key={i} 
                      href="#" 
                      className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Map Section */}
              <div className="rounded-[2.5rem] overflow-hidden h-80 bg-slate-100 border border-slate-200 relative shadow-inner">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178650021447!2d55.2721877!3d25.1884736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682829b853e9%3A0x6a534245119f29c8!2sBusiness%20Bay%20-%20Dubai!5e0!3m2!1sen!2sae!4v1711960000000!5m2!1sen!2sae" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Farmers Market Asia Office Location"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-blue-950 mb-4">Message Sent!</h2>
                    <p className="text-slate-600 mb-8">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="text-green-600 font-bold hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    <h2 className="text-3xl font-bold text-blue-950 mb-8">Send a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Name</label>
                          <input 
                            required
                            type="text" 
                            name="name"
                            placeholder="John Doe" 
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                          <input 
                            required
                            type="email" 
                            name="email"
                            placeholder="john@example.com" 
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                        <input 
                          required
                          type="text" 
                          name="subject"
                          placeholder="How can we help?" 
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                        <textarea 
                          required
                          name="message"
                          rows={5} 
                          placeholder="Tell us more about your inquiry..." 
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 transition-all resize-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-600/20"
                      >
                        <Send size={20} />
                        Send Button
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
