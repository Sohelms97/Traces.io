import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDocuments, DocumentRecord } from '../hooks/useDocuments';
import { roleLabels } from '../lib/permissions';

export default function Documents() {
  const { documents, deleteDocument } = useDocuments();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.docType === filterType;
    const matchesSearch = (doc.fileName || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDocTypeLabel = (type: string) => {
    return (type || '').replace(/_/g, ' ').toUpperCase();
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (!doc.base64Data) {
      alert('No file data available for download.');
      return;
    }

    try {
      const byteCharacters = atob(doc.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-xl">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{documents.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-xl">
            <i className="fa-solid fa-microchip"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {documents.filter(d => d.extractedData).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Extracted</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 text-xl">
            <i className="fa-solid fa-hard-drive"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {(documents.reduce((acc, d) => acc + d.fileSize, 0) / 1024 / 1024).toFixed(1)} MB
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Used</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {documents.filter(d => new Date(d.uploadDate).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Today</div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="bill_of_lading">Bill of Lading</option>
              <option value="commercial_invoice">Commercial Invoice</option>
              <option value="investment_contract">Investment Contract</option>
              <option value="packing_list">Packing List</option>
              <option value="payment_slip">Payment Slip</option>
              <option value="inspection_report">Inspection Report</option>
              <option value="clearing_document">Clearing Document</option>
              <option value="grn">GRN</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-download"></i>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-print"></i>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-8 py-4">Document Name</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Size</th>
                <th className="px-8 py-4">Uploaded By</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <i className={`fa-solid ${(doc.fileName || '').endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-image'} text-lg`}></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-700">{doc.fileName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {doc.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {getDocTypeLabel(doc.docType)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 text-sm">
                    {(doc.fileSize / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {(doc.uploadedBy || 'U').charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-600">{doc.uploadedBy}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 text-sm">
                    {formatDate(doc.uploadDate)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Data"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl">
                        <i className="fa-solid fa-folder-open"></i>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">No documents found</p>
                        <p className="text-sm text-slate-500">Try adjusting your filters or upload a new document.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-600/20">
                    <i className="fa-solid fa-file-lines"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedDoc.fileName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                        {getDocTypeLabel(selectedDoc.docType)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Uploaded on {formatDate(selectedDoc.uploadDate)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Extracted Data */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-database text-blue-600"></i> Extracted Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(selectedDoc.extractedData || {}).map(([key, value]) => {
                        if (key === 'confidence_notes') return null;
                        return (
                          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {(key || '').replace(/_/g, ' ')}
                            </div>
                            <div className="font-bold text-slate-700">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document Preview Placeholder */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-image text-blue-600"></i> Visual Preview
                    </h4>
                    <div className="aspect-[3/4] bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden relative group">
                      {selectedDoc.base64Data ? (
                        <img 
                          src={`data:image/png;base64,${selectedDoc.base64Data}`} 
                          alt="Preview" 
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <div className="text-center space-y-2">
                          <i className="fa-solid fa-file-pdf text-4xl"></i>
                          <p className="text-xs font-bold">Preview not available</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-800 hover:scale-110 transition-transform">
                          <i className="fa-solid fa-magnifying-glass-plus"></i>
                        </button>
                        <button 
                          onClick={() => handleDownload(selectedDoc)}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-800 hover:scale-110 transition-transform"
                        >
                          <i className="fa-solid fa-download"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-link text-blue-600"></i> Link to Record
                  </button>
                  <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-purple-600"></i> Re-extract
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="px-8 py-2.5 bg-[#1F4E79] text-white rounded-xl font-bold text-sm hover:bg-[#163a5a] transition-colors shadow-lg shadow-blue-900/20"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
