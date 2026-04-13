import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const colors = {
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-900/20',
      icon: <Trash2 className="w-8 h-8" />
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-500',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20',
      icon: <AlertTriangle className="w-8 h-8" />
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-500',
      button: 'bg-[#1F4E79] hover:bg-[#163a5a] shadow-blue-900/20',
      icon: <AlertTriangle className="w-8 h-8" />
    }
  };

  const currentStyle = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-16 h-16 ${currentStyle.bg} ${currentStyle.text} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {currentStyle.icon}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 ${currentStyle.button} text-white rounded-xl font-bold transition-all shadow-lg`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
