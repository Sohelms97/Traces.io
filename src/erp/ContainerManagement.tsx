import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const initialContainers = [
  { id: 'TFC/EX026/25', supplier: 'Tabuk Fisheries', product: 'Sea Bream', origin: 'Saudi Arabia', qty: '12,000 KG', purchaseValue: '280,000', totalCost: '312,360', saleQty: '12,000 KG', totalSales: '322,200', gp: '9,840', roi: '3.15%', status: 'Closed', month: 'Nov 2025' },
  { id: 'FBIU5326683', supplier: 'Hong Long Seafood', product: 'Keski', origin: 'Vietnam', qty: '3,000 Box', purchaseValue: '100,000', totalCost: '115,036', saleQty: '3,000 Box', totalSales: '131,850', gp: '16,814', roi: '14.62%', status: 'Closed', month: 'Dec 2025' },
  { id: 'Inv.34', supplier: 'FMA Pakistan', product: 'Squid', origin: 'Pakistan', qty: '2,260 Box', purchaseValue: '280,000', totalCost: '325,890', saleQty: '2,260 Box', totalSales: '312,610', gp: '-13,280', roi: '-4.08%', status: 'Closed', month: 'Dec 2025' },
  { id: 'SZLU9069865', supplier: 'PAKTHAI IMPEX', product: 'Rohu', origin: 'Thailand', qty: '27,000 KG', purchaseValue: '150,000', totalCost: '165,000', saleQty: '0', totalSales: '0', gp: '0', roi: '0%', status: 'Open', month: 'Jan 2026' },
  { id: 'OTPU6690769', supplier: 'QUE KY FOODS', product: 'Pangasius Fillet', origin: 'Vietnam', qty: '25,000 KG', purchaseValue: '110,000', totalCost: '121,477', saleQty: '0', totalSales: '0', gp: '0', roi: '0%', status: 'Open', month: 'Feb 2026' },
];

