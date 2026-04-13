import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { db, auth } from '../firebase';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Search, UserCog, Shield, Mail, Calendar, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { roleLabels, roleDescriptions, rolePermissions } from '../lib/permissions';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<UserRole>('view_only');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const { isAdmin, user: currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenRoleModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'view_only');
    setCustomPermissions(user.permissions || rolePermissions[user.role as UserRole] || []);
    setIsRoleModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedUser(null);
    document.body.style.overflow = 'unset';
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        role: newRole,
        permissions: customPermissions,
        updatedAt: serverTimestamp()
      });
      handleCloseRoleModal();
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const togglePermission = (path: string) => {
    setCustomPermissions(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
    setCustomPermissions(rolePermissions[role] || []);
  };

  const handleDeleteUser = (user: any) => {
    if (user.id === currentUser?.uid) {
      alert("You cannot delete your own account.");
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-10 text-center">
        <Shield size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500">You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-80 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Total Users: <span className="text-slate-900 font-bold">{users.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.displayName?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.displayName || 'Anonymous'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={12} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      u.role === 'view_only' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {roleLabels[u.role as UserRole] || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenRoleModal(u)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Change Role"
                      >
                        <UserCog size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Update Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseRoleModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <h2 className="text-xl font-bold">Manage User Role & Permissions</h2>
                <button onClick={handleCloseRoleModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                    {selectedUser?.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedUser?.displayName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{selectedUser?.displayName}</div>
                    <div className="text-xs text-slate-500">{selectedUser?.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Role</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(Object.keys(roleLabels) as UserRole[]).map((roleKey) => (
                        <button
                          key={roleKey}
                          onClick={() => handleRoleChange(roleKey)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            newRole === roleKey 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${newRole === roleKey ? 'text-blue-700' : 'text-slate-700'}`}>
                              {roleLabels[roleKey]}
                            </span>
                            {newRole === roleKey && <CheckCircle2 size={16} className="text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">{roleDescriptions[roleKey]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module Access (Custom)</label>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-[10px] text-blue-600 font-bold uppercase mb-3">Toggle individual permissions</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Dashboard', path: '/erp/dashboard' },
                          { name: 'Containers', path: '/erp/containers' },
                          { name: 'Purchases', path: '/erp/purchases' },
                          { name: 'Shipments', path: '/erp/shipments' },
                          { name: 'Inventory', path: '/erp/inventory' },
                          { name: 'Sales', path: '/erp/sales' },
                          { name: 'Investors', path: '/erp/investors' },
                          { name: 'Reports', path: '/erp/reports' },
                          { name: 'Traceability', path: '/erp/traceability' },
                          { name: 'Catalog', path: '/erp/catalog' },
                          { name: 'Website', path: '/erp/website' },
                          { name: 'Users', path: '/erp/users' },
                          { name: 'Documents', path: '/erp/documents' },
                          { name: 'Settings', path: '/erp/settings' },
                        ].map((module) => (
                          <button 
                            key={module.path} 
                            onClick={() => togglePermission(module.path)}
                            className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-all"
                          >
                            <span className="text-xs font-medium text-slate-700">{module.name}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${customPermissions.includes(module.path) ? 'bg-green-500 border-green-600' : 'bg-slate-100 border-slate-200'}`}>
                              {customPermissions.includes(module.path) && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={handleCloseRoleModal}
                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateRole}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-xl font-bold hover:bg-[#163a5a] transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.displayName}? This action cannot be undone and the user will lose all access.`}
        confirmText="Delete User"
      />
    </div>
  );
}
