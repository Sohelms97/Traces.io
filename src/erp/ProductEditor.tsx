import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Package, Info, MapPin, Image as ImageIcon, 
  DollarSign, Search, Plus, Trash2, Upload, Link as LinkIcon,
  CheckCircle2, AlertCircle, ChevronRight, Globe, RefreshCw
} from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProductEditorProps {
  product?: any;
  onClose: () => void;
  onSave: () => void;
}

type Tab = 'basic' | 'details' | 'origin' | 'media' | 'pricing' | 'seo';

export default function ProductEditor({ product, onClose, onSave }: ProductEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: product?.id || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
    name: product?.name || '',
    arabicName: product?.arabicName || '',
    category: product?.category || 'Seafood',
    subCategory: product?.subCategory || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
    status: product?.status || 'Available',
    showOnWebsite: product?.showOnWebsite ?? true,
    featured: product?.featured ?? false,
    displayOrder: product?.displayOrder || 0,
    shortDescription: product?.shortDescription || '',
    fullDescription: product?.fullDescription || '',
    features: product?.features || [],
    specifications: product?.specifications || [{ name: '', value: '' }],
    certifications: product?.certifications || [],
    originCountry: product?.originCountry || '',
    originRegion: product?.originRegion || '',
    sourceType: product?.sourceType || 'Wild Caught',
    harvestSeason: product?.harvestSeason || '',
    supplierName: product?.supplierName || '',
    supplierCountry: product?.supplierCountry || '',
    mainImage: product?.mainImage || '',
    gallery: product?.gallery || [],
    videoUrl: product?.videoUrl || '',
    unitOfMeasurement: product?.unitOfMeasurement || 'KG',
    avgPurchasePrice: product?.avgPurchasePrice || '',
    avgSellingPrice: product?.avgSellingPrice || '',
    moq: product?.moq || '',
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
    seoSlug: product?.seoSlug || '',
    seoKeywords: product?.seoKeywords || []
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'products', formData.id), {
        ...formData,
        updatedAt: serverTimestamp(),
        createdAt: product?.createdAt || serverTimestamp()
      });
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(`Error saving product: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        const storageRef = ref(storage, `products/${formData.id}/${field}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        setFormData({ ...formData, [field]: url });
      } catch (error: any) {
        console.error("Error uploading image:", error);
        alert(`Error uploading image: ${error.message}`);
      } finally {
        setSaving(false);
      }
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'details', label: 'Details', icon: Info },
    { id: 'origin', label: 'Origin & Supplier', icon: MapPin },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
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

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Product Image</label>
                    <div className="relative group aspect-square">
                      <div className="w-full h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-300 group-hover:bg-blue-50/30">
                        {formData.mainImage ? (
                          <img src={formData.mainImage} alt="Main Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4">
                              <Upload className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Click to upload main image</p>
                            <p className="text-xs text-slate-300 mt-1">Recommended: 1080x1080px</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'mainImage')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Video (YouTube/Vimeo)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="Paste video URL here..."
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-800">Gallery Images</h4>
                        <p className="text-xs text-blue-600">Add up to 10 additional images for the product gallery.</p>
                      </div>
                      <button className="ml-auto p-2 bg-white text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <Plus className="w-5 h-5" />
                      </button>
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
            <button 
              onClick={() => window.open(`/products/${formData.id}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-sm hover:text-blue-600 transition-all"
            >
              <Globe className="w-4 h-4" /> Preview on Website
            </button>
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
