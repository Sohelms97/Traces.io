import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  templateData: any[]; // Example data for template download
  schema: {
    [key: string]: {
      label: string;
      required?: boolean;
      type?: 'string' | 'number' | 'date' | 'boolean';
    };
  };
}

export default function ImportExcelModal({ isOpen, onClose, onImport, title, templateData, schema }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        validateData(json);
      } catch (err) {
        setErrors([{ row: 0, message: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.' }]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const validationErrors: { row: number; message: string }[] = [];
    const validatedData = data.map((row: any, index) => {
      const newRow: any = { ...row };
      Object.entries(schema).forEach(([key, config]) => {
        // Try to find value by label or key
        const value = row[config.label] !== undefined ? row[config.label] : row[key];
        
        if (config.required && (value === undefined || value === null || value === '')) {
          validationErrors.push({ row: index + 1, message: `Missing required field: ${config.label}` });
        }

        if (value !== undefined && value !== null && value !== '') {
          if (config.type === 'number' && isNaN(Number(value))) {
            validationErrors.push({ row: index + 1, message: `${config.label} must be a number` });
          }
          // Add more type validations as needed
        }
        
        // Map excel header to internal key
        if (row[config.label] !== undefined) {
          newRow[key] = row[config.label];
          // Don't delete yet if multiple keys map to same label, but usually it's 1:1
        } else if (row[key] !== undefined) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });

    setParsedData(validatedData);
    setErrors(validationErrors);
  };

  const handleImport = async () => {
    if (errors.length > 0) return;
    setIsImporting(true);
    try {
      await onImport(parsedData);
      onClose();
      setFile(null);
      setParsedData([]);
      setErrors([]);
    } catch (error) {
      console.error('Import failed:', error);
      setErrors([{ row: 0, message: 'Import failed. Please check the data and try again.' }]);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Template.xlsx`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
          >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import {title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload an Excel file to bulk add data</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-slate-400 group-hover:text-green-500 mx-auto mb-4 transition-colors" />
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500 mt-2">Excel files (.xlsx, .xls) only</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="mt-6 text-green-600 hover:text-green-700 font-medium flex items-center gap-2 mx-auto"
                >
                  <Info className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setParsedData([]); setErrors([]); }} className="text-red-500 hover:text-red-600 text-sm font-medium">
                    Remove
                  </button>
                </div>

                {/* Validation Summary */}
                {errors.length > 0 ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold">Validation Errors Found ({errors.length})</span>
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                      {errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}</li>
                      ))}
                      {errors.length > 5 && <li>...and {errors.length - 5} more errors</li>}
                    </ul>
                  </div>
                ) : parsedData.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">Ready to import {parsedData.length} rows</span>
                  </div>
                )}

                {/* Preview Table */}
                {parsedData.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Preview (First 5 rows)</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs">
                          <tr>
                            {Object.values(schema).map((config, i) => (
                              <th key={i} className="px-4 py-2 font-medium">{config.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {parsedData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="bg-white dark:bg-slate-900">
                              {Object.keys(schema).map((key, j) => (
                                <td key={j} className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                  {String(row[key] !== undefined ? row[key] : '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!file || errors.length > 0 || isImporting}
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Import
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
}
