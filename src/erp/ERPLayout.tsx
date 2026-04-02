import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

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
  { name: 'Settings', icon: 'fa-gear', path: '/erp/settings' },
];

export default function ERPLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentModule = sidebarModules.find(m => m.path === location.pathname) || { name: 'Dashboard' };

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
          {sidebarModules.map((module) => (
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
            <div className="relative hidden md:block">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
              />
            </div>

            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
              <i className="fa-solid fa-bell text-xl"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">Admin User</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Operations Manager</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                <img 
                  src="https://ui-avatars.com/api/?name=Admin+User&background=1F4E79&color=fff" 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
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
                {sidebarModules.map((module) => (
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
