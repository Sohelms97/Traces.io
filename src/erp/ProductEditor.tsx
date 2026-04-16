import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Package, Info, MapPin, Image as ImageIcon, 
  DollarSign, Search, Plus, Trash2, Upload, Link as LinkIcon,
  CheckCircle2, AlertCircle, ChevronRight, Globe, RefreshCw, QrCode
} from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { uploadImage } from '../lib/upload';

interface ProductEditorProps {
  product?: any;
  onClose: () => void;
  onSave: () => void;
}

type Tab = 'basic' | 'details' | 'origin' | 'media' | 'pricing' | 'seo' | 'tracking';

export default function ProductEditor({ product, onClose, onSave }: ProductEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: product?.id || "",
    productId: product?.productId || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
    name: product?.name || '',
    arabicName: product?.arabicName || '',
    category: product?.category || 'Seafood',
    subCategory: product?.subCategory || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
    status: product?.status || 'available',
    showOnWebsite: product?.showOnWebsite ?? true,
    featured: product?.featured ?? false,
    displayOrder: product?.displayOrder || 0,
    shortDescription: product?.shortDescription || '',
    fullDescription: product?.fullDescription || '',
    features: product?.features || [],
    specifications: product?.specifications || [{ name: '', value: '' }],
    certifications: product?.certifications || [],
    mainImage: product?.mainImage || '',
    galleryImages: product?.galleryImages || [],
    videoUrl: product?.videoUrl || '',
    unitOfMeasurement: product?.unitOfMeasurement || 'KG',
    avgPurchasePrice: product?.avgPurchasePrice || '',
    avgSellingPrice: product?.avgSellingPrice || '',
    moq: product?.moq || '',
    // Origin & Supplies
    originCountry: product?.originCountry || '',
    originRegion: product?.originRegion || '',
    sourceType: product?.sourceType || 'Wild Caught',
    harvestSeason: product?.harvestSeason || '',
    supplierName: product?.supplierName || '',
    supplierCountry: product?.supplierCountry || '',
    // SEO
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    seoSlug: product?.seoSlug || '',
    seoKeywords: product?.seoKeywords || []
  });

  React.useEffect(() => {
    if (product?.id) {
      fetchTraceability();
    } else {
      // Default stages for new product
      setStages([
        { id: 'harvest', name: 'Harvesting', status: 'Pending', date: new Date().toISOString().split('T')[0], showPublicly: true, order: 0, location: '', party: '', publicDescription: 'Product was harvested from sustainable sources.' },
        { id: 'processing', name: 'Processing', status: 'Pending', date: new Date().toISOString().split('T')[0], showPublicly: true, order: 1, location: '', party: '', publicDescription: 'Quality control and processing at our facility.' },
        { id: 'shipping', name: 'Shipping', status: 'Pending', date: new Date().toISOString().split('T')[0], showPublicly: true, order: 2, location: '', party: '', publicDescription: 'Dispatched for delivery to your location.' }
      ]);
    }
  }, [product?.id]);

  const fetchTraceability = async () => {
    try {
      const q = query(
        collection(db, 'products', product.id, 'traceability'),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      const stageData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setStages(stageData);
    } catch (err) {
      console.error("Error fetching traceability:", err);
    }
  };

  const generatePassport = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const passportUrl = `${window.location.origin}/trace/${formData.id}`;
      const qrDataUrl = await QRCode.toDataURL(passportUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1F4E79',
          light: '#FFFFFF'
        }
      });
      
      // Create a temporary link to download the QR code
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `digital-passport-${formData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating passport:', err);
      alert('Failed to generate digital passport');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const productRef = product?.id ? doc(db, 'products', product.id) : doc(collection(db, 'products'));
      const productId = product?.id || productRef.id;
      
      const productData = {
        ...formData,
        id: productId,
        updatedAt: serverTimestamp(),
        createdAt: product?.createdAt || serverTimestamp(),
      };

      await setDoc(productRef, productData, { merge: true });

      // Save stages to subcollection
      for (const stage of stages) {
        const stageId = stage.id.startsWith('stage-') || ['harvest', 'processing', 'shipping'].includes(stage.id) 
          ? stage.id 
          : `stage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { id, ...stageData } = stage;
        await setDoc(doc(db, 'products', productId, 'traceability', stageId), stageData, { merge: true });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(`Error saving product: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const url = await uploadImage(file, 'products');
      setFormData({ ...formData, mainImage: url });
    } catch (error: any) {
      console.error("Error uploading main image:", error);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const newImages = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], 'products/gallery');
        newImages.push({ url, id: Date.now() + i });
      }
      setFormData({ 
        ...formData, 
        galleryImages: [...formData.galleryImages, ...newImages] 
      });
    } catch (error: any) {
      console.error("Error uploading gallery images:", error);
      alert(`Error uploading gallery: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteGalleryImage = (index: number) => {
    const updatedGallery = formData.galleryImages.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, galleryImages: updatedGallery });
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'details', label: 'Details', icon: Info },
    { id: 'origin', label: 'Origin & Supplier', icon: MapPin },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'tracking', label: 'Tracking Details', icon: MapPin },
    { id: 'seo', label: 'SEO', icon: Search },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-sm text-slate-500">ID: <span className="font-mono font-bold text-blue-600">{formData.id}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 bg-slate-50 px-6 py-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="e.g. Fresh Atlantic Salmon"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arabic Name</label>
                      <input 
                        type="text" 
                        value={formData.arabicName}
                        onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-right"
                        placeholder="اسم المنتج بالعربي"
                        dir="rtl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        >
                          <option value="Seafood">Seafood</option>
                          <option value="Vegetables">Vegetables</option>
                          <option value="Frozen">Frozen</option>
                          <option value="Processed">Processed</option>
                          <option value="Dried">Dried</option>
                          <option value="Live">Live</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-category</label>
                        <input 
                          type="text" 
                          value={formData.subCategory}
                          onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Product Code</label>
                        <input 
                          type="text" 
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode</label>
                        <input 
                          type="text" 
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Show on Website</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.showOnWebsite}
                            onChange={(e) => setFormData({ ...formData, showOnWebsite: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Featured Product</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.featured}
                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                      Short Description (Card View)
                      <span className={`${formData.shortDescription.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                        {formData.shortDescription.length}/150
                      </span>
                    </label>
                    <textarea 
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24"
                      placeholder="Brief summary for product cards..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Description</label>
                    <textarea 
                      value={formData.fullDescription}
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-48"
                      placeholder="Detailed product information..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'origin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" /> Origin Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country of Origin</label>
                        <input 
                          type="text" 
                          value={formData.originCountry}
                          onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="e.g. Greece"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Region / Area</label>
                        <input 
                          type="text" 
                          value={formData.originRegion}
                          onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="e.g. Aegean Sea"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source Type</label>
                        <select 
                          value={formData.sourceType}
                          onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option>Wild Caught</option>
                          <option>Farm Raised</option>
                          <option>Organic</option>
                          <option>Artisanal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Harvest Season</label>
                        <input 
                          type="text" 
                          value={formData.harvestSeason}
                          onChange={(e) => setFormData({ ...formData, harvestSeason: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="e.g. Oct - Mar"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-blue-600" /> Supplier Information
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Supplier</label>
                      <input 
                        type="text" 
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier Country</label>
                      <input 
                        type="text" 
                        value={formData.supplierCountry}
                        onChange={(e) => setFormData({ ...formData, supplierCountry: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" /> Pricing Strategy
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Purchase Price</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="number" 
                            value={formData.avgPurchasePrice}
                            onChange={(e) => setFormData({ ...formData, avgPurchasePrice: e.target.value })}
                            className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Selling Price</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="number" 
                            value={formData.avgSellingPrice}
                            onChange={(e) => setFormData({ ...formData, avgSellingPrice: e.target.value })}
                            className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit of Measurement</label>
                        <select 
                          value={formData.unitOfMeasurement}
                          onChange={(e) => setFormData({ ...formData, unitOfMeasurement: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option>KG</option>
                          <option>Box</option>
                          <option>Crate</option>
                          <option>Piece</option>
                          <option>Ton</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min. Order Qty (MOQ)</label>
                        <input 
                          type="number" 
                          value={formData.moq}
                          onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Digital Passport</h4>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1">Generate a scannable QR code for this product's traceability journey.</p>
                    </div>
                    <button 
                      onClick={generatePassport}
                      className="px-6 py-2.5 bg-[#1F4E79] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-[#163a5a] transition-all"
                    >
                      Download Passport
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Product Image</label>
                      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group">
                        {formData.mainImage ? (
                          <>
                            <img src={formData.mainImage} alt="Main" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <label className="p-3 bg-white text-blue-600 rounded-2xl cursor-pointer hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                                <input type="file" className="hidden" onChange={handleMainImageUpload} accept="image/*" />
                              </label>
                              <button 
                                onClick={() => setFormData({ ...formData, mainImage: '' })}
                                className="p-3 bg-white text-red-600 rounded-2xl hover:scale-110 transition-transform"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-4">
                              <Upload className="w-8 h-8" />
                            </div>
                            <span className="text-sm font-bold text-slate-500">Upload Main Image</span>
                            <span className="text-xs text-slate-400 mt-1">Recommended: 800x600px</span>
                            <input type="file" className="hidden" onChange={handleMainImageUpload} accept="image/*" />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Video URL</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="YouTube or Vimeo URL"
                        />
                      </div>
                      <p className="text-xs text-slate-400 italic">Provide a link to a product showcase or origin video.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gallery Images</label>
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-100 transition-all">
                        <Plus className="w-4 h-4" /> Add Images
                        <input type="file" className="hidden" multiple onChange={handleGalleryUpload} accept="image/*" />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {formData.galleryImages.map((img: any, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
                          <img src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => deleteGalleryImage(idx)}
                              className="p-2 bg-white text-red-600 rounded-xl hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {formData.galleryImages.length === 0 && (
                        <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-sm font-medium">No gallery images added</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tracking' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">Journey Tracking</h4>
                      <p className="text-sm text-slate-500">Define the key stages of this product's journey.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newStage = {
                          id: `stage-${Date.now()}`,
                          name: 'New Stage',
                          status: 'Pending',
                          date: new Date().toISOString().split('T')[0],
                          showPublicly: true,
                          order: stages.length,
                          location: '',
                          party: '',
                          publicDescription: ''
                        };
                        setStages([...stages, newStage]);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Stage
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stages.map((stage, idx) => (
                      <div key={stage.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-blue-600 shadow-sm border border-slate-100">
                              {idx + 1}
                            </div>
                            <input 
                              type="text"
                              value={stage.name}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[idx].name = e.target.value;
                                setStages(newStages);
                              }}
                              className="bg-transparent font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const newStages = stages.filter((_, i) => i !== idx);
                              setStages(newStages);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                            <select 
                              value={stage.status}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[idx].status = e.target.value;
                                setStages(newStages);
                              }}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Complete">Complete</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input 
                              type="date"
                              value={stage.date}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[idx].date = e.target.value;
                                setStages(newStages);
                              }}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
                            <input 
                              type="text"
                              placeholder="e.g. North Sea"
                              value={stage.location || ''}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[idx].location = e.target.value;
                                setStages(newStages);
                              }}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Public Description</label>
                          <textarea 
                            value={stage.publicDescription || ''}
                            onChange={(e) => {
                              const newStages = [...stages];
                              newStages[idx].publicDescription = e.target.value;
                              setStages(newStages);
                            }}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 h-24"
                            placeholder="Describe what happened at this stage..."
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={stage.showPublicly}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[idx].showPublicly = e.target.checked;
                                setStages(newStages);
                              }}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs font-bold text-slate-600">Visible to Customers</span>
                        </div>
                      </div>
                    ))}
                    {stages.length === 0 && (
                      <div className="py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-medium">No tracking stages defined yet.</p>
                        <button 
                          onClick={() => setStages([{ id: 'harvest', name: 'Harvesting', status: 'Pending', date: new Date().toISOString().split('T')[0], showPublicly: true, order: 0, location: '', party: '', publicDescription: '' }])}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Add Default Stages
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'seo' && (
                <div className="space-y-8 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO Title</label>
                    <input 
                      type="text" 
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="e.g. Premium Fresh Salmon | TRACES.IO"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO Description</label>
                    <textarea 
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-32"
                      placeholder="Meta description for search results..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Slug</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/product/</span>
                        <input 
                          type="text" 
                          value={formData.seoSlug}
                          onChange={(e) => setFormData({ ...formData, seoSlug: e.target.value })}
                          className="w-full p-4 pl-20 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords</label>
                      <input 
                        type="text" 
                        value={formData.seoKeywords.join(', ')}
                        onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="salmon, fresh, seafood"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href={`/products/${formData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-sm hover:text-blue-600 transition-all"
            >
              <Globe className="w-4 h-4" /> Preview on Website
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Product
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
