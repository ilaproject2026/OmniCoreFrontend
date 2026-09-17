import { apiClient } from './client';
import { Invoice, Payment } from '../types';
import { MOCK_INVOICES, MOCK_PAYMENTS, MOCK_TRIPS, MOCK_MAINTENANCE } from './mockData';

let invoicesState: Invoice[] = [...MOCK_INVOICES];
let paymentsState: Payment[] = [...MOCK_PAYMENTS];

export interface FinanceSummary {
  totalRevenue: number;
  totalCollections: number;
  outstandingBalance: number;
  fuelExpenses: number;
  tollExpenses: number;
  maintenanceExpenses: number;
  payrollExpenses: number;
  totalOperatingExpenses: number;
  netMargin: number;
  monthlyRevenueSeries: { month: string; revenue: number; expenses: number; profit: number }[];
}

export const financeApi = {
  getSummary: async (): Promise<FinanceSummary> => {
    try {
      const response = await apiClient.get<FinanceSummary>('/finance/summary/');
      return response.data;
    } catch {
      // Dynamically calculate financial health from live transactional mock data
      const totalRevenue = invoicesState.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
      const totalCollections = paymentsState.reduce((acc, p) => acc + (p.amount || 0), 0);
      const outstandingBalance = invoicesState.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

      let fuelExpenses = 0;
      let tollExpenses = 0;
      MOCK_TRIPS.forEach((t) => {
        (t.expenses || []).forEach((e) => {
          if (e.category === 'fuel') fuelExpenses += e.amount;
          else if (e.category === 'toll') tollExpenses += e.amount;
        });
      });

      const maintenanceExpenses = MOCK_MAINTENANCE.reduce((acc, m) => acc + (m.totalCost || 0), 0);
      const payrollExpenses = 142000;
      const totalExpenses = fuelExpenses + tollExpenses + maintenanceExpenses + payrollExpenses;
      const netMargin = totalRevenue - totalExpenses;

      return {
        totalRevenue: totalRevenue || 486500,
        totalCollections: totalCollections || 258728,
        outstandingBalance: outstandingBalance || 227772,
        fuelExpenses: fuelExpenses || 78400,
        tollExpenses: tollExpenses || 12600,
        maintenanceExpenses: maintenanceExpenses || 28900,
        payrollExpenses,
        totalOperatingExpenses: totalExpenses || 119900,
        netMargin: netMargin > 0 ? netMargin : 224600,
        monthlyRevenueSeries: [
          { month: 'Apr', revenue: 72000, expenses: 48000, profit: 24000 },
          { month: 'May', revenue: 84000, expenses: 53000, profit: 31000 },
          { month: 'Jun', revenue: 98000, expenses: 61000, profit: 37000 },
          { month: 'Jul', revenue: 108000, expenses: 68000, profit: 40000 },
          { month: 'Aug', revenue: 114000, expenses: 71000, profit: 43000 },
          { month: 'Sep', revenue: 122000, expenses: 74000, profit: 48000 },
        ],
      };
    }
  },

  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await apiClient.get<Invoice[]>('/finance/invoices/');
      return response.data;
    } catch {
      return invoicesState;
    }
  },

  getPayments: async (): Promise<Payment[]> => {
    try {
      const response = await apiClient.get<Payment[]>('/finance/payments/');
      return response.data;
    } catch {
      return paymentsState;
    }
  },

  createInvoice: async (payload: Partial<Invoice>): Promise<Invoice> => {
    try {
      const response = await apiClient.post<Invoice>('/finance/invoices/', payload);
      return response.data;
    } catch {
      const amount = payload.amount || 5000;
      const tax = Math.round(amount * 0.08);
      const newInv: Invoice = {
        id: 'inv_' + Math.random().toString(36).substring(2, 7),
        invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
        customerId: payload.customerId,
        clientName: payload.clientName || 'General Client Corp',
        tripId: payload.tripId,
        contractId: payload.contractId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount,
        taxAmount: tax,
        totalAmount: amount + tax,
        balanceDue: amount + tax,
        status: 'issued',
        vertical: payload.vertical || 'freight_logistics',
        items: payload.items || [{ description: 'Transport Haulage Billing', quantity: 1, unitPrice: amount, total: amount }],
      };
      invoicesState.unshift(newInv);
      return newInv;
    }
  },

  recordPayment: async (
    invoiceIdOrPayload: string | {
      invoiceId: string;
      amount: number;
      paymentMethod: Payment['paymentMethod'];
      referenceNumber: string;
      bankAccount: string;
      notes?: string;
    },
    optionalPayload?: {
      amount: number;
      paymentMethod: Payment['paymentMethod'];
      referenceNumber: string;
      bankAccount: string;
      notes?: string;
    }
  ): Promise<{ payment: Payment; invoice: Invoice }> => {
    const invoiceId = typeof invoiceIdOrPayload === 'string' ? invoiceIdOrPayload : invoiceIdOrPayload.invoiceId;
    const payload = typeof invoiceIdOrPayload === 'string' ? optionalPayload! : invoiceIdOrPayload;
    try {
      const response = await apiClient.post<{ payment: Payment; invoice: Invoice }>(`/finance/invoices/${invoiceId}/payments/`, payload);
      return response.data;
    } catch {
      const invIndex = invoicesState.findIndex((i) => i.id === invoiceId);
      if (invIndex === -1) throw new Error('Invoice not found');
      const invoice = invoicesState[invIndex];

      const paymentAmount = Math.min(payload.amount, invoice.balanceDue);
      const newBalance = Math.max(0, invoice.balanceDue - paymentAmount);

      const payment: Payment = {
        id: `pay_${Date.now()}`,
        invoiceId,
        customerId: invoice.customerId,
        amount: paymentAmount,
        paymentMethod: payload.paymentMethod || 'bank_transfer',
        referenceNumber: payload.referenceNumber || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
        paidAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        bankAccount: payload.bankAccount || 'Chase Operating •••• 9921',
        notes: payload.notes,
        recordedBy: 'Finance Operations',
      };

      paymentsState.unshift(payment);

      invoice.balanceDue = newBalance;
      invoice.status = newBalance === 0 ? 'paid' : 'partially_paid';
      if (!invoice.payments) invoice.payments = [];
      invoice.payments.push(payment);

      invoicesState[invIndex] = { ...invoice };

      return { payment, invoice: invoicesState[invIndex] };
    }
  },

  updateInvoiceStatus: async (id: string, status: Invoice['status']): Promise<Invoice> => {
    try {
      const response = await apiClient.patch<Invoice>(`/finance/invoices/${id}/status/`, { status });
      return response.data;
    } catch {
      const inv = invoicesState.find((i) => i.id === id);
      if (!inv) throw new Error('Invoice not found');
      inv.status = status;
      if (status === 'paid') inv.balanceDue = 0;
      return { ...inv };
    }
  },
};
