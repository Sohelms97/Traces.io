import { useState, useEffect } from 'react';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  module: string;
  date: string;
  isRead: boolean;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Generate alerts based on data in localStorage
    const newAlerts: Alert[] = [];
    
    // 1. Container Aging
    const containers = JSON.parse(localStorage.getItem('traces_containers') || '[]');
    containers.forEach((c: any) => {
      const arrivalDate = new Date(c.arrivalDate);
      const diffDays = Math.ceil((new Date().getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays > 30 && c.status !== 'Cleared') {
        newAlerts.push({
          id: `cont-${c.id}`,
          title: 'Container Aging Alert',
          message: `Container ${c.containerNumber} has been at port for ${diffDays} days.`,
          severity: diffDays > 45 ? 'critical' : 'warning',
          module: 'Containers',
          date: new Date().toISOString(),
          isRead: false
        });
      }
    });

    // 2. Accounts Receivable Aging
    const sales = JSON.parse(localStorage.getItem('traces_sales') || '[]');
    sales.forEach((s: any) => {
      if (s.status === 'Invoiced' || s.status === 'Partial') {
        const invoiceDate = new Date(s.date);
        const diffDays = Math.ceil((new Date().getTime() - invoiceDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 30) {
          newAlerts.push({
            id: `sale-${s.id}`,
            title: 'Overdue Payment',
            message: `Invoice for ${s.customer} is ${diffDays} days overdue.`,
            severity: diffDays > 60 ? 'critical' : 'warning',
            module: 'Sales',
            date: new Date().toISOString(),
            isRead: false
          });
        }
      }
    });

    // 3. Low Inventory
    const inventory = JSON.parse(localStorage.getItem('traces_inventory') || '[]');
    inventory.forEach((i: any) => {
      if (i.quantity < 100) {
        newAlerts.push({
          id: `inv-${i.id}`,
          title: 'Low Stock Alert',
          message: `${i.productName} is running low (${i.quantity} units left).`,
          severity: i.quantity < 20 ? 'critical' : 'warning',
          module: 'Inventory',
          date: new Date().toISOString(),
          isRead: false
        });
      }
    });

    setAlerts(newAlerts);
  }, []);

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  return { alerts, markAsRead };
}
