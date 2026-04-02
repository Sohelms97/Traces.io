export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'positive' | 'info';
  message: string;
  module: string;
  recordId: string;
  timestamp: string;
  isRead: boolean;
}

export function runAgingAnalysis() {
  const alerts: Alert[] = [];
  const now = new Date();

  // 1. Containers Aging
  const containers = JSON.parse(localStorage.getItem('traces_containers') || '[]');
  containers.forEach((c: any) => {
    const createdDate = new Date(c.createdAt || c.lastUpdated);
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 60) {
      alerts.push(createAlert('critical', `Container ${c.id} open for 60+ days`, 'Containers', c.id));
    } else if (diffDays >= 30) {
      alerts.push(createAlert('warning', `Container ${c.id} open for 30+ days`, 'Containers', c.id));
    }
  });

  // 2. Accounts Receivable Aging
  const ar = JSON.parse(localStorage.getItem('traces_accounts_receivable') || '[]');
  ar.forEach((item: any) => {
    const dueDate = new Date(item.dueDate);
    const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
      alerts.push(createAlert('critical', `Payment ${item.id} overdue by 60+ days`, 'AR', item.id));
    } else if (diffDays > 30) {
      alerts.push(createAlert('warning', `Payment ${item.id} overdue by 30+ days`, 'AR', item.id));
    }
  });

  // 3. Inventory Aging (Seafood)
  const inventory = JSON.parse(localStorage.getItem('traces_warehouse') || '[]');
  inventory.forEach((item: any) => {
    const receivedDate = new Date(item.date || item.lastUpdated);
    const diffDays = Math.floor((now.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (item.category === 'Seafood' || item.isPerishable) {
      if (diffDays >= 14) {
        alerts.push(createAlert('critical', `Perishable item ${item.id} in stock for 14+ days`, 'Inventory', item.id));
      } else if (diffDays >= 7) {
        alerts.push(createAlert('warning', `Perishable item ${item.id} in stock for 7+ days`, 'Inventory', item.id));
      }
    } else {
      if (diffDays >= 60) {
        alerts.push(createAlert('critical', `Item ${item.id} in stock for 60+ days`, 'Inventory', item.id));
      } else if (diffDays >= 30) {
        alerts.push(createAlert('warning', `Item ${item.id} in stock for 30+ days`, 'Inventory', item.id));
      }
    }
  });

  // 4. Investments Aging
  const investments = JSON.parse(localStorage.getItem('traces_investors') || '[]');
  investments.forEach((inv: any) => {
    const returnDate = new Date(inv.expectedReturnDate);
    const diffDays = Math.floor((returnDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push(createAlert('critical', `Investment ${inv.id} return date passed`, 'Investments', inv.id));
    } else if (diffDays <= 7) {
      alerts.push(createAlert('warning', `Investment ${inv.id} return due within 7 days`, 'Investments', inv.id));
    }
  });

  // Save alerts to localStorage
  const existingAlerts = JSON.parse(localStorage.getItem('traces_alerts') || '[]');
  // Avoid duplicates by checking message and recordId
  const newAlerts = alerts.filter(a => !existingAlerts.some((ea: any) => ea.message === a.message && ea.recordId === a.recordId));
  
  if (newAlerts.length > 0) {
    localStorage.setItem('traces_alerts', JSON.stringify([...existingAlerts, ...newAlerts]));
  }
}

function createAlert(severity: Alert['severity'], message: string, module: string, recordId: string): Alert {
  return {
    id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    severity,
    message,
    module,
    recordId,
    timestamp: new Date().toISOString(),
    isRead: false
  };
}

export function getUnreadAlertsCount(): number {
  const alerts = JSON.parse(localStorage.getItem('traces_alerts') || '[]');
  return alerts.filter((a: Alert) => !a.isRead).length;
}
