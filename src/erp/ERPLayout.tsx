import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { rolePermissions, roleLabels } from '../lib/permissions';
import DocumentUploadModal from '../components/DocumentUploadModal';
import ExportDataModal from '../components/ExportDataModal';
import { DocumentType } from '../lib/claude';
import { useDocuments } from '../hooks/useDocuments';

const sidebarModules = [
  { name: 'Dashboard', icon: 'fa-house', path: '/erp/dashboard' },
  { name: 'Container Management', icon: 'fa-box', path: '/erp/containers' },
  { name: 'Purchase Management', icon: 'fa-cart-shopping', path: '/erp/purchases' },
  { name: 'Shipment & Logistics', icon: 'fa-ship', path: '/erp/shipments' },
  { name: 'Warehouse & Inventory', icon: 'fa-industry', path: '/erp/inventory' },
  { name: 'Sales Management', icon: 'fa-sack-dollar', path: '/erp/sales' },
  { name: 'Investor Portal', icon: 'fa-user', path: '/erp/investors' },
  { name: 'Financial Reports', icon: 'fa-chart-column', path: '/erp/reports' },
  { name: 'Traceability Tracker', icon: 'fa-link', path: '/erp/traceability' },
  { name: 'Product Catalog', icon: 'fa-rectangle-list', path: '/erp/catalog' },
  { name: 'Website Manager', icon: 'fa-globe', path: '/erp/website' },
  { name: 'User Management', icon: 'fa-users-gear', path: '/erp/users' },
  { name: 'Documents', icon: 'fa-file-lines', path: '/erp/documents' },
  { name: 'Settings', icon: 'fa-gear', path: '/erp/settings' },
];

import { useAlerts, Alert } from '../hooks/useAlerts';

export default function ERPLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const { user, logout, role, isAdmin, hasPermission } = useAuth();
  const location = useLocation();
  const { addDocument } = useDocuments();
  const { alerts, markAsRead } = useAlerts();

  useEffect(() => {
    document.title = "Internal ERP Portal | TRACES.IO";
    return () => {
      document.title = "TRACES.IO | Global Food Traceability";
    };
  }, []);

  const unreadAlerts = alerts.filter(a => !a.isRead);

  const allowedModules = sidebarModules.filter(m => hasPermission(m.path));

  const currentModule = sidebarModules.find(m => m.path === location.pathname) || { name: 'Dashboard' };

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-['Inter']">
      {/* Sidebar - Desktop */}
      <aside 
        className={`bg-[#1F4E79] text-white transition-all duration-300 hidden lg:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <i className="fa-solid fa-link text-white"></i>
          </div>
          {!isSidebarCollapsed && (
            <span className="font-bold text-xl tracking-tight">TRACES.IO</span>
          )}
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          {allowedModules.map((module) => (
            <Link
              key={module.path}
              to={module.path}
              className={`flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/5 ${
                location.pathname === module.path ? 'bg-white/10 border-r-4 border-green-400' : ''
              }`}
              title={isSidebarCollapsed ? module.name : ''}
            >
              <i className={`fa-solid ${module.icon} w-6 text-center text-lg ${
                location.pathname === module.path ? 'text-green-400' : 'text-white/60'
              }`}></i>
              {!isSidebarCollapsed && (
                <span className={`font-medium ${location.pathname === module.path ? 'text-white' : 'text-white/80'}`}>
                  {module.name}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-white/60`}></i>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-slate-800">{currentModule.name}</h1>
          </div>

          <div className="flex items-center gap-6">
            {isAdmin && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>Upload Document</span>
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-200"
              >
                <i className="fa-solid fa-download"></i>
                <span>Export Data</span>
              </button>
            )}

            <div className="relative hidden md:block">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
              >
                <i className="fa-solid fa-bell text-xl"></i>
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] text-white flex items-center justify-center font-bold">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[101] overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {unreadAlerts.length} New
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {alerts.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {alerts.map(alert => (
                              <div 
                                key={alert.id} 
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${alert.isRead ? 'opacity-60' : ''}`}
                                onClick={() => markAsRead(alert.id)}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                                    alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <i className={`fa-solid ${
                                      alert.severity === 'critical' ? 'fa-circle-exclamation' : 
                                      alert.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'
                                    }`}></i>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-slate-800">{alert.title}</div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">{alert.message}</p>
                                    <div className="text-[9px] text-slate-400 font-medium">{new Date(alert.date).toLocaleTimeString()}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center space-y-2">
                            <i className="fa-solid fa-bell-slash text-slate-200 text-3xl"></i>
                            <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-100 text-center">
                        <button className="text-xs font-bold text-blue-600 hover:underline">View All Alerts</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <Link to="/erp/settings" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                <div className="text-sm font-bold text-slate-800">{user?.displayName}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {role ? roleLabels[role] : 'User'}
                </div>
              </Link>
              <Link to="/erp/settings" className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold overflow-hidden hover:ring-2 hover:ring-blue-500/20 transition-all">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1F4E79] text-white">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </Link>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Export Data Modal */}
      <ExportDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[110] space-y-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
                toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-[#1F4E79] text-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-link text-white"></i>
                  </div>
                  <span className="font-bold text-xl tracking-tight">TRACES.IO</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/60">
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
              </div>
              <nav className="flex-1 py-6 overflow-y-auto">
                {allowedModules.map((module) => (
                  <Link
                    key={module.path}
                    to={module.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5 ${
                      location.pathname === module.path ? 'bg-white/10 border-r-4 border-green-400' : ''
                    }`}
                  >
                    <i className={`fa-solid ${module.icon} w-6 text-center text-lg ${
                      location.pathname === module.path ? 'text-green-400' : 'text-white/60'
                    }`}></i>
                    <span className={`font-medium ${location.pathname === module.path ? 'text-white' : 'text-white/80'}`}>
                      {module.name}
                    </span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
