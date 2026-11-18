import { apiClient } from './client';
import { Invoice, Payment } from '../types';

const extractList = (data: any): any[] =>
  Array.isArray(data) ? data : (data?.results || data?.data || []);

const normalizeInvoice = (raw: any): Invoice => {
  const subtotal = Number(raw.subtotal ?? raw.amount ?? 0);
  const taxAmount = Number(raw.tax_amount ?? raw.taxAmount ?? 0);
  const rawTotal = Number(raw.total_amount ?? raw.totalAmount ?? 0);
  const totalAmount = rawTotal > 0 ? rawTotal : subtotal + taxAmount;
  const paidAmount = Number(raw.paid_amount ?? raw.paidAmount ?? 0);
  const rawBalance = Number(raw.balance_due ?? raw.balanceDue ?? 0);

  return {
    ...raw,
    id: raw.id,
    invoiceNumber: raw.invoice_number || raw.invoiceNumber || '',
    customerId: raw.customer_id || raw.customer,
    clientName: raw.customer_name || raw.client_name || raw.clientName || '',
    issueDate: raw.issue_date || raw.issueDate || '',
    dueDate: raw.due_date || raw.dueDate || '',
    amount: subtotal,
    taxAmount,
    totalAmount,
    balanceDue: rawBalance > 0 ? rawBalance : Math.max(0, totalAmount - paidAmount),
    status: String(raw.status || 'DRAFT').toLowerCase() as Invoice['status'],
    vertical: raw.vertical || 'freight_logistics',
    items: (raw.items || []).map((item: any) => ({
      description: item.description || '',
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
      total: Number(item.total_amount ?? item.total ?? 0),
    })),
  };
};

const getDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const createInvoiceNumber = (): string =>
  `INV-${getDateOnly(new Date()).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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
    const response = await apiClient.get<any>('/finance/invoices/');
    return extractList(response.data).map(normalizeInvoice);
  },

  getPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<any>('/finance/payments/');
    return extractList(response.data).map((raw: any) => ({
      ...raw,
      id: raw.id,
      paymentCode: raw.payment_number || raw.paymentCode || '',
      invoiceId: raw.invoice_id || raw.invoice,
      amount: Number(raw.amount || 0),
      paymentMethod: String(raw.payment_method || raw.paymentMethod || 'BANK_TRANSFER').toLowerCase() as Payment['paymentMethod'],
      referenceNumber: raw.reference_number || raw.referenceNumber || '',
      paidAt: raw.payment_date || raw.paidAt || raw.created_at || '',
      paymentDate: raw.payment_date || raw.paymentDate || '',
      bankAccount: raw.bank_account || raw.bankAccount || '',
      status: raw.status || 'completed',
      notes: raw.notes || '',
    }));
  },

  createInvoice: async (payload: Partial<Invoice>): Promise<Invoice> => {
    const customerId = payload.customerId?.trim();
    if (!customerId) throw new Error('Select a registered customer before creating an invoice.');

    const issueDate = payload.issueDate || getDateOnly(new Date());
    const dueDate = payload.dueDate || getDateOnly(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const amount = payload.amount ?? payload.totalAmount ?? 0;
    const backendPayload = {
      invoice_number: payload.invoiceNumber || createInvoiceNumber(),
      customer: customerId,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal: amount,
      tax_amount: payload.taxAmount ?? 0,
      total_amount: payload.totalAmount ?? amount + (payload.taxAmount ?? 0),
    };
    const response = await apiClient.post<any>('/finance/invoices/', backendPayload);
    return normalizeInvoice(response.data);
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
  ): Promise<{ message: string; paymentId: string; paymentNumber: string; newBalanceDue: number; invoiceStatus: Invoice['status'] }> => {
    const invoiceId = typeof invoiceIdOrPayload === 'string' ? invoiceIdOrPayload : invoiceIdOrPayload.invoiceId;
    const payload = typeof invoiceIdOrPayload === 'string' ? optionalPayload! : invoiceIdOrPayload;
    const paymentMethodMap: Record<Payment['paymentMethod'], string> = {
      bank_transfer: 'BANK_TRANSFER',
      wire: 'BANK_TRANSFER',
      ach: 'BANK_TRANSFER',
      check: 'CHEQUE',
      credit_card: 'CREDIT_CARD',
      cash: 'CASH',
      fuel_card: 'CREDIT_CARD',
      company_cash: 'CASH',
    };
    const response = await apiClient.post<any>(`/finance/invoices/${invoiceId}/record_payment/`, {
      amount: payload.amount,
      payment_method: paymentMethodMap[payload.paymentMethod] || 'BANK_TRANSFER',
      reference_number: payload.referenceNumber,
      notes: payload.notes || '',
    });
    return {
      message: response.data?.message || 'Payment recorded successfully.',
      paymentId: response.data?.payment_id || response.data?.paymentId || '',
      paymentNumber: response.data?.payment_number || response.data?.paymentNumber || '',
      newBalanceDue: Number(response.data?.new_balance_due ?? response.data?.newBalanceDue ?? 0),
      invoiceStatus: String(response.data?.invoice_status || response.data?.invoiceStatus || 'ISSUED').toLowerCase() as Invoice['status'],
    };
  },

  updateInvoiceStatus: async (id: string, status: Invoice['status']): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/finance/invoices/${id}/status/`, { status });
    return response.data;
  },
};