export default function ContainerManagement() {
  const [containers, setContainers] = useState(initialContainers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editingContainer, setEditingContainer] = useState<any>(null);
  const [containerToDelete, setContainerToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    supplier: '',
    product: '',
    origin: '',
    qty: '',
    purchaseValue: '',
    status: 'Open'
  });

  const filteredContainers = containers.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenNewModal = () => {
    setEditingContainer(null);
    setFormData({
      id: '',
      supplier: '',
      product: '',
      origin: '',
      qty: '',
      purchaseValue: '',
      status: 'Open'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (container: any) => {
    setEditingContainer(container);
    setFormData({
      id: container.id,
      supplier: container.supplier,
      product: container.product,
      origin: container.origin,
      qty: container.qty,
      purchaseValue: container.purchaseValue,
      status: container.status
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (container: any) => {
    setContainerToDelete(container);
    setIsDeleteModalOpen(true);
  };

  const handleSave = () => {
    if (editingContainer) {
      setContainers(containers.map(c => c.id === editingContainer.id ? { ...c, ...formData } : c));
    } else {
      const newContainer = {
        ...formData,
        totalCost: (parseFloat(formData.purchaseValue.replace(/,/g, '')) * 1.1).toLocaleString(),
        saleQty: '0',
        totalSales: '0',
        gp: '0',
        roi: '0%',
        month: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
      };
      setContainers([newContainer, ...containers]);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    setContainers(containers.filter(c => c.id !== containerToDelete.id));
    setIsDeleteModalOpen(false);
    setContainerToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search containers..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fa-solid fa-file-excel text-green-600"></i> Export Excel
          </button>
          <button 
            onClick={handleOpenNewModal}
            className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
          >
            <i className="fa-solid fa-plus"></i> New Container
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Container No.</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4 text-right">Purchase (SAR)</th>
                <th className="px-6 py-4 text-right">Sales (SAR)</th>
                <th className="px-6 py-4 text-right">GP (SAR)</th>
                <th className="px-6 py-4 text-right">ROI</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredContainers.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.id}</td>
                  <td className="px-6 py-4 text-slate-600">{row.supplier}</td>
                  <td className="px-6 py-4 text-slate-600">{row.product}</td>
                  <td className="px-6 py-4 text-slate-500">{row.qty}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.purchaseValue}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.totalSales}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{row.gp}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${row.roi.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                      {row.roi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${row.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedContainer(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="View"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(row)}
                        className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" title="Edit"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(row)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedContainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContainer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <div>
                  <h2 className="text-xl font-bold">Container Details: {selectedContainer.id}</h2>
                  <p className="text-white/60 text-sm">{selectedContainer.supplier} | {selectedContainer.month}</p>
                </div>
                <button onClick={() => setSelectedContainer(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Product Info</div>
                    <div className="font-bold text-slate-800">{selectedContainer.product}</div>
                    <div className="text-sm text-slate-500">{selectedContainer.origin}</div>
                    <div className="text-sm text-slate-500 mt-2">Qty: {selectedContainer.qty}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Financial Summary</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Purchase:</span>
                      <span className="font-bold text-slate-800">SAR {selectedContainer.purchaseValue}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Total Cost:</span>
                      <span className="font-bold text-slate-800">SAR {selectedContainer.totalCost}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200 mt-1">
                      <span className="text-slate-500">Sales:</span>
                      <span className="font-bold text-slate-800">SAR {selectedContainer.totalSales}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Performance</div>
                    <div className="text-2xl font-bold text-green-600">{selectedContainer.roi}</div>
                    <div className="text-sm text-slate-500">Gross Profit: SAR {selectedContainer.gp}</div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${selectedContainer.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    `}>
                      {selectedContainer.status}
                    </div>
                  </div>
                </div>

                {/* Traceability Timeline */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-route text-[#1F4E79]"></i> Traceability Timeline
                  </h3>
                  <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                    {[
                      { step: 'Order Confirmed', date: 'Oct 15, 2025', status: 'Completed', icon: 'fa-file-invoice' },
                      { step: 'Quality Inspection', date: 'Oct 22, 2025', status: 'Completed', icon: 'fa-microscope' },
                      { step: 'Shipped from Port', date: 'Nov 02, 2025', status: 'Completed', icon: 'fa-ship' },
                      { step: 'Arrived at Destination', date: 'Nov 25, 2025', status: 'Completed', icon: 'fa-warehouse' },
                      { step: 'Customs Cleared', date: 'Nov 28, 2025', status: 'Completed', icon: 'fa-shield-halved' },
                    ].map((item, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-2 border-green-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <i className={`fa-solid ${item.icon} text-slate-400 text-xs`}></i>
                            {item.step}
                          </div>
                          <div className="text-xs text-slate-400">{item.date} • {item.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-paperclip text-[#1F4E79]"></i> Attached Documents
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Invoice', 'BL', 'Packing List', 'SWIFT', 'Inspection', 'GRN'].map((doc, i) => (
                      <button key={i} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center gap-2">
                        <i className="fa-solid fa-file-pdf text-red-500 text-2xl"></i>
                        <span className="text-xs font-bold text-slate-600">{doc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New/Edit Container Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingContainer ? 'Edit Container' : 'Add New Container'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl text-slate-400"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Container No.</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. TFC/EX040" 
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    >
                      <option value="">Select Supplier</option>
                      <option value="Tabuk Fisheries">Tabuk Fisheries</option>
                      <option value="QUE KY FOODS">QUE KY FOODS</option>
                      <option value="Hong Long Seafood">Hong Long Seafood</option>
                      <option value="FMA Pakistan">FMA Pakistan</option>
                      <option value="PAKTHAI IMPEX">PAKTHAI IMPEX</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. Sea Bream" 
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. Saudi Arabia" 
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 12,000 KG" 
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Value (SAR)</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      placeholder="e.g. 280,000" 
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {editingContainer ? 'Update Container' : 'Save Container'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Confirm Deletion</h2>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete container <span className="font-bold text-slate-700">{containerToDelete?.id}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
