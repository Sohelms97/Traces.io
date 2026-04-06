export interface PaymentSchedule {
  id: string;
  investorId: string;
  investmentId: string;
  cycleNumber: number;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'upcoming' | 'paid' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
  paymentMode?: string;
  referenceNumber?: string;
  receiptBase64?: string;
  recordedBy?: string;
  recordedDate?: string;
  notes?: string;
}

export function updatePaymentStatuses(schedules: PaymentSchedule[]) {
  const today = new Date();
  
  return schedules.map((s: PaymentSchedule) => {
    if (s.status === 'upcoming') {
      const dueDate = new Date(s.dueDate);
      if (dueDate < today) {
        return { ...s, status: 'overdue' };
      }
    }
    return s;
  });
}

export function getInvestorAging(investorId: string, schedules: PaymentSchedule[]) {
  const investorSchedules = schedules.filter((s: PaymentSchedule) => s.investorId === investorId);
  
  const overdue = investorSchedules.filter((s: PaymentSchedule) => s.status === 'overdue');
  const totalOverdue = overdue.reduce((sum: number, s: PaymentSchedule) => sum + s.amount, 0);
  
  return {
    overdueCount: overdue.length,
    totalOverdue,
    nextPayment: investorSchedules.find((s: PaymentSchedule) => s.status === 'upcoming')
  };
}

export function generateReminderMessage(investorName: string, amount: number, currency: string, dueDate: string) {
  return `Dear ${investorName},\n\nThis is a friendly reminder regarding your investment return of ${amount} ${currency} which was due on ${dueDate}. Please let us know if you have any questions.\n\nBest regards,\nFarmers Market Asia`;
}

export function getInvestmentSummary(investorId: string, investors: any[], investments: any[], schedules: any[]) {
  const investor = investors.find((i: any) => i.id === investorId);
  const investment = investments.find((i: any) => i.investorId === investorId);
  const investorSchedules = schedules.filter((s: any) => s.investorId === investorId);
  
  if (!investor || !investment) return null;
  
  const totalPaid = investorSchedules
    .filter((s: any) => s.status === 'paid')
    .reduce((sum: number, s: any) => sum + (s.paidAmount || 0), 0);
    
  const balance = investment.totalProfit - totalPaid;
  
  return {
    investor,
    investment,
    totalPaid,
    balance,
    completionPercent: (totalPaid / investment.totalProfit) * 100
  };
}
