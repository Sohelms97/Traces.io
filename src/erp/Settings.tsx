import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const users = [
  { name: 'Admin User', email: 'admin@traces.io', role: 'Admin', status: 'Active' },
  { name: 'Operations Manager', email: 'ops@traces.io', role: 'Operations', status: 'Active' },
  { name: 'Warehouse Supervisor', email: 'wh@traces.io', role: 'Warehouse', status: 'Active' },
  { name: 'Sales Head', email: 'sales@traces.io', role: 'Sales', status: 'Active' },
  { name: 'Investor Manager', email: 'invest@traces.io', role: 'Investor Manager', status: 'Active' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'system'>('profile');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Company Profile
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          System Settings
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
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
              <button className="bg-[#1F4E79] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">User Management</h3>
              <button className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors">
                <i className="fa-solid fa-user-plus"></i> Add User
              </button>
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
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase tracking-wider">{user.status}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><i className="fa-solid fa-user-pen"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">System Backup</h3>
              <p className="text-sm text-slate-500">Download a full backup of all ERP data in JSON format.</p>
              <button className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <i className="fa-solid fa-download text-blue-600"></i> Export All Data
              </button>
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
    </div>
  );
}
