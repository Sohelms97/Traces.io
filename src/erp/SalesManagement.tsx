import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function SalesManagement() {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'receivables'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { isAdmin } = useAuth();

  // Form States
  const [orderForm, setOrderForm] = useState({
    id: '',
    customer: '',
    product: '',
    container: '',
    qty: '',
    price: '',
    type: 'Credit',
    status: 'Pending',
    due: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    status: 'Active'
  });

  useEffect(() => {
    const orderQuery = query(collection(db, 'sales_orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(orderQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const defaultOrders = [
          { id: 'INV-101', customer: 'Abdullah Bin Hathboor', product: 'Sea Bream', container: 'TFC/EX026/25', qty: '5,000', price: '26.85', total: '134,250', type: 'Credit', status: 'Paid', due: 'Dec 30, 2025', createdAt: serverTimestamp() },
          { id: 'INV-102', customer: 'Bait Al Qaseed', product: 'Sea Bream', container: 'TFC/EX026/25', qty: '7,000', price: '26.85', total: '187,950', type: 'Credit', status: 'Paid', due: 'Dec 30, 2025', createdAt: serverTimestamp() },
        ];
        defaultOrders.forEach(async (order) => {
          await setDoc(doc(db, 'sales_orders', order.id), order);
        });
      } else {
        setOrders(docs);
      }
    });

    const customerQuery = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribeCustomers = onSnapshot(customerQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (docs.length === 0) {
        const initialCustomers = [
          { id: 'C-001', name: 'Abdullah Bin Hathboor', orders: 12, value: '1,450,000', balance: '0', status: 'Active', createdAt: serverTimestamp() },
          { id: 'C-002', name: 'Bait Al Qaseed', orders: 8, value: '820,000', balance: '37,500', status: 'Active', createdAt: serverTimestamp() },
        ];
        initialCustomers.forEach(async (c) => {
          await setDoc(doc(db, 'customers', c.id), c);
        });
      } else {
        setCustomers(docs);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCustomers();
    };
  }, []);

  const handleOpenModal = (item?: any) => {
    if (activeTab === 'orders') {
      if (item) {
        setEditingOrder(item);
        setOrderForm({
          id: item.id,
          customer: item.customer,
          product: item.product,
          container: item.container,
          qty: item.qty,
          price: item.price,
          type: item.type,
          status: item.status,
          due: item.due
        });
      } else {
        setEditingOrder(null);
        setOrderForm({ id: '', customer: '', product: '', container: '', qty: '', price: '', type: 'Credit', status: 'Pending', due: '' });
      }
    } else if (activeTab === 'customers') {
      if (item) {
        setEditingCustomer(item);
        setCustomerForm({
          name: item.name,
          status: item.status
        });
      } else {
        setEditingCustomer(null);
        setCustomerForm({ name: '', status: 'Active' });
      }
    }
    setIsModalOpen(true);
  };

  const handleSaveOrder = async () => {
    try {
      const total = (parseFloat(orderForm.qty) * parseFloat(orderForm.price)).toLocaleString();
      const orderData = {
        ...orderForm,
        total,
        updatedAt: serverTimestamp(),
        createdAt: editingOrder ? editingOrder.createdAt : serverTimestamp()
      };

      if (editingOrder) {
        await updateDoc(doc(db, 'sales_orders', editingOrder.id), orderData);
      } else {
        const newId = orderForm.id || `INV-${Date.now()}`;
        await setDoc(doc(db, 'sales_orders', newId), { ...orderData, id: newId });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const handleSaveCustomer = async () => {
    try {
      const customerData = {
        ...customerForm,
        updatedAt: serverTimestamp(),
        createdAt: editingCustomer ? editingCustomer.createdAt : serverTimestamp(),
        orders: editingCustomer ? editingCustomer.orders : 0,
        value: editingCustomer ? editingCustomer.value : '0',
        balance: editingCustomer ? editingCustomer.balance : '0'
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
      } else {
        const newId = `C-${Date.now()}`;
        await setDoc(doc(db, 'customers', newId), { ...customerData, id: newId });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'sales_orders', id));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sales Orders
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customers' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Customer Master
        </button>
        <button 
          onClick={() => setActiveTab('receivables')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'receivables' ? 'bg-white text-[#1F4E79] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Accounts Receivable
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'orders' ? 'invoices' : 'customers'}...`} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                <i className="fa-solid fa-receipt"></i> Payment Receipt
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-[#1F4E79] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#163a5a] transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus"></i> 
                {activeTab === 'orders' ? 'New Sales Invoice' : 'Add New Customer'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Container</th>
                  <th className="px-6 py-4 text-right">Qty Sold</th>
                  <th className="px-6 py-4 text-right">Total Sales (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((order, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{order.id}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{order.product}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{order.container}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{order.qty}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#1F4E79]">{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><i className="fa-solid fa-eye"></i></button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(order)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'customers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4 text-center">Total Orders</th>
                  <th className="px-6 py-4 text-right">Total Value (SAR)</th>
                  <th className="px-6 py-4 text-right">Outstanding (SAR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {customers.map((customer, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{customer.name}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{customer.orders}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{customer.value}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{customer.balance}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(customer)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-user-pen"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice No.</th>
                  <th className="px-6 py-4 text-right">Amount (SAR)</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Days Overdue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.filter(o => o.status !== 'Paid').map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all duration-200 group relative">
                    <td className="px-6 py-4 font-bold text-slate-700">{row.customer}</td>
                    <td className="px-6 py-4 text-slate-600">{row.id}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.total}</td>
                    <td className="px-6 py-4 text-slate-500">{row.due}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">Overdue</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Follow-up Log">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1F4E79] text-white">
                <h2 className="text-xl font-bold">
                  {activeTab === 'orders' 
                    ? (editingOrder ? 'Edit Sales Invoice' : 'New Sales Invoice') 
                    : (editingCustomer ? 'Edit Customer' : 'Add New Customer')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {activeTab === 'orders' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No.</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. INV-101"
                          value={orderForm.id}
                          onChange={(e) => setOrderForm({ ...orderForm, id: e.target.value })}
                          disabled={!!editingOrder}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={orderForm.customer}
                          onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
                        >
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. Sea Bream"
                          value={orderForm.product}
                          onChange={(e) => setOrderForm({ ...orderForm, product: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Container</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. TFC/EX026/25"
                          value={orderForm.container}
                          onChange={(e) => setOrderForm({ ...orderForm, container: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Sold</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={orderForm.qty}
                          onChange={(e) => setOrderForm({ ...orderForm, qty: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (SAR)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={orderForm.price}
                          onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={orderForm.status}
                          onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Type</label>
                        <select 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                          value={orderForm.type}
                          onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                        >
                          <option value="Credit">Credit</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900" 
                          placeholder="e.g. Dec 30, 2025"
                          value={orderForm.due}
                          onChange={(e) => setOrderForm({ ...orderForm, due: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500">Total Sales:</span>
                      <span className="text-xl font-bold text-[#1F4E79]">
                        SAR {(parseFloat(orderForm.qty || '0') * parseFloat(orderForm.price || '0')).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                      <select 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900"
                        value={customerForm.status}
                        onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={activeTab === 'orders' ? handleSaveOrder : handleSaveCustomer}
                    className="px-6 py-2 bg-[#1F4E79] text-white rounded-lg font-bold hover:bg-[#163a5a] transition-colors"
                  >
                    {activeTab === 'orders' 
                      ? (editingOrder ? 'Update Invoice' : 'Create Invoice') 
                      : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
