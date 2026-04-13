import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  DollarSign, 
  CreditCard, 
  Package, 
  Calendar, 
  Users, 
  FileCheck, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Eye,
  Info
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { initSignaturePad, saveSignature, clearSignature, createTypedSignature } from './utils/signature-pad-handler';
import { generateAgreementPDF, saveAgreement, downloadAgreement, InvestorData } from './utils/agreement-generator';
import { GoogleGenAI } from '@google/genai';

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Investment', icon: DollarSign },
  { id: 3, title: 'Bank Details', icon: CreditCard },
  { id: 4, title: 'Product Link', icon: Package },
  { id: 5, title: 'Schedule', icon: Calendar },
  { id: 6, title: 'Distribution', icon: Users },
  { id: 7, title: 'Witnesses', icon: Users },
  { id: 8, title: 'Review & Sign', icon: FileCheck },
];

const NewInvestorWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [containers, setContainers] = useState<any[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, 'containers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContainers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  // Form State
  const [formData, setFormData] = useState<any>({
    id: `INV-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: '',
    nationality: 'Bangladeshi',
    nidNumber: '',
    passportNumber: '',
    dob: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Dhaka',
    country: 'Bangladesh',
    postalCode: '',
    
    investmentAmount: 0,
    currency: 'AED',
    investmentType: 'Single Product',
    productCategory: 'Seafood',
    tradeCycle: 75,
    durationMonths: 36,
    profitPerCycle: 0,
    totalProfit: 0,
    roiPercent: 0,
    gpSharePercent: 0,
    startDate: new Date().toISOString().split('T')[0],
    
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranch: '',
    routingNumber: '',
    swiftCode: '',
    iban: '',
    accountType: 'Current',
    
    linkedContainers: [],
    distribution: [{ party: 'Investor', relationship: 'Investor', percentage: 100 }],
    
    witness1Name: '',
    witness1NID: '',
    witness1Relationship: '',
    witness2Name: '',
    witness2NID: '',
    witness2Relationship: '',
    
    investorSignature: null,
    witness1Signature: null,
    witness2Signature: null,
    companySignature: createTypedSignature('Tariqul Islam Chowdhory', 'cursive'),
    signDate: new Date().toISOString().split('T')[0],
  });

  // Signature Pads
  const investorPadRef = useRef<any>(null);
  const witness1PadRef = useRef<any>(null);
  const witness2PadRef = useRef<any>(null);

  useEffect(() => {
    let timer: any;
    if (currentStep === 8) {
      timer = setTimeout(() => {
        const pad = initSignaturePad('investor-pad');
        if (pad) investorPadRef.current = pad;
      }, 300);
    }
    if (currentStep === 7) {
      timer = setTimeout(() => {
        const pad1 = initSignaturePad('witness1-pad');
        const pad2 = initSignaturePad('witness2-pad');
        if (pad1) witness1PadRef.current = pad1;
        if (pad2) witness2PadRef.current = pad2;
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Auto-calculations
  useEffect(() => {
    const amount = parseFloat(formData.investmentAmount) || 0;
    const profitPerCycle = parseFloat(formData.profitPerCycle) || 0;
    const cycleDays = parseInt(formData.tradeCycle) || 75;
    const durationMonths = parseInt(formData.durationMonths) || 36;
    
    const totalCycles = Math.floor((durationMonths * 30) / cycleDays);
    const totalProfit = profitPerCycle * totalCycles;
    const roi = amount > 0 ? ((totalProfit / amount) * 100).toFixed(1) : 0;
    
    setFormData(prev => ({
      ...prev,
      totalProfit,
      roiPercent: roi
    }));
  }, [formData.investmentAmount, formData.profitPerCycle, formData.tradeCycle, formData.durationMonths]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full Legal Name is required';
      if (!formData.nidNumber.trim()) newErrors.nidNumber = 'NID Number is required';
      else if (!/^\d{10,17}$/.test(formData.nidNumber.trim())) newErrors.nidNumber = 'Invalid NID format (10-17 digits)';
      
      if (!formData.email.trim()) newErrors.email = 'Email Address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Invalid email format';
      
      if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
      else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone.trim())) newErrors.phone = 'Invalid phone format';
      
      if (!formData.address.trim()) newErrors.address = 'Residential Address is required';
    }

    if (step === 2) {
      if (!formData.investmentAmount || parseFloat(formData.investmentAmount) <= 0) 
        newErrors.investmentAmount = 'Investment Amount must be greater than 0';
      if (formData.profitPerCycle === '' || parseFloat(formData.profitPerCycle) < 0)
        newErrors.profitPerCycle = 'Profit cannot be negative';
    }

    if (step === 3) {
      if (!formData.bankAccountName.trim()) newErrors.bankAccountName = 'Account Holder Name is required';
      if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account Number is required';
      if (!formData.bankName.trim()) newErrors.bankName = 'Bank Name is required';
      if (!formData.bankBranch.trim()) newErrors.bankBranch = 'Branch Name is required';
    }

    if (step === 5) {
      if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    }

    if (step === 6) {
      const total = formData.distribution.reduce((sum: number, d: any) => sum + (parseFloat(d.percentage) || 0), 0);
      if (total !== 100) newErrors.distribution = `Total allocation must be 100% (Current: ${total}%)`;
      
      formData.distribution.forEach((dist: any, index: number) => {
        if (!dist.party.trim()) newErrors[`dist_party_${index}`] = 'Party name is required';
        if (!dist.relationship.trim()) newErrors[`dist_rel_${index}`] = 'Relationship is required';
      });
    }

    if (step === 7) {
      if (!formData.witness1Name.trim()) newErrors.witness1Name = 'Witness 1 Name is required';
      if (!formData.witness1NID.trim()) newErrors.witness1NID = 'Witness 1 NID is required';
      else if (!/^\d{10,17}$/.test(formData.witness1NID.trim())) newErrors.witness1NID = 'Invalid NID format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Capture signatures if on relevant steps
      if (currentStep === 7) {
        const wit1Sig = witness1PadRef.current ? saveSignature(witness1PadRef.current.pad) : null;
        const wit2Sig = witness2PadRef.current ? saveSignature(witness2PadRef.current.pad) : null;
        setFormData(prev => ({
          ...prev,
          witness1Signature: wit1Sig || prev.witness1Signature,
          witness2Signature: wit2Sig || prev.witness2Signature
        }));
      }
      
      if (currentStep < 8) setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinalize = async () => {
    // Check signature in step 8
    const invSigEmpty = investorPadRef.current?.pad.isEmpty();
    if (invSigEmpty) {
      setErrors({ investorSignature: 'Investor signature is required' });
      return;
    }

    setIsFinalizing(true);
    try {
      // Capture signatures
      const invSig = investorPadRef.current ? saveSignature(investorPadRef.current.pad) : null;
      const wit1Sig = witness1PadRef.current ? saveSignature(witness1PadRef.current.pad) : null;
      const wit2Sig = witness2PadRef.current ? saveSignature(witness2PadRef.current.pad) : null;

      const finalData = {
        ...formData,
        investorSignature: invSig || formData.investorSignature,
        witness1Signature: wit1Sig || formData.witness1Signature,
        witness2Signature: wit2Sig || formData.witness2Signature,
        agreementId: `AGR-${Date.now().toString().slice(-4)}-${Math.floor(100000 + Math.random() * 900000)}`,
        agreementDate: new Date().toLocaleDateString('en-GB'),
        commencementDate: formData.startDate,
        products: [{
          productName: formData.productCategory,
          tradeCycle: formData.tradeCycle,
          investment: formData.investmentAmount.toString(),
          profitPerTrade: formData.profitPerCycle.toString(),
          totalProfit: formData.totalProfit.toString(),
          roi: formData.roiPercent.toString(),
          gpShare: formData.gpSharePercent.toString(),
          duration: formData.durationMonths,
          durationUnit: 'months'
        }],
        totalProfit: formData.totalProfit.toString(),
        profitPerTrade: formData.profitPerCycle.toString(),
        tradeCycle: formData.tradeCycle,
        durationMonths: formData.durationMonths.toString(),
        signDate: new Date().toLocaleDateString('en-GB')
      };

      // 1. Save Investor Basic Info
      const investorRef = await addDoc(collection(db, 'investors'), {
        id: finalData.id,
        fullName: finalData.fullName,
        nationality: finalData.nationality,
        nidNumber: finalData.nidNumber,
        email: finalData.email,
        phone: finalData.phone,
        status: 'active',
        createdDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      // 2. Save Investment Details
      const investmentId = `INVT-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
      await addDoc(collection(db, 'investments'), {
        id: investmentId,
        investorId: finalData.id,
        capitalAmount: finalData.investmentAmount,
        currency: finalData.currency,
        tradeCycle: finalData.tradeCycle,
        durationMonths: finalData.durationMonths,
        startDate: finalData.startDate,
        profitPerCycle: finalData.profitPerCycle,
        totalProfit: finalData.totalProfit,
        roiPercent: finalData.roiPercent,
        linkedContainers: finalData.linkedContainers,
        status: 'active',
        createdAt: serverTimestamp()
      });

      // 3. Save Distribution
      const distributionPromises = finalData.distribution.map((dist: any) => {
        return addDoc(collection(db, 'distributions'), {
          id: `DIST-${Math.floor(100000 + Math.random() * 900000)}`,
          investorId: finalData.id,
          investmentId: investmentId,
          party: dist.party,
          relationship: dist.relationship,
          percentage: dist.percentage,
          status: 'active',
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(distributionPromises);

      // 4. Generate Agreement PDF and save to Firestore
      const agreementObj = saveAgreement(finalData);
      
      await addDoc(collection(db, 'agreements'), {
        id: finalData.agreementId,
        investorId: finalData.id,
        investorName: finalData.fullName,
        generatedDate: new Date().toISOString(),
        status: 'signed',
        pdfBase64: agreementObj.pdfBase64, // CRITICAL: Save PDF to Firestore
        investorSignature: finalData.investorSignature,
        companySignature: finalData.companySignature,
        witness1Signature: finalData.witness1Signature,
        witness2Signature: finalData.witness2Signature,
        createdAt: serverTimestamp()
      });

      // 5. Save Payment Schedule
      const totalCycles = Math.floor((finalData.durationMonths * 30) / finalData.tradeCycle);
      const schedulePromises = [];
      for (let i = 1; i <= totalCycles; i++) {
        const dueDate = new Date(finalData.startDate);
        dueDate.setDate(dueDate.getDate() + (i * finalData.tradeCycle));
        schedulePromises.push(addDoc(collection(db, 'payment_schedules'), {
          id: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          investorId: finalData.id,
          cycleNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: finalData.profitPerCycle,
          currency: finalData.currency,
          status: 'upcoming',
          createdAt: serverTimestamp()
        }));
      }
      await Promise.all(schedulePromises);

      // Generate and download PDF
      downloadAgreement(agreementObj);

      alert('Investor successfully onboarded and agreement generated!');
      navigate('/erp/investors');
    } catch (error) {
      console.error("Finalization error:", error);
      alert('Failed to save investor data. Please check console.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handlePreview = () => {
    // Capture current signatures
    const invSig = investorPadRef.current ? saveSignature(investorPadRef.current.pad) : null;
    const wit1Sig = witness1PadRef.current ? saveSignature(witness1PadRef.current.pad) : null;
    const wit2Sig = witness2PadRef.current ? saveSignature(witness2PadRef.current.pad) : null;

    const finalData: InvestorData = {
      ...formData,
      investorSignature: invSig || formData.investorSignature,
      witness1Signature: wit1Sig || formData.witness1Signature,
      witness2Signature: wit2Sig || formData.witness2Signature,
      agreementId: 'PREVIEW-0001',
      agreementDate: new Date().toLocaleDateString('en-GB'),
      commencementDate: formData.startDate,
      products: [{
        productName: formData.productCategory,
        tradeCycle: formData.tradeCycle,
        investment: formData.investmentAmount.toString(),
        profitPerTrade: formData.profitPerCycle.toString(),
        totalProfit: formData.totalProfit.toString(),
        roi: formData.roiPercent.toString(),
        gpShare: formData.gpSharePercent.toString(),
        duration: formData.durationMonths,
        durationUnit: 'months'
      }],
      totalProfit: formData.totalProfit.toString(),
      profitPerTrade: formData.profitPerCycle.toString(),
      tradeCycle: formData.tradeCycle,
      durationMonths: formData.durationMonths.toString(),
      signDate: new Date().toLocaleDateString('en-GB')
    };
    const doc = generateAgreementPDF(finalData);
    setPreviewPdf(doc.output('datauristring'));
    setShowPreview(true);
  };

  const handleAutoFill = () => {
    const mockData = {
      fullName: 'John Doe Investor',
      nationality: 'Emirati',
      nidNumber: '784-1985-1234567-1',
      email: 'john.doe@example.com',
      phone: '+971 50 123 4567',
      address: 'Downtown Dubai, Burj Khalifa District',
      city: 'Dubai',
      country: 'UAE',
      postalCode: '00000',
      investmentAmount: 100000,
      currency: 'AED',
      tradeCycle: 60,
      durationMonths: 24,
      profitPerCycle: 5000,
      investmentType: 'Single Product',
      productCategory: 'Seafood',
      bankAccountName: 'John Doe',
      bankAccountNumber: 'AE1234567890123456789',
      bankName: 'Emirates NBD',
      bankBranch: 'Main Branch',
      routingNumber: 'ENBD001',
      witness1Name: 'Witness One',
      witness1NID: '1234567890',
      witness2Name: 'Witness Two',
      witness2NID: '0987654321',
    };
    setFormData((prev: any) => ({ ...prev, ...mockData }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Investor Onboarding</h1>
          <p className="text-slate-500 text-sm">Follow the steps to register a new investor and generate legal agreement.</p>
        </div>
        <button 
          onClick={handleAutoFill}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Auto Fill Sample Data
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep >= step.id ? 'bg-[#1F4E79] text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${
                  currentStep === step.id ? 'text-[#1F4E79]' : 'text-slate-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                  currentStep > step.id ? 'bg-[#1F4E79]' : 'bg-slate-100'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Legal Name</label>
                    <input 
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`}
                      placeholder="As per NID/Passport"
                    />
                    {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nationality</label>
                    <select 
                      value={formData.nationality}
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                    >
                      <option>Bangladeshi</option>
                      <option>Saudi</option>
                      <option>Emirati</option>
                      <option>Pakistani</option>
                      <option>Vietnamese</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">National ID (NID)</label>
                    <input 
                      type="text"
                      value={formData.nidNumber}
                      onChange={(e) => setFormData({...formData, nidNumber: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.nidNumber ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.nidNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.nidNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Residential Address</label>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24 text-slate-900 font-medium ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Amount</label>
                      <div className="relative">
                        <select 
                          value={formData.currency}
                          onChange={(e) => setFormData({...formData, currency: e.target.value})}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent font-bold text-slate-500 outline-none cursor-pointer"
                        >
                          <option value="AED">AED</option>
                          <option value="USD">USD</option>
                          <option value="SGD">SGD</option>
                          <option value="SAR">SAR</option>
                          <option value="THB">THB</option>
                          <option value="BDT">BDT</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <input 
                          type="number"
                          value={formData.investmentAmount}
                          onChange={(e) => setFormData({...formData, investmentAmount: e.target.value})}
                          className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none pl-20 text-slate-900 font-medium ${errors.investmentAmount ? 'border-red-500' : 'border-slate-200'}`}
                        />
                      </div>
                      {errors.investmentAmount && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.investmentAmount}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trade Cycle (Days)</label>
                        <select 
                          value={formData.tradeCycle}
                          onChange={(e) => setFormData({...formData, tradeCycle: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium"
                        >
                          <option value="30">30 Days</option>
                          <option value="45">45 Days</option>
                          <option value="60">60 Days</option>
                          <option value="75">75 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Months)</label>
                        <select 
                          value={formData.durationMonths}
                          onChange={(e) => setFormData({...formData, durationMonths: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium"
                        >
                          <option value="12">12 Months</option>
                          <option value="24">24 Months</option>
                          <option value="36">36 Months</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profit Per Trade Cycle</label>
                      <input 
                        type="number"
                        value={formData.profitPerCycle}
                        onChange={(e) => setFormData({...formData, profitPerCycle: e.target.value})}
                        className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.profitPerCycle ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.profitPerCycle && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.profitPerCycle}</p>}
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#1F4E79] text-white p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-60">Investment Summary</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs opacity-70">Capital</span>
                        <span className="text-2xl font-bold">{formData.currency} {parseFloat(formData.investmentAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs opacity-70">Total Profit</span>
                        <span className="text-xl font-bold text-emerald-400">+{formData.currency} {formData.totalProfit.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-white/10 my-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] opacity-50 uppercase">ROI</p>
                          <p className="text-lg font-bold">{formData.roiPercent}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-50 uppercase">Cycle</p>
                          <p className="text-lg font-bold">{formData.tradeCycle} Days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Holder Name</label>
                    <input 
                      type="text"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.bankAccountName ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.bankAccountName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankAccountName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
                    <input 
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.bankAccountNumber ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.bankAccountNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankAccountNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
                    <input 
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.bankName ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.bankName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Name</label>
                    <input 
                      type="text"
                      value={formData.bankBranch}
                      onChange={(e) => setFormData({...formData, bankBranch: e.target.value})}
                      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium ${errors.bankBranch ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.bankBranch && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankBranch}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Link to Containers</h3>
                  <p className="text-xs text-slate-500">Select containers where this capital will be allocated.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {containers.map(container => (
                    <div 
                      key={container.id}
                      onClick={() => {
                        const exists = formData.linkedContainers.includes(container.id);
                        if (exists) {
                          setFormData({...formData, linkedContainers: formData.linkedContainers.filter((id: string) => id !== container.id)});
                        } else {
                          setFormData({...formData, linkedContainers: [...formData.linkedContainers, container.id]});
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.linkedContainers.includes(container.id)
                          ? 'border-[#1F4E79] bg-blue-50'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${formData.linkedContainers.includes(container.id) ? 'bg-[#1F4E79] text-white' : 'bg-white text-slate-400'}`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{container.id}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{container.product}</p>
                          </div>
                        </div>
                        {formData.linkedContainers.includes(container.id) && <CheckCircle2 className="w-4 h-4 text-[#1F4E79]" />}
                      </div>
                    </div>
                  ))}
                  {containers.length === 0 && (
                    <div className="col-span-2 p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">No active containers found.</p>
                      <p className="text-xs text-slate-400 mt-1">Please add containers in the Container Management module first.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Payment Schedule</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className={`p-2 bg-slate-50 border rounded-lg text-xs font-bold text-slate-700 outline-none ${errors.startDate ? 'border-red-500' : 'border-slate-200'}`}
                    />
                  </div>
                </div>
                {errors.startDate && <p className="text-red-500 text-[10px] font-bold text-right">{errors.startDate}</p>}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-6 py-3">Cycle</th>
                        <th className="px-6 py-3">Estimated Date</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: Math.min(10, Math.floor((parseInt(formData.durationMonths) * 30) / parseInt(formData.tradeCycle))) }).map((_, i) => {
                        const date = new Date(formData.startDate);
                        date.setDate(date.getDate() + (i + 1) * parseInt(formData.tradeCycle));
                        return (
                          <tr key={i} className="text-xs">
                            <td className="px-6 py-3 font-bold text-slate-700">Cycle {i + 1}</td>
                            <td className="px-6 py-3 text-slate-500">{date.toLocaleDateString()}</td>
                            <td className="px-6 py-3 text-right font-bold text-[#1F4E79]">{formData.currency} {parseFloat(formData.profitPerCycle).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {Math.floor((parseInt(formData.durationMonths) * 30) / parseInt(formData.tradeCycle)) > 10 && (
                    <div className="p-3 bg-white text-center text-[10px] text-slate-400 font-bold uppercase border-t">
                      Showing first 10 cycles of {Math.floor((parseInt(formData.durationMonths) * 30) / parseInt(formData.tradeCycle))} total
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Profit Distribution</h3>
                  <button 
                    onClick={() => setFormData({
                      ...formData, 
                      distribution: [...formData.distribution, { party: '', relationship: '', percentage: 0 }]
                    })}
                    className="flex items-center gap-2 text-[#1F4E79] text-xs font-bold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add Party
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.distribution.map((dist: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <input 
                              type="text"
                              placeholder="Party Name"
                              value={dist.party}
                              onChange={(e) => {
                                const newDist = [...formData.distribution];
                                newDist[index].party = e.target.value;
                                setFormData({...formData, distribution: newDist});
                              }}
                              className={`w-full p-2 bg-white border rounded-xl text-xs text-slate-900 font-medium outline-none ${errors[`dist_party_${index}`] ? 'border-red-500' : 'border-slate-200'}`}
                            />
                            {errors[`dist_party_${index}`] && <p className="text-red-500 text-[9px] font-bold">{errors[`dist_party_${index}`]}</p>}
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="text"
                              placeholder="Relationship"
                              value={dist.relationship}
                              onChange={(e) => {
                                const newDist = [...formData.distribution];
                                newDist[index].relationship = e.target.value;
                                setFormData({...formData, distribution: newDist});
                              }}
                              className={`w-full p-2 bg-white border rounded-xl text-xs text-slate-900 font-medium outline-none ${errors[`dist_rel_${index}`] ? 'border-red-500' : 'border-slate-200'}`}
                            />
                            {errors[`dist_rel_${index}`] && <p className="text-red-500 text-[9px] font-bold">{errors[`dist_rel_${index}`]}</p>}
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              placeholder="Share %"
                              value={dist.percentage}
                              onChange={(e) => {
                                const newDist = [...formData.distribution];
                                newDist[index].percentage = parseFloat(e.target.value);
                                setFormData({...formData, distribution: newDist});
                              }}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium outline-none pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                          </div>
                        </div>
                        {index > 0 && (
                          <button 
                            onClick={() => {
                              const newDist = formData.distribution.filter((_: any, i: number) => i !== index);
                              setFormData({...formData, distribution: newDist});
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Total Allocation</span>
                    <span className={`text-sm font-bold ${formData.distribution.reduce((sum: number, d: any) => sum + (parseFloat(d.percentage) || 0), 0) === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formData.distribution.reduce((sum: number, d: any) => sum + (parseFloat(d.percentage) || 0), 0)}%
                    </span>
                  </div>
                  {errors.distribution && <p className="text-red-500 text-[10px] font-bold text-center">{errors.distribution}</p>}
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Witness 1 (Required)</h4>
                    <div className="space-y-4">
                      <input 
                        type="text"
                        placeholder="Full Name"
                        value={formData.witness1Name}
                        onChange={(e) => setFormData({...formData, witness1Name: e.target.value})}
                        className={`w-full p-3 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium ${errors.witness1Name ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.witness1Name && <p className="text-red-500 text-[10px] font-bold">{errors.witness1Name}</p>}
                      <input 
                        type="text"
                        placeholder="National ID"
                        value={formData.witness1NID}
                        onChange={(e) => setFormData({...formData, witness1NID: e.target.value})}
                        className={`w-full p-3 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium ${errors.witness1NID ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.witness1NID && <p className="text-red-500 text-[10px] font-bold">{errors.witness1NID}</p>}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="p-2 bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">Signature Pad</div>
                        <canvas id="witness1-pad" className="w-full h-32 cursor-crosshair" />
                        <button 
                          onClick={() => witness1PadRef.current?.pad.clear()}
                          className="w-full p-2 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Clear Signature
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Witness 2 (Optional)</h4>
                    <div className="space-y-4">
                      <input 
                        type="text"
                        placeholder="Full Name"
                        value={formData.witness2Name}
                        onChange={(e) => setFormData({...formData, witness2Name: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                      />
                      <input 
                        type="text"
                        placeholder="National ID"
                        value={formData.witness2NID}
                        onChange={(e) => setFormData({...formData, witness2NID: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                      />
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="p-2 bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase">Signature Pad</div>
                        <canvas id="witness2-pad" className="w-full h-32 cursor-crosshair" />
                        <button 
                          onClick={() => witness2PadRef.current?.pad.clear()}
                          className="w-full p-2 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Clear Signature
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Final Review</h4>
                    <p className="text-xs text-blue-700 mt-1">Please review all information before signing. Once signed, the agreement will be generated and the investor will be activated.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Investor Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Name</span>
                          <span className="text-xs font-bold text-slate-800">{formData.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Capital</span>
                          <span className="text-xs font-bold text-slate-800">{formData.currency} {parseFloat(formData.investmentAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">ROI</span>
                          <span className="text-xs font-bold text-emerald-600">{formData.roiPercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Duration</span>
                          <span className="text-xs font-bold text-slate-800">{formData.durationMonths} Months</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investor Digital Signature</label>
                      <div className={`border rounded-2xl overflow-hidden bg-white shadow-inner ${errors.investorSignature ? 'border-red-500' : 'border-slate-200'}`}>
                        <canvas id="investor-pad" className="w-full h-48 cursor-crosshair" />
                        <div className="p-3 bg-slate-50 border-t flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 italic">Sign within the box</span>
                          <button 
                            onClick={() => investorPadRef.current?.pad.clear()}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Clear Pad
                          </button>
                        </div>
                      </div>
                      {errors.investorSignature && <p className="text-red-500 text-[10px] font-bold">{errors.investorSignature}</p>}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Company Representative</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Name</span>
                          <span className="text-xs font-bold text-slate-800">Tariqul Islam Chowdhory</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Title</span>
                          <span className="text-xs font-bold text-slate-800">Founder</span>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-bold uppercase">
                          Company Signature Pre-loaded
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handlePreview}
                      className="w-full p-4 bg-white border-2 border-[#1F4E79] text-[#1F4E79] rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Agreement PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || isFinalizing}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        
        {currentStep < 8 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-[#1F4E79] text-white rounded-xl font-bold text-sm hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinalize}
            disabled={isFinalizing}
            className="flex items-center gap-2 px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
          >
            {isFinalizing ? 'Generating Agreement...' : 'Generate & Finalize'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800">Agreement Preview</h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 bg-slate-200 p-4 overflow-auto">
                {previewPdf && (
                  <iframe 
                    src={previewPdf} 
                    className="w-full h-full rounded-lg shadow-lg bg-white"
                    title="Agreement Preview"
                  />
                )}
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                >
                  Close Preview
                </button>
                <button 
                  onClick={() => {
                    setShowPreview(false);
                    handleFinalize();
                  }}
                  className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700"
                >
                  Looks Good, Finalize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewInvestorWizard;
