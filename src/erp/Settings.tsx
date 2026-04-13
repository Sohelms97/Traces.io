import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { roleLabels, roleDescriptions } from '../lib/permissions';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportExcelModal from '../components/ImportExcelModal';
import { writeBatch } from 'firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'system' | 'integrations' | 'user_profile' | 'website'>('profile');
  const { user, isAdmin, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [publicStats, setPublicStats] = useState({
    containersTraded: '',
    countriesSourced: '',
    productsTraced: '',
    activeInvestors: '',
    totalSales: '',
    grossProfit: '',
    activeShipments: '',
    marketReach: '',
    testimonial: ''
  });
  const [isSavingStats, setIsSavingStats] = useState(false);
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
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isImportUserModalOpen, setIsImportUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingUpload, setIsTestingUpload] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'settings', 'public_stats'));
      if (docSnap.exists()) {
        setPublicStats(docSnap.data() as any);
      } else if (isAdmin) {
        // Initialize with default stats if not exists and user is admin
        const defaultStats = {
          containersTraded: "38+",
          countriesSourced: "12+",
          productsTraced: "100%",
          activeInvestors: "50+",
          totalSales: "AED 10,395,310",
          grossProfit: "AED 271,224",
          activeShipments: "14 Containers",
          marketReach: "Asia & Middle East",
          testimonial: "The level of transparency provided by TRACES has completely transformed how we evaluate our investment performance in the food sector."
        };
        setPublicStats(defaultStats);
        await setDoc(doc(db, 'settings', 'public_stats'), {
          ...defaultStats,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error fetching public stats:", error);
    }
  };

  const handleSavePublicStats = async () => {
    setIsSavingStats(true);
    try {
      await setDoc(doc(db, 'settings', 'public_stats'), {
        ...publicStats,
        updatedAt: serverTimestamp()
      });
      alert('Public website stats updated successfully!');
    } catch (error: any) {
      console.error("Error saving public stats:", error);
      alert(`Error saving stats: ${error.message}`);
    } finally {
      setIsSavingStats(false);
    }
  };

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

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 8; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name) return;
    
    setIsAddingUser(true);
    try {
      const tempPassword = generatePassword();
      
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          password: tempPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }
      
      let successMsg = `User ${newUser.name} added successfully. An invitation email has been sent to ${newUser.email} with their temporary password.`;
      if (data.previewUrl) {
        successMsg += `\n\nDemo Email Preview: ${data.previewUrl}`;
      }
      
      alert(successMsg);
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
    setIsSeedModalOpen(false);
    setIsSeeding(true);
    try {
      // Seed Containers
      const containers = [
        { id: 'CONT-001', supplier: 'Global Fruits Ltd', product: 'Fresh Mangoes', origin: 'India', qty: '1200 Boxes', purchaseValue: '45000', totalCost: '52000', saleQty: '1150', totalSales: '85000', gp: '33000', roi: '63.4', status: 'Open', month: 'April', createdAt: serverTimestamp() },
        { id: 'CONT-002', supplier: 'EuroVeg S.A.', product: 'Bell Peppers', origin: 'Spain', qty: '800 Boxes', purchaseValue: '32000', totalCost: '38000', saleQty: '800', totalSales: '55000', gp: '17000', roi: '44.7', status: 'Closed', month: 'March', createdAt: serverTimestamp() },
      ];

      for (const item of containers) {
        const sanitizedId = item.id.replace(/\//g, '-');
        await setDoc(doc(db, 'containers', sanitizedId), { ...item, id: sanitizedId });
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
    setUserToDelete(uid);
    setIsDeleteUserModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete));
      fetchUsers();
      setIsDeleteUserModalOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you must have recently logged in to change your password. Please log out and log back in, then try again.");
      } else {
        alert(`Error updating password: ${error.message}`);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    console.log(`Starting upload for ${file.name} to ${path}...`);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File size exceeds 5MB limit.");
      if (!file.type.startsWith('image/')) throw new Error("Only image files are allowed.");

      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.code === 'storage/unauthorized') {
        throw new Error("Permission denied. Ensure Firebase Storage is enabled and rules allow uploads.");
      }
      throw error;
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTestingUpload(true);
    setTestResult(null);
    try {
      const url = await uploadImage(file, 'test_uploads');
      setTestResult({ success: true, message: `Upload successful! URL: ${url}` });
    } catch (error: any) {
      setTestResult({ success: false, message: `Upload failed: ${error.message}` });
    } finally {
      setIsTestingUpload(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    try {
      const photoURL = await uploadImage(file, `users/${user.uid}`);
      
      // Update Firebase Auth Profile
      await updateProfile(user, { photoURL });
      
      // Update Firestore User Document
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL
      });
      
      alert('Profile picture updated successfully!');
      window.location.reload();
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
          onClick={() => setActiveTab('website')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'website' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Public Website
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

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Storage Connectivity Test</h3>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                <p className="text-sm text-blue-600">If you are having trouble uploading pictures or logos, use this tool to test your connection to Firebase Storage.</p>
                <div className="relative inline-block">
                  <button 
                    disabled={isTestingUpload}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTestingUpload ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isTestingUpload ? 'Testing...' : 'Test Image Upload'}
                  </button>
                  <input type="file" accept="image/*" onChange={handleTestUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isTestingUpload} />
                </div>

                {testResult && (
                  <div className={`p-4 rounded-xl border ${testResult.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <div className="flex items-start gap-3">
                      {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{testResult.success ? 'Storage is Working!' : 'Storage Error'}</p>
                        <p className="text-xs break-all">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Security</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-[#1F4E79] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#163a5a] transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
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
                  <option>AED (UAE Dirham)</option>
                  <option>SAR (Saudi Riyal)</option>
                  <option>USD (US Dollar)</option>
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsImportUserModalOpen(true)}
                    className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <i className="fa-solid fa-file-import"></i> Import Excel
                  </button>
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors"
                  >
                    <i className="fa-solid fa-user-plus"></i> Add User
                  </button>
                </div>
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

        {activeTab === 'website' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-2xl">
                <i className="fa-solid fa-globe"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Public Website Content</h3>
                <p className="text-sm text-slate-500">Manage the statistics and testimonials displayed on the main landing page.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Hero Statistics</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Containers Traded</label>
                    <input 
                      type="text" 
                      value={publicStats.containersTraded}
                      onChange={(e) => setPublicStats({ ...publicStats, containersTraded: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 38+"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Countries Sourced</label>
                    <input 
                      type="text" 
                      value={publicStats.countriesSourced}
                      onChange={(e) => setPublicStats({ ...publicStats, countriesSourced: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 12+"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Products Traced</label>
                    <input 
                      type="text" 
                      value={publicStats.productsTraced}
                      onChange={(e) => setPublicStats({ ...publicStats, productsTraced: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 100%"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Investors</label>
                    <input 
                      type="text" 
                      value={publicStats.activeInvestors}
                      onChange={(e) => setPublicStats({ ...publicStats, activeInvestors: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 50+"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Live Performance Data</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</label>
                    <input 
                      type="text" 
                      value={publicStats.totalSales}
                      onChange={(e) => setPublicStats({ ...publicStats, totalSales: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. AED 10,395,310"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Profit</label>
                    <input 
                      type="text" 
                      value={publicStats.grossProfit}
                      onChange={(e) => setPublicStats({ ...publicStats, grossProfit: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. AED 271,224"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Shipments</label>
                    <input 
                      type="text" 
                      value={publicStats.activeShipments}
                      onChange={(e) => setPublicStats({ ...publicStats, activeShipments: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 14 Containers"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Market Reach</label>
                    <input 
                      type="text" 
                      value={publicStats.marketReach}
                      onChange={(e) => setPublicStats({ ...publicStats, marketReach: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. Asia & Middle East"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investor Testimonial</label>
              <textarea 
                value={publicStats.testimonial}
                onChange={(e) => setPublicStats({ ...publicStats, testimonial: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24" 
                placeholder="Enter the featured testimonial..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-4">
              {isAdmin && (
                <button 
                  onClick={handleSavePublicStats}
                  disabled={isSavingStats}
                  className="bg-[#1F4E79] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSavingStats ? 'Saving...' : 'Update Website Content'}
                </button>
              )}
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
                    onClick={() => setIsSeedModalOpen(true)}
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

      <ConfirmationModal 
        isOpen={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete User"
      />

      <ConfirmationModal 
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onConfirm={seedDemoData}
        title="Seed Demo Data"
        message="This will seed demo data for containers, sales, and purchases. This is intended for testing purposes. Continue?"
        confirmText="Seed Data"
        type="warning"
      />

      <ImportExcelModal
        isOpen={isImportUserModalOpen}
        onClose={() => setIsImportUserModalOpen(false)}
        onImport={async (data) => {
          let successCount = 0;
          let errorCount = 0;
          
          for (const item of data) {
            try {
              const tempPassword = generatePassword();
              const response = await fetch('/api/send-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: item.email,
                  name: item.name || item.displayName,
                  role: item.role || 'view_only',
                  password: tempPassword
                })
              });
              
              if (response.ok) successCount++;
              else errorCount++;
            } catch (e) {
              errorCount++;
            }
          }
          
          alert(`Import complete: ${successCount} users invited successfully, ${errorCount} failed.`);
          fetchUsers();
        }}
        schema={{
          name: { label: 'Full Name', required: true },
          email: { label: 'Email Address', required: true },
          role: { label: 'Role', required: true }
        }}
        templateData={[
          { 'Full Name': 'John Doe', 'Email Address': 'john@example.com', 'Role': 'staff' }
        ]}
        title="Import Users"
      />
    </div>
  );
}
