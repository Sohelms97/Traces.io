import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { uploadImage } from '../lib/upload';
import { Globe, Home, Users, Package, Info, BarChart3, Handshake, MessageSquare, HelpCircle, Phone, Share2, Megaphone, Image as ImageIcon, Search, Settings as SettingsIcon, Save, ExternalLink, RefreshCw, Clock, User, Plus, Trash2, Edit, Check, X, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Loader2, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

// CMS Tab Types
type CMSTab = 'homepage' | 'team' | 'about' | 'stats' | 'partners' | 'testimonials' | 'faqs' | 'contact' | 'social' | 'announcements' | 'gallery' | 'media' | 'seo' | 'site';

export default function WebsiteManager() {
  const [activeTab, setActiveTab] = useState<CMSTab>('homepage');
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cmsData, setCmsData] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cms'), (snapshot) => {
      const data: any = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().data;
      });
      setCmsData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (section: string, data: any) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'cms', section), {
        data,
        updatedAt: serverTimestamp(),
        updatedBy: user?.displayName || user?.email
      });
      
      // Also sync to localStorage for the "bridge" feel as requested
      localStorage.setItem(`traces_cms_${section}`, JSON.stringify(data));
      
      // alert('✅ Website updated successfully');
      console.log('✅ Website updated successfully');
    } catch (error: any) {
      console.error("Error saving CMS data:", error);
      // alert(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: CMSTab; label: string; icon: any }[] = [
    { id: 'homepage', label: 'Homepage', icon: Home },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'partners', label: 'Partners', icon: Handshake },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'media', label: 'Media Library', icon: Upload },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'site', label: 'Site Settings', icon: SettingsIcon },
  ];

  const handlePublishAll = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'cms', 'site_meta'), {
        data: {
          lastPublished: serverTimestamp(),
          publishedBy: user?.displayName || user?.email,
          status: 'live'
        }
      });
      // alert('🚀 Website published successfully! All changes are now live.');
      console.log('🚀 Website published successfully! All changes are now live.');
    } catch (error: any) {
      console.error("Error publishing website:", error);
      // alert(`Publishing failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Website Manager</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last updated: {lastUpdated?.toDate().toLocaleString() || 'Never'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" /> By: Admin
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Live Preview
          </a>
          <button 
            onClick={handlePublishAll}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            Publish All Changes
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {activeTab === 'homepage' && <HomepageEditor data={cmsData.homepage || {}} onSave={(data) => handleSave('homepage', data)} saving={saving} />}
            {activeTab === 'team' && <TeamManager data={cmsData.team || []} onSave={(data) => handleSave('team', data)} saving={saving} />}
            {activeTab === 'about' && <AboutManager data={cmsData.about || {}} onSave={(data) => handleSave('about', data)} saving={saving} />}
            {activeTab === 'stats' && <StatsManager data={cmsData.stats || []} onSave={(data) => handleSave('stats', data)} saving={saving} />}
            {activeTab === 'partners' && <PartnersManager data={cmsData.partners || []} onSave={(data) => handleSave('partners', data)} saving={saving} />}
            {activeTab === 'testimonials' && <TestimonialsManager data={cmsData.testimonials || []} onSave={(data) => handleSave('testimonials', data)} saving={saving} />}
            {activeTab === 'faqs' && <FAQsManager data={cmsData.faqs || []} onSave={(data) => handleSave('faqs', data)} saving={saving} />}
            {activeTab === 'contact' && <ContactManager data={cmsData.contact || {}} onSave={(data) => handleSave('contact', data)} saving={saving} />}
            {activeTab === 'social' && <SocialManager data={cmsData.social || []} onSave={(data) => handleSave('social', data)} saving={saving} />}
            {activeTab === 'announcements' && <AnnouncementsManager data={cmsData.announcements || []} onSave={(data) => handleSave('announcements', data)} saving={saving} />}
            {activeTab === 'gallery' && <GalleryManager data={cmsData.gallery || []} onSave={(data) => handleSave('gallery', data)} saving={saving} />}
            {activeTab === 'media' && <MediaLibrary />}
            {activeTab === 'seo' && <SEOManager data={cmsData.seo || {}} onSave={(data) => handleSave('seo', data)} saving={saving} />}
            {activeTab === 'site' && <SiteSettingsManager data={cmsData.site || {}} onSave={(data) => handleSave('site', data)} saving={saving} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function HomepageEditor({ data, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    title: data.title || "Transparency You Can Trust",
    subtitle: data.subtitle || "Tracing every product from source to your table",
    bgType: data.bgType || 'image',
    image: data.image || '',
    cta1Text: data.cta1Text || "Explore Products",
    cta1Link: data.cta1Link || "/products",
    cta2Text: data.cta2Text || "Meet Our Team",
    cta2Link: data.cta2Link || "/team",
    showHero: data.showHero !== false
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'hero');
        setFormData({ ...formData, image: url });
      } catch (error) {
        console.error("Error uploading image:", error);
        console.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Hero Section Editor</h2>
        <button 
          onClick={() => onSave(formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hero Headline</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hero Subheadline</label>
            <textarea 
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CTA 1 Text</label>
              <input 
                type="text" 
                value={formData.cta1Text}
                onChange={(e) => setFormData({ ...formData, cta1Text: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CTA 1 Link</label>
              <input 
                type="text" 
                value={formData.cta1Link}
                onChange={(e) => setFormData({ ...formData, cta1Link: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Background Image</label>
            <div className="relative group">
              <div className="w-full h-48 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt="Hero Preview" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Click to upload or drag & drop</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-700">Show Hero Section</p>
              <p className="text-xs text-slate-500">Toggle visibility on public website</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.showHero}
                onChange={(e) => setFormData({ ...formData, showHero: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamManager({ data, onSave, saving }: any) {
  const [members, setMembers] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (editingMember) {
      setCurrentPhoto(editingMember.image || null);
    } else {
      setCurrentPhoto(null);
    }
  }, [editingMember]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'team');
        setCurrentPhoto(url);
      } catch (error: any) {
        console.error("Error uploading photo:", error);
        alert(`Failed to upload photo: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSaveMember = (member: any) => {
    const memberWithPhoto = { ...member, image: currentPhoto };
    let newMembers;
    if (editingMember) {
      newMembers = members.map(m => m.id === editingMember.id ? memberWithPhoto : m);
    } else {
      newMembers = [...members, { ...memberWithPhoto, id: Date.now().toString() }];
    }
    setMembers(newMembers);
    onSave(newMembers);
    setIsModalOpen(false);
    setEditingMember(null);
    setCurrentPhoto(null);
  };

  const sortedMembers = [...members].sort((a, b) => {
    const isALeader = a.department === 'Leadership';
    const isBLeader = b.department === 'Leadership';
    if (isALeader && !isBLeader) return -1;
    if (!isALeader && isBLeader) return 1;
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Team Members</h2>
        <button 
          onClick={() => {
            setEditingMember(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMembers.map((member) => (
          <div key={member.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4 group">
            <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
              {member.image ? (
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
              <p className="text-xs text-slate-500 truncate">{member.role}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase">
                {member.department}
              </span>
            </div>
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => {
                  setEditingMember(member);
                  setIsModalOpen(true);
                }}
                className="p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-100"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => {
                  const newMembers = members.filter(m => m.id !== member.id);
                  setMembers(newMembers);
                  onSave(newMembers);
                }}
                className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-lg shadow-sm border border-slate-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : uploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Member Photo</h4>
                  <p className="text-xs text-slate-500">Click to upload professional headshot</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={editingMember?.name}
                    id="member-name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Job Title</label>
                  <input 
                    type="text" 
                    defaultValue={editingMember?.role}
                    id="member-role"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                  <select 
                    id="member-dept"
                    defaultValue={editingMember?.department || 'Operations'}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>Leadership</option>
                    <option>Operations</option>
                    <option>Technology</option>
                    <option>Logistics</option>
                    <option>Sales & Marketing</option>
                    <option>Finance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Display Order</label>
                  <input 
                    type="number" 
                    defaultValue={editingMember?.displayOrder || 0}
                    id="member-order"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">LinkedIn</label>
                  <input type="text" id="member-linkedin" defaultValue={editingMember?.linkedin} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="URL" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Twitter / X</label>
                  <input type="text" id="member-twitter" defaultValue={editingMember?.twitter} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="URL" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" id="member-email" defaultValue={editingMember?.email} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Email" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Expertise (comma separated)</label>
                <input 
                  type="text" 
                  id="member-expertise"
                  defaultValue={editingMember?.expertise?.join(', ')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Logistics, Supply Chain, AI"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Bio</label>
                <textarea 
                  id="member-bio"
                  defaultValue={editingMember?.bio}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 h-24"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-slate-600 font-bold text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const name = (document.getElementById('member-name') as HTMLInputElement).value;
                  const role = (document.getElementById('member-role') as HTMLInputElement).value;
                  const department = (document.getElementById('member-dept') as HTMLSelectElement).value;
                  const displayOrder = parseInt((document.getElementById('member-order') as HTMLInputElement).value) || 0;
                  const linkedin = (document.getElementById('member-linkedin') as HTMLInputElement).value;
                  const twitter = (document.getElementById('member-twitter') as HTMLInputElement).value;
                  const email = (document.getElementById('member-email') as HTMLInputElement).value;
                  const expertise = (document.getElementById('member-expertise') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean);
                  const bio = (document.getElementById('member-bio') as HTMLTextAreaElement).value;
                  handleSaveMember({ ...editingMember, name, role, department, displayOrder, linkedin, twitter, email, expertise, bio });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save Member
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AboutManager({ data, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    title: data.title || "Our Story",
    content: data.content || "TRACES.IO was founded with a simple mission...",
    mission: data.mission || "To provide complete transparency in the global supply chain.",
    vision: data.vision || "A world where every consumer knows the origin of their products.",
    values: data.values || ["Transparency", "Sustainability", "Innovation"]
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">About Us Content</h2>
        <button 
          onClick={() => onSave(formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Main Content</label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-48"
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Our Mission</label>
            <textarea 
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Our Vision</label>
            <textarea 
              value={formData.vision}
              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsManager({ data, onSave, saving }: any) {
  const [stats, setStats] = useState<any[]>(data.length ? data : [
    { id: '1', label: 'Products Traced', value: '1M+', icon: 'Package' },
    { id: '2', label: 'Countries Reached', value: '45+', icon: 'Globe' },
    { id: '3', label: 'Happy Partners', value: '500+', icon: 'Users' }
  ]);

  const handleUpdateStat = (id: string, field: string, value: string) => {
    const newStats = stats.map(s => s.id === id ? { ...s, [field]: value } : s);
    setStats(newStats);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Website Statistics</h2>
        <button 
          onClick={() => onSave(stats)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={stat.label}
                onChange={(e) => handleUpdateStat(stat.id, 'label', e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none w-full"
              />
            </div>
            <input 
              type="text" 
              value={stat.value}
              onChange={(e) => handleUpdateStat(stat.id, 'value', e.target.value)}
              className="text-3xl font-black text-blue-950 bg-transparent outline-none w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnersManager({ data, onSave, saving }: any) {
  const [partners, setPartners] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  useEffect(() => {
    if (editingPartner) {
      setCurrentLogo(editingPartner.logo || null);
    } else {
      setCurrentLogo(null);
    }
  }, [editingPartner]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'partners');
        setCurrentLogo(url);
      } catch (error) {
        console.error("Error uploading logo:", error);
        alert("Failed to upload logo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSavePartner = (partner: any) => {
    const partnerWithLogo = { ...partner, logo: currentLogo };
    let newPartners;
    if (editingPartner) {
      newPartners = partners.map(p => p.id === editingPartner.id ? partnerWithLogo : p);
    } else {
      newPartners = [...partners, { ...partnerWithLogo, id: Date.now().toString() }];
    }
    setPartners(newPartners);
    onSave(newPartners);
    setIsModalOpen(false);
    setEditingPartner(null);
    setCurrentLogo(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Partners & Clients</h2>
        <button 
          onClick={() => {
            setEditingPartner(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {partners.map((partner) => (
          <div key={partner.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 group relative">
            <div className="w-full aspect-video bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden p-4">
              {partner.logo ? (
                <img src={partner.logo} alt={partner.name} className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
              ) : (
                <Handshake className="w-8 h-8 text-slate-200" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-600 truncate w-full text-center">{partner.name}</p>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => {
                  setEditingPartner(partner);
                  setIsModalOpen(true);
                }}
                className="p-1 bg-white text-slate-400 hover:text-blue-600 rounded shadow-sm border border-slate-100"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button 
                onClick={() => {
                  const newPartners = partners.filter(p => p.id !== partner.id);
                  setPartners(newPartners);
                  onSave(newPartners);
                }}
                className="p-1 bg-white text-slate-400 hover:text-red-600 rounded shadow-sm border border-slate-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingPartner ? 'Edit Partner' : 'Add Partner'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-4">
                    {currentLogo ? (
                      <img src={currentLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : uploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Partner Logo</h4>
                  <p className="text-xs text-slate-500">Click to upload brand logo</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Partner Name</label>
                <input 
                  type="text" 
                  defaultValue={editingPartner?.name}
                  id="partner-name"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Website URL</label>
                <input 
                  type="text" 
                  defaultValue={editingPartner?.url}
                  id="partner-url"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const name = (document.getElementById('partner-name') as HTMLInputElement).value;
                  const url = (document.getElementById('partner-url') as HTMLInputElement).value;
                  handleSavePartner({ ...editingPartner, name, url });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save Partner
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TestimonialsManager({ data, onSave, saving }: any) {
  const [testimonials, setTestimonials] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (editingTestimonial) {
      setCurrentPhoto(editingTestimonial.photo || null);
    } else {
      setCurrentPhoto(null);
    }
  }, [editingTestimonial]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'testimonials');
        setCurrentPhoto(url);
      } catch (error) {
        console.error("Error uploading photo:", error);
        alert("Failed to upload photo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSaveTestimonial = (testimonial: any) => {
    const testimonialWithPhoto = { ...testimonial, photo: currentPhoto };
    let newTestimonials;
    if (editingTestimonial) {
      newTestimonials = testimonials.map(t => t.id === editingTestimonial.id ? testimonialWithPhoto : t);
    } else {
      newTestimonials = [...testimonials, { ...testimonialWithPhoto, id: Date.now().toString() }];
    }
    setTestimonials(newTestimonials);
    onSave(newTestimonials);
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setCurrentPhoto(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Testimonials</h2>
        <button 
          onClick={() => {
            setEditingTestimonial(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 group relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full border border-slate-200 overflow-hidden">
                {t.photo ? <img src={t.photo} alt={t.author} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-300" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{t.author}</h4>
                <p className="text-xs text-slate-500">{t.role} at {t.company}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 italic">"{t.content}"</p>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingTestimonial(t); setIsModalOpen(true); }} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { const newList = testimonials.filter(item => item.id !== t.id); setTestimonials(newList); onSave(newList); }} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : uploading ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Author Photo</h4>
                  <p className="text-xs text-slate-500">Click to upload avatar</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Author Name</label>
                  <input type="text" defaultValue={editingTestimonial?.author} id="t-author" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role / Company</label>
                  <input type="text" defaultValue={editingTestimonial?.role} id="t-role" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Testimonial Content</label>
                <textarea id="t-content" defaultValue={editingTestimonial?.content} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-32" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const author = (document.getElementById('t-author') as HTMLInputElement).value;
                  const role = (document.getElementById('t-role') as HTMLInputElement).value;
                  const content = (document.getElementById('t-content') as HTMLTextAreaElement).value;
                  handleSaveTestimonial({ ...editingTestimonial, author, role, content });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save Testimonial
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function FAQsManager({ data, onSave, saving }: any) {
  const [faqs, setFaqs] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  const handleSaveFaq = (faq: any) => {
    let newFaqs;
    if (editingFaq) {
      newFaqs = faqs.map(f => f.id === editingFaq.id ? faq : f);
    } else {
      newFaqs = [...faqs, { ...faq, id: Date.now().toString() }];
    }
    setFaqs(newFaqs);
    onSave(newFaqs);
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Frequently Asked Questions</h2>
        <button onClick={() => { setEditingFaq(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-start justify-between group">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">{faq.question}</h4>
              <p className="text-sm text-slate-500">{faq.answer}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingFaq(faq); setIsModalOpen(true); }} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { const newList = faqs.filter(item => item.id !== faq.id); setFaqs(newList); onSave(newList); }} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Question</label>
                <input type="text" defaultValue={editingFaq?.question} id="faq-q" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Answer</label>
                <textarea id="faq-a" defaultValue={editingFaq?.answer} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-32" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const question = (document.getElementById('faq-q') as HTMLInputElement).value;
                  const answer = (document.getElementById('faq-a') as HTMLTextAreaElement).value;
                  handleSaveFaq({ ...editingFaq, question, answer });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save FAQ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ContactManager({ data, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    email: data.email || "info@traces.io",
    phone: data.phone || "+1 (555) 123-4567",
    address: data.address || "123 Supply Chain Way, Logistics City, LC 54321",
    mapUrl: data.mapUrl || "",
    workingHours: data.workingHours || "Mon - Fri: 9:00 AM - 6:00 PM"
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Contact Information</h2>
        <button onClick={() => onSave(formData)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Contact Info
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Hours</label>
            <input type="text" value={formData.workingHours} onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialManager({ data, onSave, saving }: any) {
  const [links, setLinks] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);

  const handleSaveLink = (link: any) => {
    let newLinks;
    if (editingLink) {
      newLinks = links.map(l => l.id === editingLink.id ? link : l);
    } else {
      newLinks = [...links, { ...link, id: Date.now().toString() }];
    }
    setLinks(newLinks);
    onSave(newLinks);
    setIsModalOpen(false);
    setEditingLink(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Social Media Links</h2>
        <button onClick={() => { setEditingLink(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" /> Add Social Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{link.platform}</h4>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">{link.url}</p>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingLink(link); setIsModalOpen(true); }} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { const newList = links.filter(item => item.id !== link.id); setLinks(newList); onSave(newList); }} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingLink ? 'Edit Social Link' : 'Add Social Link'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                <select id="s-platform" defaultValue={editingLink?.platform || 'LinkedIn'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  <option>LinkedIn</option>
                  <option>Twitter / X</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>YouTube</option>
                  <option>GitHub</option>
                  <option>TikTok</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Profile URL</label>
                <input type="text" defaultValue={editingLink?.url} id="s-url" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const platform = (document.getElementById('s-platform') as HTMLSelectElement).value;
                  const url = (document.getElementById('s-url') as HTMLInputElement).value;
                  handleSaveLink({ ...editingLink, platform, url });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AnnouncementsManager({ data, onSave, saving }: any) {
  const [announcements, setAnnouncements] = useState<any[]>(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  const handleSaveAnnouncement = (announcement: any) => {
    let newAnnouncements;
    if (editingAnnouncement) {
      newAnnouncements = announcements.map(a => a.id === editingAnnouncement.id ? announcement : a);
    } else {
      newAnnouncements = [...announcements, { ...announcement, id: Date.now().toString(), date: new Date().toISOString() }];
    }
    setAnnouncements(newAnnouncements);
    onSave(newAnnouncements);
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Announcements & News</h2>
        <button onClick={() => { setEditingAnnouncement(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" /> Create Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-start justify-between group">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.type === 'Important' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {a.type}
                </span>
                <span className="text-xs text-slate-400 font-medium">{new Date(a.date).toLocaleDateString()}</span>
              </div>
              <h4 className="font-bold text-slate-800">{a.title}</h4>
              <p className="text-sm text-slate-500">{a.content}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => { setEditingAnnouncement(a); setIsModalOpen(true); }} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { const newList = announcements.filter(item => item.id !== a.id); setAnnouncements(newList); onSave(newList); }} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                  <input type="text" defaultValue={editingAnnouncement?.title} id="a-title" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                  <select id="a-type" defaultValue={editingAnnouncement?.type || 'General'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option>General</option>
                    <option>Important</option>
                    <option>Product Update</option>
                    <option>Event</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Content</label>
                <textarea id="a-content" defaultValue={editingAnnouncement?.content} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-32" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const title = (document.getElementById('a-title') as HTMLInputElement).value;
                  const type = (document.getElementById('a-type') as HTMLSelectElement).value;
                  const content = (document.getElementById('a-content') as HTMLTextAreaElement).value;
                  handleSaveAnnouncement({ ...editingAnnouncement, title, type, content });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Save Announcement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MediaLibrary() {
  const [uploading, setUploading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTestResult(null);
    try {
      const url = await uploadImage(file, 'test_uploads');
      setTestResult({ success: true, message: `Upload successful! URL: ${url}` });
    } catch (error: any) {
      console.error("Test upload failed:", error);
      setTestResult({ success: false, message: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">Storage Connectivity Test</h3>
            <p className="text-sm text-blue-600">Use this tool to verify if your Firebase Storage is correctly configured.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative inline-block">
            <button 
              disabled={uploading}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {uploading ? 'Testing Upload...' : 'Test Image Upload'}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleTestUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>

          {testResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${testResult.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <div className="space-y-1">
                  <p className="font-bold text-sm">{testResult.success ? 'Success' : 'Error'}</p>
                  <p className="text-xs break-all">{testResult.message}</p>
                  {!testResult.success && (
                    <div className="mt-2 text-[10px] opacity-80">
                      <p className="font-bold uppercase">Troubleshooting:</p>
                      <ul className="list-disc ml-4 mt-1 space-y-1">
                        <li>Ensure Firebase Storage is enabled in your Firebase Console.</li>
                        <li>Check if Storage Rules allow writes for authenticated users.</li>
                        <li>Verify your internet connection.</li>
                        <li>Check the browser console for more detailed error logs.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2">Storage Limits</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Individual files are limited to 5MB. Supported formats: JPG, PNG, WEBP, GIF.
          </p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2">Public Access</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            All uploaded media is publicly accessible via its download URL for use on the website.
          </p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2">Organization</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Files are automatically organized into folders (homepage, team, gallery, etc.) based on where they are uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}

function GalleryManager({ data, onSave, saving }: any) {
  const [images, setImages] = useState<any[]>(data);
  const [uploading, setUploading] = useState(false);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'gallery');
        const newImages = [...images, { id: Date.now().toString(), url, caption: file.name }];
        setImages(newImages);
        onSave(newImages);
      } catch (error) {
        console.error("Error uploading gallery image:", error);
        alert("Failed to upload image.");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Media Gallery</h2>
        <div className="relative">
          <button 
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          {!uploading && <input type="file" accept="image/*" onChange={handleAddImage} className="absolute inset-0 opacity-0 cursor-pointer" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
              <button onClick={() => { const newList = images.filter(i => i.id !== img.id); setImages(newList); onSave(newList); }} className="p-2 bg-white/20 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SEOManager({ data, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    title: data.title || "TRACES.IO - Global Supply Chain Traceability",
    description: data.description || "The world's most transparent supply chain platform.",
    keywords: data.keywords || "traceability, supply chain, transparency, logistics",
    ogImage: data.ogImage || ""
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">SEO & Meta Settings</h2>
        <button onClick={() => onSave(formData)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save SEO Settings
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Title</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          <p className="text-[10px] text-slate-400">Recommended: 50-60 characters</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-32" />
          <p className="text-[10px] text-slate-400">Recommended: 150-160 characters</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords (comma separated)</label>
          <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
        </div>
      </div>
    </div>
  );
}

function SiteSettingsManager({ data, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    siteTitle: data.siteTitle || "TRACES.IO",
    tagline: data.tagline || "Transparency You Can Trust",
    siteLogo: data.siteLogo || "",
    primaryColor: data.primaryColor || "#2563eb",
    maintenanceMode: data.maintenanceMode || false,
    enableRegistration: data.enableRegistration || true
  });

  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadImage(file, 'site');
        setFormData({ ...formData, siteLogo: url });
      } catch (error) {
        console.error("Error uploading logo:", error);
        alert("Failed to upload logo.");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">General Site Settings</h2>
        <button onClick={() => onSave(formData)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Logo</label>
            <div className="relative group">
              <div className="w-full h-32 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden p-4">
                {formData.siteLogo ? (
                  <img src={formData.siteLogo} alt="Site Logo" className="max-w-full max-h-full object-contain" />
                ) : uploading ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Click to upload logo</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Name</label>
            <input type="text" value={formData.siteTitle} onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Tagline</label>
            <input type="text" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-700">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Disable public access to the site</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.maintenanceMode} onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-700">User Registration</p>
              <p className="text-xs text-slate-500">Allow new users to sign up</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.enableRegistration} onChange={(e) => setFormData({ ...formData, enableRegistration: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
