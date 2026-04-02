import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { extractWithGemini, fileToBase64 } from '../lib/gemini-extractor';
import { Loader2, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const sections = [
  { id: 1, title: 'Investor Profile', icon: 'fa-user-tie' },
  { id: 2, title: 'Investment Details', icon: 'fa-hand-holding-dollar' },
  { id: 3, title: 'Container Allocation', icon: 'fa-box-open' },
  { id: 4, title: 'Projected Returns', icon: 'fa-chart-line' },
  { id: 5, title: 'Legal & Compliance', icon: 'fa-file-signature' },
  { id: 6, title: 'Payment Schedule', icon: 'fa-calendar-check' },
  { id: 7, title: 'Review & Submit', icon: 'fa-check-double' },
];

export default function InvestorFlowForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    investorType: 'Individual',
    currency: 'SAR - Saudi Riyal',
    date: new Date().toISOString().split('T')[0]
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < sections.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const existing = JSON.parse(localStorage.getItem('traces_investors') || '[]');
    localStorage.setItem('traces_investors', JSON.stringify([{ ...formData, id: Date.now(), status: 'Active' }, ...existing]));
    navigate('/erp/investors');
  };

  const handleAiScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const base64 = await fileToBase64(file);
      const extracted = await extractWithGemini(base64, file.type, 'investment_contract');
      
      if (extracted) {
        setFormData({
          ...formData,
          name: extracted.investor_name || extracted.name || formData.name,
          amount: extracted.investment_amount || extracted.amount || formData.amount,
          investorType: extracted.investor_type || formData.investorType,
          date: extracted.investment_date || extracted.date || formData.date,
          email: extracted.email || formData.email,
          phone: extracted.phone || formData.phone,
          sourceOfFunds: extracted.source_of_funds || formData.sourceOfFunds
        });
        alert('AI successfully extracted data from the document!');
      }
    } catch (error) {
      console.error("Extraction error:", error);
      setExtractionError("Failed to extract data. Please fill manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">New Investment Flow</h2>
            <p className="text-slate-500">Complete all sections to register a new investment</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#1F4E79]">{Math.round((currentStep / sections.length) * 100)}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</div>
          </div>
        </div>

        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (sections.length - 1)) * 100}%` }}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500"
          ></motion.div>
          
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  currentStep >= section.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                <i className={`fa-solid ${section.icon} text-sm`}></i>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${
                currentStep >= section.id ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {section.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
                      Investor Profile
                    </h3>
                    <div className="relative">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleAiScan}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtracting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        {isExtracting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isExtracting ? 'Scanning...' : 'Scan Contract with AI'}
                      </button>
                    </div>
                  </div>

                  {extractionError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
                      <AlertCircle size={14} />
                      {extractionError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                        placeholder="Enter investor name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investor Type</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700"
                        value={formData.investorType || 'Individual'}
                        onChange={(e) => setFormData({ ...formData, investorType: e.target.value })}
                      >
                        <option>Individual</option>
                        <option>Corporate</option>
                        <option>Institutional</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium" 
                        placeholder="investor@example.com" 
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium" 
                        placeholder="+966 ..." 
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">2</span>
                    Investment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Amount (SAR)</label>
                      <input 
                        type="number" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-lg"
                        placeholder="0.00"
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700">
                        <option>SAR - Saudi Riyal</option>
                        <option>USD - US Dollar</option>
                        <option>AED - UAE Dirham</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Date</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source of Funds</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium" placeholder="Bank Transfer, etc." />
                    </div>
                  </div>
                </div>
              )}

              {currentStep > 2 && currentStep < 7 && (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 text-3xl">
                    <i className={`fa-solid ${sections[currentStep-1].icon}`}></i>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">{sections[currentStep-1].title}</h3>
                    <p className="text-slate-500">This section is under development. Click next to continue.</p>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-8">
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-clipboard-check"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800">Ready to Submit</h4>
                      <p className="text-sm text-green-600">Please review the information before final submission.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investor Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">Name</span>
                          <span className="text-sm font-bold text-slate-800">{formData.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">Amount</span>
                          <span className="text-sm font-bold text-slate-800">SAR {formData.amount || '0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</h4>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                          <i className="fa-solid fa-circle-check"></i>
                          <span>All sections validated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-400 hover:bg-slate-100 transition-colors">
              Save as Draft
            </button>
            {currentStep === 7 ? (
              <button 
                onClick={handleSubmit}
                className="px-12 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
              >
                Submit Investment
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-12 py-3 bg-[#1F4E79] text-white rounded-xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
