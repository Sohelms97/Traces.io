import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Download,
  FileDown,
  Image as ImageIcon,
  Table as TableIcon,
  RefreshCw,
  Settings2
} from 'lucide-react';
import { extractWithGemini, fileToBase64, handleExcelFile, getExcelData } from '../lib/gemini-extractor';
import { saveExtractedData } from '../lib/document-router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocType?: string;
  linkedRecordId?: string;
  onSave?: (data: any, files: { file: File; base64: string }[]) => void;
}

type Step = 'upload' | 'processing' | 'confirmation' | 'saved';

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, initialDocType, linkedRecordId, onSave }) => {
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<{ file: File; base64: string; preview?: string; excelData?: any[][] }[]>([]);
  const [docType, setDocType] = useState(initialDocType || 'Auto-Detect');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const extractionRef = useRef<HTMLDivElement>(null);
  const [progressMessage, setProgressMessage] = useState('Initializing AI...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docTypes = [
    "Auto-Detect",
    "Bill of Lading",
    "Commercial Invoice",
    "Packing List",
    "Payment Slip",
    "Inspection Report",
    "Clearing Document",
    "Investment Contract",
    "Investor Flow Sheet",
    "Goods Received Note",
    "Sales Invoice"
  ];

  const processFile = async (selectedFile: File) => {
    let base64 = '';
    let preview = '';
    let excelData = undefined;

    if (selectedFile.type.includes('image')) {
      base64 = await fileToBase64(selectedFile);
      preview = `data:image/png;base64,${base64}`;
    } else if (selectedFile.name.endsWith('.pdf')) {
      base64 = await fileToBase64(selectedFile);
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        try {
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (context) {
            // @ts-ignore
            await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
            const pdfPreview = canvas.toDataURL();
            setFiles(prev => prev.map(f => f.file === selectedFile ? { ...f, preview: pdfPreview } : f));
          }
        } catch (err) {
          console.error('PDF preview error:', err);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
      base64 = await fileToBase64(selectedFile);
      excelData = await getExcelData(selectedFile);
    } else {
      base64 = await fileToBase64(selectedFile);
    }

    setFiles(prev => [...prev, { file: selectedFile, base64, preview, excelData }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files) as File[];
      fileList.forEach(file => processFile(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      fileList.forEach(file => processFile(file));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const exportToPDF = () => {
    if (!extractedData) return;
    const doc = new jsPDF();
    
    // Add Header
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TRACES.IO', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ERP DOCUMENT ANALYSIS REPORT', 14, 32);
    
    // Document Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${extractedData.document_type || 'Extracted Data'}`, 14, 55);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Session: ${extractedData.session_name || 'N/A'}`, 14, 62);
    doc.text(`Analysis Date: ${new Date().toLocaleString()}`, 14, 67);
    doc.text(`Confidence Level: ${extractedData.confidence ? 'Calculated' : 'N/A'}`, 14, 72);

    const tableData = Object.entries(extractedData)
      .filter(([key]) => key !== 'confidence' && key !== 'document_type')
      .map(([key, value]) => [
        (key || '').replace(/_/g, ' ').toUpperCase(),
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);

    autoTable(doc, {
      startY: 80,
      head: [['FIELD NAME', 'EXTRACTED VALUE']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [31, 78, 121],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} - TRACES.IO ERP System`, 105, 285, { align: 'center' });
    }

    doc.save(`TRACES_Analysis_${extractedData.document_type || 'Doc'}_${Date.now()}.pdf`);
  };

  const exportToExcel = () => {
    if (!extractedData) return;
    
    // Metadata rows
    const metadata = [
      ['TRACES.IO ERP DOCUMENT ANALYSIS REPORT'],
      ['Session Name', extractedData.session_name || 'N/A'],
      ['Analysis Date', new Date().toLocaleString()],
      [''], // Spacer
      ['FIELD NAME', 'EXTRACTED VALUE']
    ];

    const dataRows = Object.entries(extractedData)
      .filter(([key]) => key !== 'confidence' && key !== 'document_type')
      .map(([key, value]) => [
        (key || '').replace(/_/g, ' ').toUpperCase(),
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);

    const ws = XLSX.utils.aoa_to_sheet([...metadata, ...dataRows]);
    
    // Basic styling (column widths)
    ws['!cols'] = [{ wch: 30 }, { wch: 60 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis Report");
    XLSX.writeFile(wb, `TRACES_Analysis_${Date.now()}.xlsx`);
  };

  const exportToImage = async () => {
    if (extractionRef.current) {
      const canvas = await html2canvas(extractionRef.current);
      const link = document.createElement('a');
      link.download = `extracted_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const startExtraction = async () => {
    if (files.length === 0) return;

    setStep('processing');
    setError(null);

    const messages = [
      "Classifying documents...",
      "Extracting structured data...",
      "Reconciling multi-doc fields...",
      "Running intelligence checks...",
      "Validating compliance corridor...",
      "Finalizing ERP record..."
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setProgressMessage(messages[msgIndex]);
    }, 2000);

    try {
      const filePayload = files.map(f => ({
        base64: f.base64,
        mimeType: f.file.type,
        filename: f.file.name
      }));

      const data = await extractWithGemini(filePayload, docType, customInstructions);
      
      setExtractedData(data.erp_record || data);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message || 'Extraction failed. Please check your API key.');
      setStep('upload');
    } finally {
      clearInterval(interval);
    }
  };

  const handleSave = async () => {
    if (files.length === 0 || !extractedData) return;
    
    try {
      // If onSave is provided, we pass the data back to the parent
      if (onSave) {
        onSave(extractedData, files.map(f => ({ file: f.file, base64: f.base64 })));
        setStep('saved');
        return;
      }

      // Default behavior: Save each file and the compiled record to Firestore
      for (const f of files) {
        await saveExtractedData({
          fileName: f.file.name,
          fileSize: f.file.size,
          base64Data: f.base64,
          documentType: extractedData.document_type || docType,
          extractedData: extractedData,
          linkedRecordId: linkedRecordId
        });
      }
      setStep('saved');
    } catch (err: any) {
      setError(err.message || 'Failed to save document.');
    }
  };

  const reset = () => {
    setFiles([]);
    setDocType(initialDocType || 'Auto-Detect');
    setCustomInstructions('');
    setShowAdvanced(false);
    setExtractedData(null);
    setError(null);
    setStep('upload');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Document Extraction</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Google Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Module / Record Type
                      </label>
                      <select 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        {docTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline"
                      >
                        <Settings2 size={14} />
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                      </button>
                      
                      <AnimatePresence>
                        {showAdvanced && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                              Custom Extraction Instructions
                            </label>
                            <textarea 
                              value={customInstructions}
                              onChange={(e) => setCustomInstructions(e.target.value)}
                              placeholder="e.g. Focus on the container number and seal ID. Ignore the footer text."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm min-h-[80px] resize-none"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Session Documents ({files.length})</p>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-blue-600 shadow-sm">
                                  {f.file.type.includes('image') ? <FileImage size={16} /> : f.file.name.endsWith('.pdf') ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{f.file.name}</p>
                                  <p className="text-[10px] text-slate-500">{(f.file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[300px] ${
                      files.length > 0 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/5' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                    />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      files.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {files.length > 0 ? 'Add more documents' : 'Click or drag files to upload'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, Images, or Excel (Max 10MB per file)
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    disabled={files.length === 0}
                    onClick={startExtraction}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                  >
                    Compile Session Data
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                    <Loader2 size={32} className="animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{progressMessage}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Gemini AI is analyzing your document...</p>
                </div>
              </motion.div>
            )}

            {step === 'confirmation' && (
              <motion.div 
                key="confirmation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Extracted Data</h3>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Type:</span>
                    <select 
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {docTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Previews / Intelligence Alerts */}
                  <div className="space-y-4">
                    {extractedData?.intelligence_alerts?.length > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} />
                          Intelligence Alerts
                        </h4>
                        <div className="space-y-2">
                          {extractedData.intelligence_alerts.map((alert: string, i: number) => (
                            <p key={i} className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">• {alert}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {extractedData?.conflicts?.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} />
                          Conflict Register
                        </h4>
                        <div className="space-y-3">
                          {extractedData.conflicts.map((conflict: any, i: number) => (
                            <div key={i} className="p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-red-100 dark:border-red-900/30">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">{conflict.field}</p>
                              <div className="space-y-1">
                                {conflict.conflict.map((c: any, j: number) => (
                                  <p key={j} className="text-[10px] text-slate-600 dark:text-slate-400">
                                    <span className="font-bold">{c.doc}:</span> {c.value}
                                  </p>
                                ))}
                              </div>
                              <p className="text-[10px] text-red-800 dark:text-red-300 mt-1 italic">Resolution: {conflict.resolution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col p-4 min-h-[300px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Session Documents ({files.length})</p>
                      <div className="grid grid-cols-2 gap-4">
                        {files.map((f, i) => (
                          <div key={i} className="relative group aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            {f.preview ? (
                              <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                <FileSpreadsheet size={32} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-bold text-slate-500 truncate w-full">{f.file.name}</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest">View Full</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Data Form */}
                  <div className="space-y-4" ref={extractionRef}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiled ERP Record</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={exportToPDF}
                          title="Export as PDF"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileDown size={16} />
                        </button>
                        <button 
                          onClick={exportToExcel}
                          title="Export as Excel"
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <TableIcon size={16} />
                        </button>
                        <button 
                          onClick={exportToImage}
                          title="Export as Image"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <ImageIcon size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
                      {/* Render Module-Specific Data */}
                      {['procurement', 'sales', 'logistics', 'finance', 'warehouse', 'supplier', 'buyer', 'compliance'].map(module => {
                        const moduleData = extractedData[module];
                        if (!moduleData || Object.values(moduleData).every(v => v === null)) return null;

                        return (
                          <div key={module} className="space-y-3">
                            <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              {module.replace(/_/g, ' ')}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {Object.entries(moduleData).map(([key, value]) => {
                                if (value === null || value === undefined) return null;
                                
                                return (
                                  <div key={key} className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{(key || '').replace(/_/g, ' ')}</label>
                                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm">
                                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Fallback for generic data */}
                      {Object.entries(extractedData || {}).map(([key, value]) => {
                        if (['procurement', 'sales', 'logistics', 'finance', 'warehouse', 'supplier', 'buyer', 'compliance', 'conflicts', 'flags', 'intelligence_alerts', 'documents_processed', 'record_id', 'record_type', 'session_name', 'created_date', 'status', 'three_way_match', 'compliance_status'].includes(key)) return null;
                        if (value === null || value === undefined) return null;

                        return (
                          <div key={key} className="relative group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{(key || '').replace(/_/g, ' ')}</label>
                            <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={startExtraction}
                      className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group"
                    >
                      <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                      Re-extract
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                    >
                      Confirm & Save to ERP
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'saved' && (
              <motion.div 
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-6">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Document Saved Successfully!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                  The extracted data has been routed to the appropriate ERP module and added to the Document Library.
                </p>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={onClose}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={reset}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                  >
                    Upload Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentUploadModal;
