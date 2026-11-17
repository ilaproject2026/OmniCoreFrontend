import { apiClient } from './client';
import { Invoice, Payment } from '../types';

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
    const response = await apiClient.get<any>('/finance/pnl/');
    const data = response.data || {};
    const expenses = data.expenses || {};
    return {
      totalRevenue: Number(data.total_billed_revenue || 0),
      totalCollections: Number(data.total_collections_cash || 0),
      outstandingBalance: Number(data.outstanding_receivables || 0),
      fuelExpenses: Number(expenses.fuel || 0),
      tollExpenses: Number(expenses.tolls || 0),
      maintenanceExpenses: 0,
      payrollExpenses: 0,
      totalOperatingExpenses: Number(expenses.total_expenses || 0),
      netMargin: Number(data.net_operating_profit || 0),
      monthlyRevenueSeries: [],
    };
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/finance/invoices/');
    return response.data;
  },

  getPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<Payment[]>('/finance/payments/');
    return response.data;
  },

  createInvoice: async (payload: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/finance/invoices/', payload);
    return response.data;
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
    const response = await apiClient.post<{ payment: Payment; invoice: Invoice }>(`/finance/invoices/${invoiceId}/payments/`, payload);
    return response.data;
  },

  updateInvoiceStatus: async (id: string, status: Invoice['status']): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/finance/invoices/${id}/status/`, { status });
    return response.data;
  },
};
