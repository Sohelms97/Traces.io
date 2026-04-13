import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Package, Info, MapPin, Image as ImageIcon, 
  DollarSign, Search, Plus, Trash2, Upload, Link as LinkIcon,
  CheckCircle2, AlertCircle, ChevronRight, Globe, RefreshCw, QrCode
} from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [traceabilityData, setTraceabilityData] = useState<any>(null);
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
    }
  }, [product?.id]);

  const fetchTraceability = async () => {
    try {
      const response = await fetch(`/api/traceability/product/${product.id}`);
      const result = await response.json();
      if (result.success) {
        setTraceabilityData(result.data);
      }
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
      const method = product ? 'PUT' : 'POST';
      const url = product ? `/api/products/${product.id}` : '/api/products';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      // If traceability data exists, save it too
      if (traceabilityData && traceabilityData.id) {
        await fetch(`/api/traceability/${traceabilityData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(traceabilityData)
        });
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
    if (!file || !product?.id) return;

    setSaving(true);
    const formDataUpload = new FormData();
    formDataUpload.append('mainImage', file);

    try {
      const response = await fetch(`/api/products/${product.id}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });
      
      const result = await response.json();
      if (result.success) {
        setFormData({ ...formData, mainImage: result.data.imagePath });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error uploading main image:", error);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !product?.id) return;

    setSaving(true);
    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('gallery', files[i]);
    }

    try {
      const response = await fetch(`/api/products/${product.id}/gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });
      
      const result = await response.json();
      if (result.success) {
        setFormData({ 
          ...formData, 
          galleryImages: [...formData.galleryImages, ...result.data] 
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error uploading gallery images:", error);
      alert(`Error uploading gallery: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteGalleryImage = async (index: number) => {
    if (!product?.id) return;
    
    if (!confirm("Are you sure you want to delete this image?")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}/gallery/${index}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        const updatedGallery = formData.galleryImages.filter((_, i) => i !== index);
        setFormData({ ...formData, galleryImages: updatedGallery });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error deleting gallery image:", error);
      alert(`Error deleting image: ${error.message}`);
    } finally {
      setSaving(false);
    }
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

              {activeTab === 'tracking' && traceabilityData && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">Traceability Status</h4>
                        <p className="text-sm text-blue-700">Manage the 8 stages of this product's journey</p>
                      </div>
                    </div>
                    <select 
                      value={traceabilityData.overallStatus}
                      onChange={(e) => setTraceabilityData({ ...traceabilityData, overallStatus: e.target.value })}
                      className="p-3 bg-white border border-blue-200 rounded-xl font-bold text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="complete">Fully Traced</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {traceabilityData.stages.map((stage: any, idx: number) => (
                      <div key={stage.stageId} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="flex items-center gap-4 min-w-[200px]">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              stage.status === 'complete' ? 'bg-green-100 text-green-600' : 
                              stage.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <h5 className="font-bold text-slate-800">{stage.stageName}</h5>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select 
                              value={stage.status}
                              onChange={(e) => {
                                const newStages = [...traceabilityData.stages];
                                newStages[idx].status = e.target.value;
                                setTraceabilityData({ ...traceabilityData, stages: newStages });
                              }}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="complete">Complete</option>
                            </select>
                            
                            <input 
                              type="text" 
                              placeholder="Public Description..."
                              value={stage.publicDescription || ''}
                              onChange={(e) => {
                                const newStages = [...traceabilityData.stages];
                                newStages[idx].publicDescription = e.target.value;
                                setTraceabilityData({ ...traceabilityData, stages: newStages });
                              }}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            />

                            <div className="flex items-center gap-3 px-3">
                              <span className="text-xs font-bold text-slate-500 uppercase">Visible</span>
                              <label className="relative inline-flex items-center cursor-pointer scale-75">
                                <input 
                                  type="checkbox" 
                                  checked={stage.showOnWebsite}
                                  onChange={(e) => {
                                    const newStages = [...traceabilityData.stages];
                                    newStages[idx].showOnWebsite = e.target.checked;
                                    setTraceabilityData({ ...traceabilityData, stages: newStages });
                                  }}
                                  className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
