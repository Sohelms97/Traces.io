import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { db, storage } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../lib/upload';
import { 
  History, Plus, GripVertical, Trash2, Edit2, CheckCircle2, 
  Clock, AlertCircle, MapPin, Search, Package, ArrowRight,
  ChevronRight, Save, Eye, QrCode, Layout, Info, Camera, FileText, Loader2, X, Upload
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

interface Stage {
  id: string;
  name: string;
  icon: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  date: string;
  completedBy: string;
  publicDescription: string;
  showPublicly: boolean;
  order: number;
  location?: string;
  party?: string;
  documents?: { name: string; url: string }[];
}

export default function TraceabilityEditor({ productId, productName }: { productId: string; productName: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const q = query(
      collection(db, 'products', productId, 'traceability'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stageData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Stage[];
      
      setStages(stageData);
      setLoading(false);
      if (stageData.length > 0 && !activeStage) {
        setActiveStage(stageData[0]);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const handleAddStage = async () => {
    const newStage: Partial<Stage> = {
      name: 'New Stage',
      icon: 'MapPin',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      completedBy: '',
      publicDescription: '',
      showPublicly: true,
      order: stages.length,
      location: '',
      party: '',
      documents: []
    };

    const stageId = `stage-${Date.now()}`;
    await setDoc(doc(db, 'products', productId, 'traceability', stageId), newStage);
  };

  const handleUpdateStage = async (stageId: string, data: Partial<Stage>) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'products', productId, 'traceability', stageId), data, { merge: true });
    } catch (error) {
      console.error("Error updating stage:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = (stageId: string) => {
    setStageToDelete(stageId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStage = async () => {
    if (!stageToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productId, 'traceability', stageToDelete));
      if (activeStage?.id === stageToDelete) {
        setActiveStage(stages.find(s => s.id !== stageToDelete) || null);
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setStageToDelete(null);
    }
  };

  const handleReorder = async (newOrder: Stage[]) => {
    setStages(newOrder);
    // Batch update order in Firestore
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order !== i) {
        await setDoc(doc(db, 'products', productId, 'traceability', newOrder[i].id), { order: i }, { merge: true });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStage) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, `traceability/${productId}/${activeStage.id}`);
      const newDocs = [...(activeStage.documents || []), { name: file.name, url }];
      await handleUpdateStage(activeStage.id, { documents: newDocs });
    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (index: number) => {
    if (!activeStage) return;
    const newDocs = [...(activeStage.documents || [])];
    newDocs.splice(index, 1);
    await handleUpdateStage(activeStage.id, { documents: newDocs });
  };

  if (loading) return <div className="p-8 text-center">Loading timeline...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Traceability Timeline</h2>
            <p className="text-xs text-slate-500">Managing journey for <span className="font-bold text-blue-600">{productName}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${(stages.filter(s => s.status === 'Complete').length / stages.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {stages.filter(s => s.status === 'Complete').length} of {stages.length} Complete
            </span>
          </div>
          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Stage List */}
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-4 flex-1 overflow-y-auto">
            <Reorder.Group axis="y" values={stages} onReorder={handleReorder} className="space-y-2">
              {stages.map((stage) => (
                <Reorder.Item 
                  key={stage.id} 
                  value={stage}
                  className={`relative group p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    activeStage?.id === stage.id 
                      ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' 
                      : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                  onClick={() => setActiveStage(stage)}
                >
                  <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    stage.status === 'Complete' ? 'bg-green-100 text-green-600' :
                    stage.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${activeStage?.id === stage.id ? 'text-blue-600' : 'text-slate-700'}`}>
                      {stage.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        stage.status === 'Complete' ? 'bg-green-500' :
                        stage.status === 'In Progress' ? 'bg-blue-500' :
                        'bg-slate-300'
                      }`} />
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{stage.status}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteStage(stage.id); }}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button 
              onClick={handleAddStage}
              className="w-full mt-4 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Add Custom Stage
            </button>
          </div>
        </div>

        {/* Right Panel: Stage Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <AnimatePresence mode="wait">
            {activeStage ? (
              <motion.div 
                key={activeStage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Edit2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Edit Stage Details</h3>
                      <p className="text-sm text-slate-500">Configure how this stage appears to customers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-saving...</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stage Name</label>
                      <input 
                        type="text" 
                        value={activeStage.name}
                        onChange={(e) => handleUpdateStage(activeStage.id, { name: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                        <input 
                          type="text" 
                          value={activeStage.location || ''}
                          onChange={(e) => handleUpdateStage(activeStage.id, { location: e.target.value })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="e.g. Athens, Greece"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsible Party</label>
                        <input 
                          type="text" 
                          value={activeStage.party || ''}
                          onChange={(e) => handleUpdateStage(activeStage.id, { party: e.target.value })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="e.g. Aegean Fisheries"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select 
                          value={activeStage.status}
                          onChange={(e) => handleUpdateStage(activeStage.id, { status: e.target.value as any })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option value="Complete">Complete</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                        <input 
                          type="date" 
                          value={activeStage.date}
                          onChange={(e) => handleUpdateStage(activeStage.id, { date: e.target.value })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Description (Shown to Customers)</label>
                      <textarea 
                        value={activeStage.publicDescription}
                        onChange={(e) => handleUpdateStage(activeStage.id, { publicDescription: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-32"
                        placeholder="Describe what happened at this stage..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">Public Visibility</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={activeStage.showPublicly}
                            onChange={(e) => handleUpdateStage(activeStage.id, { showPublicly: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        When enabled, this stage and its public description will be visible on the product's traceability page.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5" /> Media & Documents
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="relative">
                          <button 
                            disabled={uploading}
                            className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-100 transition-all group"
                          >
                            {uploading ? (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                            )}
                            <span className="text-[10px] font-bold text-slate-500">
                              {uploading ? 'Uploading...' : 'Upload Document or Photo'}
                            </span>
                          </button>
                          <input 
                            type="file" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                        </div>

                        {/* Document List */}
                        <div className="space-y-2">
                          {activeStage.documents?.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-xs font-medium text-slate-700 truncate">{doc.name}</span>
                              </div>
                              <button 
                                onClick={() => removeDocument(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Layout className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Select a stage to edit its details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteStage}
        title="Delete Stage"
        message="Are you sure you want to delete this stage? This action cannot be undone."
        confirmText="Delete Stage"
        type="danger"
      />
    </div>
  );
}
