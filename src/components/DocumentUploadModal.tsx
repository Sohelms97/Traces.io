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
  Table as TableIcon
} from 'lucide-react';
import { extractWithGemini, fileToBase64, handleExcelFile, getExcelData } from '../lib/gemini-extractor';
import { saveExtractedData } from '../lib/document-router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'processing' | 'confirmation' | 'saved';

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Auto-Detect');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [excelPreview, setExcelPreview] = useState<any[][] | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setFile(selectedFile);
    setExcelPreview(null);
    setPdfPreview(null);
    setBase64Data(null);

    // Generate previews
    if (selectedFile.type.includes('image')) {
      const base64 = await fileToBase64(selectedFile);
      setBase64Data(base64);
    } else if (selectedFile.name.endsWith('.pdf')) {
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
            // @ts-ignore - canvas is required in some versions of pdfjs-dist
            await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
            setPdfPreview(canvas.toDataURL());
          }
        } catch (err) {
          console.error('PDF preview error:', err);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
      const data = await getExcelData(selectedFile);
      setExcelPreview(data.slice(0, 10)); // First 10 rows for preview
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const exportToPDF = () => {
    if (!extractedData) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${extractedData.document_type || 'Extracted Data'}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

    const tableData = Object.entries(extractedData)
      .filter(([key]) => key !== 'confidence' && key !== 'document_type')
      .map(([key, value]) => [
        (key || '').replace(/_/g, ' ').toUpperCase(),
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);

    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [31, 78, 121] }
    });

    doc.save(`extracted_${Date.now()}.pdf`);
  };

  const exportToExcel = () => {
    if (!extractedData) return;
    const dataToExport = Object.entries(extractedData)
      .filter(([key]) => key !== 'confidence' && key !== 'document_type')
      .map(([key, value]) => ({
        Field: (key || '').replace(/_/g, ' ').toUpperCase(),
        Value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
    XLSX.writeFile(wb, `extracted_${Date.now()}.xlsx`);
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
    if (!file) return;

    setStep('processing');
    setError(null);

    const messages = [
      "Reading document structure...",
      "Identifying key fields...",
      "Running AI extraction...",
      "Validating data confidence...",
      "Finalizing results..."
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setProgressMessage(messages[msgIndex]);
    }, 2000);

    try {
      let data;
      const fileName = file.name || '';
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        data = await handleExcelFile(file);
      } else {
        const base64 = await fileToBase64(file);
        setBase64Data(base64);
        data = await extractWithGemini(base64, file.type, docType);
      }
      
      setExtractedData(data);
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message || 'Extraction failed. Please check your API key.');
      setStep('upload');
    } finally {
      clearInterval(interval);
    }
  };

  const handleSave = () => {
    if (!file || !extractedData) return;
    
    saveExtractedData({
      fileName: file.name,
      fileSize: file.size,
      base64Data: base64Data || '',
      documentType: extractedData.document_type || docType,
      extractedData: extractedData
    });
    setStep('saved');
  };

  const reset = () => {
    setFile(null);
    setDocType('Auto-Detect');
    setExtractedData(null);
    setError(null);
    setBase64Data(null);
    setExcelPreview(null);
    setPdfPreview(null);
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Document Type
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

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
                        <AlertCircle size={16} />
                        Pro Tip
                      </h4>
                      <p className="text-xs text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
                        "Auto-Detect" uses AI to identify the document type and extract all relevant fields automatically.
                      </p>
                    </div>
                  </div>

                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      file 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                    />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      file ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {file ? <CheckCircle size={32} /> : <Upload size={32} />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {file ? file.name : 'Click or drag file to upload'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, Images, or Excel (Max 10MB)
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
                    disabled={!file}
                    onClick={startExtraction}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                  >
                    Start AI Extraction
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Extracted Data</h3>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {extractedData?.document_type || docType}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-4 min-h-[400px] overflow-hidden">
                    {pdfPreview ? (
                      <div className="w-full h-full flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PDF Preview (First Page)</p>
                        <img src={pdfPreview} alt="PDF Preview" className="max-w-full max-h-[350px] shadow-lg rounded border border-slate-200" />
                      </div>
                    ) : excelPreview ? (
                      <div className="w-full h-full flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Spreadsheet Snippet</p>
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                          <table className="w-full text-[10px] text-left">
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {excelPreview.map((row, i) => (
                                <tr key={i} className={i === 0 ? 'bg-slate-50 dark:bg-slate-900 font-bold' : ''}>
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-2 py-1 whitespace-nowrap">{String(cell || '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : base64Data ? (
                      <div className="w-full h-full flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Image Preview</p>
                        <img src={`data:image/png;base64,${base64Data}`} alt="Preview" className="max-w-full max-h-[350px] shadow-lg rounded" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileCode size={64} className="text-slate-400 mb-4" />
                        <p className="text-slate-500 font-medium">{file?.name}</p>
                        <p className="text-xs text-slate-400 mt-1">Preview not available</p>
                      </div>
                    )}
                  </div>

                  {/* Data Form */}
                  <div className="space-y-4" ref={extractionRef}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extracted Fields</p>
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
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(extractedData || {}).map(([key, value]) => {
                        if (key === 'confidence' || key === 'document_type') return null;
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(key || '').replace(/_/g, ' ')}</label>
                              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                {JSON.stringify(value)}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="relative group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{(key || '').replace(/_/g, ' ')}</label>
                            <input 
                              type="text"
                              value={value as string || ''}
                              onChange={(e) => setExtractedData({...extractedData, [key]: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            {extractedData?.confidence?.[key] && (
                              <div className={`absolute right-3 top-8 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                extractedData.confidence[key] === 'high' ? 'bg-green-100 text-green-600' :
                                extractedData.confidence[key] === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {extractedData.confidence[key]}
                              </div>
                            )}
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
                      className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
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
