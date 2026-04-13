import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportExcelModal from '../components/ImportExcelModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function SalesManagement() {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'receivables'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const { isAdmin } = useAuth();
  const [tempDocuments, setTempDocuments] = useState<{ data: any, files: { file: File; base64: string }[] } | null>(null);
  const [isPreFillModalOpen, setIsPreFillModalOpen] = useState(false);

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = React.useMemo(() => {
    let data = activeTab === 'orders' ? orders : activeTab === 'customers' ? customers : orders.filter(o => o.status !== 'Paid');
    let result = data.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      if (activeTab === 'orders' || activeTab === 'receivables') {
        return (item.id || '').toLowerCase().includes(searchStr) ||
               (item.customer || '').toLowerCase().includes(searchStr) ||
               (item.product || '').toLowerCase().includes(searchStr);
      } else {
        return (item.name || '').toLowerCase().includes(searchStr) ||
               (item.id || '').toLowerCase().includes(searchStr);
      }
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [activeTab, orders, customers, searchTerm, sortConfig]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    let exportData;
    if (activeTab === 'orders') {
      exportData = filteredData.map(order => ({
        'Invoice No.': order.id,
        'Customer': order.customer,
        'Product': order.product,
        'Container': order.container,
        'Qty': order.qty,
        'Price': order.price,
        'Total': order.total,
        'Type': order.type,
        'Status': order.status,
        'Due Date': order.due
      }));
    } else if (activeTab === 'customers') {
      exportData = filteredData.map(customer => ({
        'Customer ID': customer.id,
        'Customer Name': customer.name,
        'Total Orders': customer.orders,
        'Total Value': customer.value,
        'Balance': customer.balance,
        'Status': customer.status
      }));
    } else {
      exportData = filteredData.map(order => ({
        'Customer': order.customer,
        'Invoice No.': order.id,
        'Amount (AED)': order.total,
        'Due Date': order.due,
        'Status': order.status
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const sheetName = activeTab === 'orders' ? 'Sales Orders' : activeTab === 'customers' ? 'Customers' : 'Accounts Receivable';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName.replace(/\s+/g, '')}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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

  const handleDocumentSave = (data: any, files: { file: File; base64: string }[]) => {
    const sales = data.sales || {};
    const logistics = data.logistics || {};
    
    setOrderForm(prev => ({
      ...prev,
      id: sales.invoice_number || prev.id,
      customer: sales.customer_name || prev.customer,
      product: sales.items?.[0]?.description || prev.product,
      container: logistics.container_number || prev.container,
      qty: sales.items?.[0]?.quantity || prev.qty,
      price: sales.items?.[0]?.unit_price || prev.price,
      due: sales.due_date || prev.due,
    }));

    setTempDocuments({ data, files });
    setIsPreFillModalOpen(false);
  };

  const handleSaveOrder = async () => {
    try {
      const qtyNum = parseFloat(orderForm.qty) || 0;
      const priceNum = parseFloat(orderForm.price) || 0;
      const total = (qtyNum * priceNum).toLocaleString();
      const orderData = {
        ...orderForm,
        qty: qtyNum,
        price: priceNum,
        total,
        updatedAt: serverTimestamp(),
        createdAt: editingOrder ? editingOrder.createdAt : serverTimestamp()
      };

      const orderId = orderForm.id || `INV-${Date.now()}`;
      if (editingOrder) {
        await updateDoc(doc(db, 'sales_orders', editingOrder.id), orderData);
      } else {
        await setDoc(doc(db, 'sales_orders', orderId), { ...orderData, id: orderId });

        // Save temporary documents if any
        if (tempDocuments) {
          const { data, files } = tempDocuments;
          const { saveExtractedData } = await import('../lib/document-router');
          
          for (const f of files) {
            await saveExtractedData({
              fileName: f.file.name,
              fileSize: f.file.size,
              base64Data: f.base64,
              documentType: data.document_type || 'Auto-Detect',
              extractedData: data,
              linkedRecordId: orderId
            });
          }
          setTempDocuments(null);
        }
      }

      // SYNC: Update Inventory, Containers, and Customers
      if (!editingOrder && orderForm.customer) {
        try {
          const qtyNum = parseFloat(orderForm.qty) || 0;
          const priceNum = parseFloat(orderForm.price) || 0;
          const totalVal = qtyNum * priceNum;

          // 1. Update Inventory and movements if container is specified
          if (orderForm.container) {
            const containerId = orderForm.container.trim().replace(/\//g, '-');
            const inventoryId = `${orderForm.product}-${containerId}`.replace(/\//g, '-');

            try {
              await updateDoc(doc(db, 'inventory', inventoryId), {
                qtySold: increment(qtyNum),
                updatedAt: serverTimestamp()
              });
              
              const movId = `MOV-${Date.now()}`;
              await setDoc(doc(db, 'inventory_movements', movId), {
                date: new Date().toLocaleDateString(),
                product: orderForm.product,
                container: orderForm.container,
                type: 'OUT',
                qty: `${qtyNum} KG`,
                ref: orderId,
                by: auth.currentUser?.email || 'System',
                createdAt: serverTimestamp()
              });
            } catch (e) {
              console.error("Error updating inventory:", e);
            }

            // 2. Update Container with auto-status logic
            try {
              const containerRef = doc(db, 'containers', containerId);
              const containerSnap = await getDoc(containerRef);
              if (containerSnap.exists()) {
                const cData = containerSnap.data();
                const currentSaleQty = parseFloat(String(cData.saleQty || '0').replace(/[^0-9.]/g, '')) || 0;
                const currentTotalSales = parseFloat(String(cData.totalSales || '0').replace(/,/g, '')) || 0;
                
                const newSaleQty = currentSaleQty + qtyNum;
                const newTotalSales = currentTotalSales + totalVal;
                
                const q = String(cData.qty || '').replace(/[^0-9.]/g, '');
                const pVal = parseFloat(String(cData.purchaseValue || '0').replace(/,/g, ''));
                
                let newStatus = cData.status || 'Open';
                if (q !== '' && q === String(newSaleQty) && newTotalSales >= pVal && pVal > 0) {
                  newStatus = 'Closed';
                }

                await updateDoc(containerRef, {
                  saleQty: newSaleQty,
                  totalSales: newTotalSales,
                  status: newStatus,
                  updatedAt: serverTimestamp()
                });
              }
            } catch (e) {
              console.error("Error updating container:", e);
            }
          }

          // 3. Update Customer
          try {
            const customer = customers.find(c => c.name === orderForm.customer);
            if (customer) {
              await updateDoc(doc(db, 'customers', customer.id), {
                orders: increment(1),
                value: increment(totalVal),
                balance: orderForm.status === 'Paid' ? increment(0) : increment(totalVal),
                updatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Error updating customer:", e);
          }
        } catch (e) {
          console.error("Error in sync logic:", e);
        }
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

  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order);
    setIsDeleteOrderModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      const orderId = orderToDelete.id;
      const qtyNum = parseFloat(orderToDelete.qty) || 0;
      const priceNum = parseFloat(orderToDelete.price) || 0;
      const totalVal = qtyNum * priceNum;

      // SYNC: Revert changes in Inventory, Containers, and Customers
      try {
        // 1. Revert Inventory
        if (orderToDelete.container) {
          const containerId = orderToDelete.container.trim().replace(/\//g, '-');
          const inventoryId = `${orderToDelete.product}-${containerId}`.replace(/\//g, '-');
          
          try {
            await updateDoc(doc(db, 'inventory', inventoryId), {
              qtySold: increment(-qtyNum),
              updatedAt: serverTimestamp()
            });

            // Log reversal movement
            const movId = `MOV-REV-${Date.now()}`;
            await setDoc(doc(db, 'inventory_movements', movId), {
              date: new Date().toLocaleDateString(),
              product: orderToDelete.product,
              container: orderToDelete.container,
              type: 'IN',
              qty: `${qtyNum} KG`,
              ref: `REV-${orderId}`,
              by: auth.currentUser?.email || 'System',
              createdAt: serverTimestamp()
            });
          } catch (e) {}

          // 2. Revert Container
          try {
            await updateDoc(doc(db, 'containers', containerId), {
              saleQty: increment(-qtyNum),
              totalSales: increment(-totalVal),
              status: 'Open', // Reverting a sale opens the container back up
              updatedAt: serverTimestamp()
            });
          } catch (e) {}
        }

        // 3. Revert Customer
        try {
          const customer = customers.find(c => c.name === orderToDelete.customer);
          if (customer) {
            await updateDoc(doc(db, 'customers', customer.id), {
              orders: increment(-1),
              value: increment(-totalVal),
              balance: orderToDelete.status === 'Paid' ? increment(0) : increment(-totalVal),
              updatedAt: serverTimestamp()
            });
          }
        } catch (e) {}
      } catch (e) {
        console.error("Error in delete sync logic:", e);
      }

      await deleteDoc(doc(db, 'sales_orders', orderId));
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleDeleteCustomer = (customer: any) => {
    setCustomerToDelete(customer);
    setIsDeleteCustomerModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await deleteDoc(doc(db, 'customers', customerToDelete.id));
      setCustomerToDelete(null);
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={handleExportExcel}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-green-600" /> Export Excel
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-file-import"></i> Import Excel
              </button>
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
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      Invoice No. {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center gap-1">
                      Customer {sortConfig?.key === 'customer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product')}>
                    <div className="flex items-center gap-1">
                      Product {sortConfig?.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('container')}>
                    <div className="flex items-center gap-1">
                      Container {sortConfig?.key === 'container' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qty')}>
                    <div className="flex items-center justify-end gap-1">
                      Qty Sold {sortConfig?.key === 'qty' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-1">
                      Total Sales (AED) {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((order, i) => (
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
                              onClick={() => handleDeleteOrder(order)}
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
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Customer Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('orders')}>
                    <div className="flex items-center justify-center gap-1">
                      Total Orders {sortConfig?.key === 'orders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('value')}>
                    <div className="flex items-center justify-end gap-1">
                      Total Value (AED) {sortConfig?.key === 'value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('balance')}>
                    <div className="flex items-center justify-end gap-1">
                      Outstanding (AED) {sortConfig?.key === 'balance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((customer, i) => (
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
                              onClick={() => handleDeleteCustomer(customer)}
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
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center gap-1">
                      Customer {sortConfig?.key === 'customer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      Invoice No. {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-1">
                      Amount (AED) {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('due')}>
                    <div className="flex items-center gap-1">
                      Due Date {sortConfig?.key === 'due' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Days Overdue</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((row, i) => (
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
                {activeTab === 'orders' && !editingOrder && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Pre-fill</p>
                        <p className="text-[10px] text-blue-700">Upload Sales Order or Invoice to auto-complete this form</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPreFillModalOpen(true)}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                    >
                      {tempDocuments ? 'Change Document' : 'Upload Document'}
                    </button>
                  </div>
                )}

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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (AED)</label>
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
                        AED {(parseFloat(orderForm.qty || '0') * parseFloat(orderForm.price || '0')).toLocaleString()}
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

      <ConfirmationModal 
        isOpen={isDeleteOrderModalOpen}
        onClose={() => setIsDeleteOrderModalOpen(false)}
        onConfirm={confirmDeleteOrder}
        title="Confirm Order Deletion"
        message={`Are you sure you want to delete order ${orderToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete Order"
      />

      <ConfirmationModal 
        isOpen={isDeleteCustomerModalOpen}
        onClose={() => setIsDeleteCustomerModalOpen(false)}
        onConfirm={confirmDeleteCustomer}
        title="Confirm Customer Deletion"
        message={`Are you sure you want to delete customer ${customerToDelete?.name}? This will remove all their contact information.`}
        confirmText="Delete Customer"
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (data) => {
          const batch = writeBatch(db);
          const collectionName = activeTab === 'orders' ? 'sales_orders' : 'customers';
          data.forEach((item) => {
            const id = item.id || (activeTab === 'orders' ? `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` : `C-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
            const docRef = doc(db, collectionName, id);
            batch.set(docRef, {
              ...item,
              id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }}
        schema={activeTab === 'orders' ? {
          id: { label: 'Invoice No.', required: true },
          customer: { label: 'Customer', required: true },
          product: { label: 'Product', required: true },
          container: { label: 'Container' },
          qty: { label: 'Qty Sold', type: 'number' },
          price: { label: 'Price (AED)', type: 'number' },
          type: { label: 'Payment Type' },
          status: { label: 'Status' },
          due: { label: 'Due Date', type: 'date' }
        } : {
          name: { label: 'Customer Name', required: true },
          status: { label: 'Status' }
        }}
        templateData={activeTab === 'orders' ? [
          { 'Invoice No.': 'INV-1001', 'Customer': 'Lulu', 'Product': 'Mango', 'Container': 'CONT-001', 'Qty Sold': 100, 'Price (AED)': 50, 'Payment Type': 'Credit', 'Status': 'Delivered', 'Due Date': '2024-01-01' }
        ] : [
          { 'Customer Name': 'John Doe', 'Status': 'Active' }
        ]}
        title={`Import ${activeTab === 'orders' ? 'Sales Orders' : 'Customers'}`}
      />

      {activeTab === 'orders' && (
        <DocumentUploadModal
          isOpen={isPreFillModalOpen}
          onClose={() => setIsPreFillModalOpen(false)}
          onSave={handleDocumentSave}
          initialDocType="Auto-Detect"
        />
      )}
    </div>
  );
}
