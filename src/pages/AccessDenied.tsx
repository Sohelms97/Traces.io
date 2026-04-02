import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Inter']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-shield-halved text-4xl text-red-600"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-8">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link 
          to="/erp/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F4E79] text-white rounded-xl font-semibold hover:bg-[#2C6EAB] transition-all shadow-lg shadow-blue-900/20"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
