import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/finance.api';
import { crmApi } from '../../api/crm.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { Invoice, InvoiceStatus, Payment } from '../../types';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Fuel,
  TrendingUp,
  CreditCard,
  Building,
  Check,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';

export const FinanceHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'analytics'>('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    clientName: 'Pfizer BioPharma North America',
    customerId: '',
    amount: 12500,
  });

  // Payment Recording State
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'wire' as Payment['paymentMethod'],
    referenceNumber: '',
    bankAccount: 'JPMorgan Operating Account (*4091)',
    notes: '',
  });

  const { data: summary } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: () => financeApi.getSummary(),
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => financeApi.getInvoices(),
  });

  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => financeApi.getPayments(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['crmCustomers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: typeof newInvoice) =>
      financeApi.createInvoice({
        clientName: data.clientName,
        customerId: data.customerId || undefined,
        amount: data.amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      setIsInvoiceModalOpen(false);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: typeof paymentData) => {
      if (!paymentInvoice) throw new Error('No invoice selected for payment');
      return financeApi.recordPayment({
        invoiceId: paymentInvoice.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        bankAccount: data.bankAccount,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      setPaymentInvoice(null);
    },
  });

  const openPaymentModal = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentData({
      amount: inv.balanceDue,
      paymentMethod: 'bank_transfer',
      referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
      bankAccount: 'JPMorgan Operating Account (*4091)',
      notes: `Settlement for invoice ${inv.invoiceNumber}`,
    });
  };

  const getInvoiceBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid in Full</Badge>;
      case 'issued':
        return <Badge variant="info">Issued / Sent</Badge>;
      case 'overdue':
        return <Badge variant="danger" dot>Overdue</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice # & Client',
      sortable: true,
      accessor: (r) => r.invoiceNumber,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.invoiceNumber}</span>
          <span className="text-slate-300 font-medium">{row.clientName}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Issue / Due Date',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-300 block">{formatDate(row.issueDate)}</span>
          <span className="text-[10px] text-slate-500">Due: {formatDate(row.dueDate)}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Invoiced',
      sortable: true,
      accessor: (r) => r.totalAmount,
      render: (val) => <span className="font-mono font-bold text-white text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance Due',
      sortable: true,
      accessor: (r) => r.balanceDue,
      render: (val) => (
        <span className={`font-mono font-bold text-xs ${val > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => r.status,
      render: (val) => getInvoiceBadge(val as InvoiceStatus),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status !== 'paid' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => openPaymentModal(row)}
              leftIcon={<CreditCard className="h-3.5 w-3.5" />}
            >
              Record Payment
            </Button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Settled
            </span>
          )}
        </div>
      ),
    },
  ];

  const paymentColumns: ColumnDef<Payment>[] = [
    {
      key: 'code',
      header: 'Payment Code & Ref',
      accessor: (r) => r.paymentCode,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-emerald-400 text-xs block">{row.paymentCode}</span>
          <span className="text-slate-400 text-[11px] font-mono">Ref: {row.referenceNumber}</span>
        </div>
      ),
    },
    {
      key: 'invoice',
      header: 'Applied Invoice & Client',
      accessor: (r) => r.invoiceNumber,
      render: (_, row) => (
        <div>
          <span className="font-mono text-white text-xs font-semibold block">{row.invoiceNumber}</span>
          <span className="text-slate-300 font-medium text-xs">{row.customerName}</span>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method & Account',
      render: (_, row) => (
        <div className="text-xs">
          <span className="uppercase font-semibold text-slate-200 block">{row.paymentMethod}</span>
          <span className="text-[10px] text-slate-500">{row.bankAccount}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Settlement Date',
      accessor: (r) => r.paymentDate,
      render: (val) => <span className="font-mono text-slate-300 text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount Received',
      accessor: (r) => r.amount,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      header: 'State',
      accessor: (r) => r.status,
      render: (val) => (
        <Badge variant={val === 'completed' ? 'success' : 'warning'}>
          {val}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance, Invoicing & P&L Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Accounts receivable, trip margins, payment settlements, fuel & toll overhead, and commercial billing.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsInvoiceModalOpen(true)}
        >
          Create Invoice
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Billed Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          subtitle="Realized gross linehaul"
          icon={<DollarSign className="h-4 w-4" />}
          accentColor="emerald"
        />

        <StatCard
          title="Cash Collections"
          value={formatCurrency(summary?.totalCollections || 0)}
          subtitle="Received to operating account"
          icon={<Receipt className="h-4 w-4" />}
          accentColor="blue"
        />

        <StatCard
          title="Operating Overhead"
          value={formatCurrency(summary?.totalOperatingExpenses || 0)}
          subtitle="Fuel, maintenance & trip burn"
          icon={<Fuel className="h-4 w-4" />}
          accentColor="rose"
        />

        <StatCard
          title="Net Operating Surplus"
          value={formatCurrency(summary?.netMargin || 0)}
          subtitle="Net Realized P&L"
          icon={<TrendingUp className="h-4 w-4" />}
          accentColor="cyan"
        />
      </div>

      {/* Monthly Revenue vs Expenses Chart */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Revenue vs Operating Burn</h3>
            <p className="text-xs text-slate-400">Gross revenue against fuel, tolls, maintenance, and driver payroll</p>
          </div>
          <Badge variant="outline">Past 6 Months</Badge>
        </div>

        <div className="h-64 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.monthlyRevenueSeries || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#10b981" name="Gross Revenue ($)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses ($)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#3b82f6" name="Net Profit ($)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: 'invoices', label: 'Commercial Invoices', count: invoices.length },
          { id: 'payments', label: 'Cash Collections & Journal', count: payments.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'invoices' && (
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          isLoading={isLoading}
          searchPlaceholder="Search invoice #, client name..."
        />
      )}

      {activeTab === 'payments' && (
        <DataTable
          columns={paymentColumns}
          data={payments}
          isLoading={isPaymentsLoading}
          searchPlaceholder="Search payment code, reference, invoice..."
        />
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        title={paymentInvoice ? `Record Cash Receipt — ${paymentInvoice.invoiceNumber}` : 'Record Payment'}
        description={`Allocate remittance from ${paymentInvoice?.clientName}. Balance due: ${formatCurrency(paymentInvoice?.balanceDue || 0)}`}
        size="md"
      >
        {paymentInvoice && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              recordPaymentMutation.mutate(paymentData);
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Invoice Total</span>
                <span className="text-white font-bold">{formatCurrency(paymentInvoice.totalAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Current Balance</span>
                <span className="text-amber-400 font-bold">{formatCurrency(paymentInvoice.balanceDue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Payment Amount Received ($)"
                type="number"
                required
                max={paymentInvoice.balanceDue}
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
              />

              <Select
                label="Payment Method"
                required
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                options={[
                  { value: 'wire', label: 'Wire / SWIFT Transfer' },
                  { value: 'ach', label: 'ACH / Direct Deposit' },
                  { value: 'check', label: 'Bank Cheque' },
                  { value: 'credit_card', label: 'Commercial Credit Card' },
                  { value: 'cash', label: 'Cash Settlement' },
                ]}
              />

              <Input
                label="Bank Reference / Cheque #"
                required
                placeholder="e.g. WIRE-8849103"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              />

              <Input
                label="Deposited Bank Account"
                required
                value={paymentData.bankAccount}
                onChange={(e) => setPaymentData({ ...paymentData, bankAccount: e.target.value })}
              />
            </div>

            <Input
              label="Remittance Notes / Memo"
              placeholder="e.g. Full remittance wire received per schedule"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={recordPaymentMutation.isPending}>
                Post Settlement
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Issue Commercial Invoice"
        description="Generate a billing invoice for dedicated linehaul or spot transport services."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createInvoiceMutation.mutate(newInvoice);
          }}
          className="space-y-4 text-xs"
        >
          <Select
            label="Registered CRM Shipper (Optional)"
            value={newInvoice.customerId}
            onChange={(e) => {
              const custId = e.target.value;
              const c = customers.find((cust) => cust.id === custId);
              setNewInvoice({
                ...newInvoice,
                customerId: custId,
                clientName: c ? (c.companyName || c.name) : newInvoice.clientName,
              });
            }}
            options={[
              { value: '', label: '-- Custom / One-Off Shipper --' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.companyName || c.name} (${c.contactPerson})`,
              })),
            ]}
          />

          <Input
            label="Client / Shipper Legal Entity"
            required
            value={newInvoice.clientName}
            onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
          />

          <Input
            label="Invoice Subtotal Amount ($)"
            type="number"
            required
            value={newInvoice.amount}
            onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
          />

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createInvoiceMutation.isPending}>
              Issue & Transmit Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
