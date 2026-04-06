import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { roleLabels, roleDescriptions } from '../lib/permissions';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'system' | 'integrations' | 'user_profile'>('profile');
  const { user, isAdmin, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'view_only' as UserRole });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('traces_api_key') || process.env.GEMINI_API_KEY || '');
  const [aiModel, setAiModel] = useState(localStorage.getItem('traces_ai_model') || 'gemini-3-flash-preview');
  const [confidenceThreshold, setConfidenceThreshold] = useState(Number(localStorage.getItem('traces_confidence_threshold')) || 0.7);
  const [autoDetect, setAutoDetect] = useState(localStorage.getItem('traces_auto_detect') === 'true');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [extractionStats, setExtractionStats] = useState<Record<string, number>>(JSON.parse(localStorage.getItem('traces_extraction_stats') || '{}'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const userData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().displayName || 'Unknown',
        email: doc.data().email,
        role: doc.data().role as UserRole,
        status: 'Active' // Default status
      }));
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSaveIntegration = () => {
    localStorage.setItem('traces_api_key', apiKey);
    localStorage.setItem('traces_ai_model', aiModel);
    localStorage.setItem('traces_confidence_threshold', confidenceThreshold.toString());
    localStorage.setItem('traces_auto_detect', autoDetect.toString());
    alert('Integration settings saved successfully!');
  };

  const testConnection = async () => {
    setIsTestingKey(true);
    try {
      const currentKey = apiKey || process.env.GEMINI_API_KEY;
      if (!currentKey) {
        throw new Error('No API key provided. Please enter a key or configure it in environment variables.');
      }
      
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: currentKey });
      const response = await ai.models.generateContent({
        model: aiModel,
        contents: [{ parts: [{ text: "Hello, respond with 'Connection successful' if you can read this." }] }]
      });
      
      if (response.text) {
        alert("Gemini Connection successful!");
      } else {
        alert("Connection failed: No response from AI.");
      }
    } catch (error: any) {
      console.error("Test Connection Error:", error);
      alert(`Connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      fetchUsers();
      setIsEditUserModalOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name) return;
    
    setIsAddingUser(true);
    try {
      // Create a document with the email as the ID
      // This will be "claimed" by the user when they first sign in
      await setDoc(doc(db, 'users', newUser.email), {
        uid: '', // Placeholder until they sign in
        email: newUser.email,
        displayName: newUser.name,
        role: newUser.role,
        status: 'Pending',
        photoURL: null,
        createdAt: serverTimestamp()
      });
      
      alert(`User ${newUser.name} added successfully with role ${roleLabels[newUser.role]}. They can now sign in with their email.`);
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', role: 'view_only' });
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(`Error adding user: ${error.message}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  const seedDemoData = async () => {
    if (!window.confirm('This will seed demo data for containers, sales, and purchases. Continue?')) return;
    
    setIsSeeding(true);
    try {
      // Seed Containers
      const containers = [
        { id: 'CONT-001', supplier: 'Global Fruits Ltd', product: 'Fresh Mangoes', origin: 'India', qty: '1200 Boxes', purchaseValue: '45000', totalCost: '52000', saleQty: '1150', totalSales: '85000', gp: '33000', roi: '63.4', status: 'Open', month: 'April', createdAt: serverTimestamp() },
        { id: 'CONT-002', supplier: 'EuroVeg S.A.', product: 'Bell Peppers', origin: 'Spain', qty: '800 Boxes', purchaseValue: '32000', totalCost: '38000', saleQty: '800', totalSales: '55000', gp: '17000', roi: '44.7', status: 'Closed', month: 'March', createdAt: serverTimestamp() },
      ];

      for (const item of containers) {
        await setDoc(doc(db, 'containers', item.id), item);
      }

      // Seed Sales
      const sales = [
        { id: 'SO-1001', customer: 'Lulu Hypermarket', product: 'Fresh Mangoes', container: 'CONT-001', qty: '200', price: '75', total: '15000', type: 'Credit', status: 'Delivered', due: '2026-05-01', createdAt: serverTimestamp() },
        { id: 'SO-1002', customer: 'Panda Retail', product: 'Bell Peppers', container: 'CONT-002', qty: '150', price: '68', total: '10200', type: 'Cash', status: 'Paid', due: '2026-04-04', createdAt: serverTimestamp() },
      ];

      for (const item of sales) {
        await setDoc(doc(db, 'sales_orders', item.id), item);
      }

      alert('Demo data seeded successfully! Refresh the dashboard to see the results.');
    } catch (error: any) {
      console.error("Error seeding data:", error);
      alert(`Error seeding data: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Update Firebase Auth Profile
        await updateProfile(user, { photoURL: base64String });
        
        // Update Firestore User Document
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: base64String
        });
        
        alert('Profile picture updated successfully!');
        window.location.reload(); // Refresh to show new photo everywhere
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      alert(`Error uploading photo: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('user_profile')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'user_profile' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Profile
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Company Profile
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'integrations' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Integrations
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          System Settings
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'user_profile' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center border-2 border-blue-200 text-blue-600 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold">{user?.displayName?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">{user?.displayName}</h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {role ? roleLabels[role] : 'User'}
                  </span>
                  <label className="cursor-pointer text-xs font-bold text-[#1F4E79] hover:underline">
                    {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" defaultValue={user?.displayName || ''} readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" defaultValue={user?.email || ''} readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Role</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" defaultValue={role ? roleLabels[role] : 'User'} readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account ID</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-xs" defaultValue={user?.uid || ''} readOnly />
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="text-sm font-bold text-blue-800 mb-2">Role Permissions</h4>
              <p className="text-sm text-blue-600 leading-relaxed">
                {role ? roleDescriptions[role] : 'No role assigned.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=FMA&background=1F4E79&color=fff" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Company Logo</h3>
                <p className="text-sm text-slate-500">Upload your company logo for reports and invoices.</p>
                <button className="text-sm font-bold text-[#1F4E79] hover:underline">Change Logo</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" defaultValue="Farmers Market Asia" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Name</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" defaultValue="TRACES.IO ERP" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Currency</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option>SAR (Saudi Riyal)</option>
                  <option>USD (US Dollar)</option>
                  <option>AED (UAE Dirham)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option>Riyadh (GMT+3)</option>
                  <option>Dubai (GMT+4)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
              <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24" defaultValue="Jeddah, Saudi Arabia"></textarea>
            </div>

            <div className="flex justify-end pt-4">
              {isAdmin && (
                <button className="bg-[#1F4E79] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20">
                  Save Changes
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">User Management</h3>
              {isAdmin && (
                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors"
                >
                  <i className="fa-solid fa-user-plus"></i> Add User
                </button>
              )}
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map((user, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{user.name}</td>
                      <td className="px-6 py-4 text-slate-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase tracking-wider">{user.status}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAdmin && user.uid !== auth.currentUser?.uid && (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit Role"
                            >
                              <i className="fa-solid fa-user-pen"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete User"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-2xl">
                  <i className="fa-solid fa-brain"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Google Gemini AI</h3>
                  <p className="text-sm text-slate-500">Used for AI document extraction, business insights, and automation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Gemini API Key</span>
                      <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-blue-600 hover:underline normal-case font-medium"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </label>
                    <div className="relative">
                      <input 
                        type={showApiKey ? "text" : "password"} 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Stored locally in your browser or provided via environment variables.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Model</label>
                    <select 
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Recommended)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Advanced)</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-flash-latest">Gemini Flash Latest</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={handleSaveIntegration}
                      className="bg-[#1F4E79] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#163a5a] transition-colors"
                    >
                      Save Settings
                    </button>
                    <button 
                      onClick={testConnection}
                      disabled={isTestingKey || !apiKey}
                      className="bg-white text-slate-700 border border-slate-200 px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {isTestingKey ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">Extraction Settings</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-700">Auto-Detect Type</p>
                        <p className="text-xs text-slate-500">Automatically identify document type</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={autoDetect}
                          onChange={(e) => setAutoDetect(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-slate-700">Confidence Threshold</p>
                        <span className="text-xs font-bold text-blue-600">{Math.round(confidenceThreshold * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.1"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400">Flag fields with confidence below this level.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Usage Stats (Today)</p>
                      <div className="flex items-end gap-1 h-12">
                        {(Object.entries(extractionStats || {}) as [string, number][]).slice(-7).map(([date, count]) => (
                          <div 
                            key={date}
                            className="flex-1 bg-blue-100 rounded-t-sm relative group"
                            style={{ height: `${Math.min(100, (Number(count) / 50) * 100)}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                              {date}: {count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">System Tools</h3>
              <p className="text-sm text-slate-500">Manage system data and backups.</p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                  <i className="fa-solid fa-download text-blue-600"></i> Export All Data
                </button>
                {isAdmin && (
                  <button 
                    onClick={seedDemoData}
                    disabled={isSeeding}
                    className="bg-blue-50 text-blue-700 border border-blue-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <i className="fa-solid fa-database"></i> {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4 pt-8 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Notifications</h3>
              <div className="space-y-3">
                {[
                  'Email alerts for low stock',
                  'Email alerts for overdue payments',
                  'Daily summary report',
                  'New container arrival notifications',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#1F4E79] focus:ring-[#1F4E79]" defaultChecked />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Edit User Modal */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Role</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  >
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isAddingUser}
                    className="w-full bg-[#1F4E79] text-white py-3 rounded-xl font-bold hover:bg-[#163a5a] transition-all disabled:opacity-50"
                  >
                    {isAddingUser ? 'Adding User...' : 'Create User Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Edit User Role</h3>
                <button onClick={() => setIsEditUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">User</label>
                  <div className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{selectedUser.name}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select New Role</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={selectedUser.role}
                    onChange={(e) => handleUpdateRole(selectedUser.uid, e.target.value as UserRole)}
                  >
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Permissions Summary</h4>
                  <p className="text-sm text-blue-600 leading-relaxed">
                    {roleDescriptions[selectedUser.role]}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
