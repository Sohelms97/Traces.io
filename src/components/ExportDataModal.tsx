import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  FileText, 
  Table, 
  FileJson, 
  Calendar, 
  CheckSquare, 
  Square,
  X,
  Shield,
  ShieldOff,
  Loader2
} from 'lucide-react';
import { ExportFormat, ExportOptions, fetchModuleData, exportToCSV, exportToExcel, exportToPDF, exportToJSON } from '../services/exportService';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODULES = [
  'Investors',
  'Investments',
  'Agreements',
  'Payment Schedules',
  'Distributions',
  'Users',
  'Sales Orders',
  'Customers',
  'Containers',
  'Inventory',
  'Inventory Movements',
  'Shipments',
  'Purchase Orders',
  'Suppliers',
];

export default function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    modules: [],
    format: 'excel',
    isSecured: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleModule = (module: string) => {
    setOptions(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }));
  };

  const selectAll = () => {
    setOptions(prev => ({
      ...prev,
      modules: prev.modules.length === MODULES.length ? [] : [...MODULES]
    }));
  };

  const handleExport = async () => {
    if (options.modules.length === 0) return;
    
    setIsExporting(true);
    try {
      const allData: Record<string, any[]> = {};
      
      for (const module of options.modules) {
        const data = await fetchModuleData(module, options.startDate, options.endDate);
        allData[module] = data;
      }

      const fileName = `ERP_Export_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'csv':
          if (options.modules.length > 0) {
            exportToCSV(allData[options.modules[0]], `${fileName}_${options.modules[0]}`);
          }
          break;
        case 'excel':
          exportToExcel(allData, fileName, options.isSecured);
          break;
        case 'pdf':
          exportToPDF(allData, fileName, options.isSecured);
          break;
        case 'json':
          exportToJSON(allData, fileName);
          break;
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Download size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Export Data</h2>
                <p className="text-xs text-slate-500 font-medium">Select modules and filters for your export</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Module Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Modules</h3>
                <button 
                  onClick={selectAll}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {options.modules.length === MODULES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MODULES.map(module => (
                  <button
                    key={module}
                    onClick={() => toggleModule(module)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                      options.modules.includes(module)
                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {options.modules.includes(module) ? (
                      <CheckSquare size={16} className="shrink-0" />
                    ) : (
                      <Square size={16} className="shrink-0" />
                    )}
                    <span className="text-xs font-bold truncate">{module}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Time Filter */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Time Filter</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Start Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date"
                      value={options.startDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">End Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date"
                      value={options.endDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Export Format */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Export Format</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'excel', label: 'Excel (.xlsx)', icon: <Table size={16} /> },
                  { id: 'pdf', label: 'PDF Document', icon: <FileText size={16} /> },
                  { id: 'csv', label: 'CSV File', icon: <FileText size={16} /> },
                  { id: 'json', label: 'JSON Data', icon: <FileJson size={16} /> },
                ].map(format => (
                  <button
                    key={format.id}
                    onClick={() => setOptions(prev => ({ ...prev, format: format.id as ExportFormat }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                      options.format === format.id
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {format.icon}
                    <span className="text-xs font-bold">{format.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Security Options */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOptions(prev => ({ ...prev, isSecured: !prev.isSecured }))}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all w-full sm:w-auto ${
                    options.isSecured
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {options.isSecured ? <Shield size={20} /> : <ShieldOff size={20} />}
                  <div className="text-left">
                    <div className="text-xs font-bold">Secure Export</div>
                    <div className="text-[10px] opacity-70 font-medium">Add metadata and encryption tags</div>
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={options.modules.length === 0 || isExporting}
              className={`px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-200 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Preparing Export...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Export {options.modules.length} Modules</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
