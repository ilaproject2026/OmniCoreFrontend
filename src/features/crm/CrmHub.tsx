import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../../api/crm.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Lead, Customer, LeadStage, VerticalType } from '../../types';
import {
  UserCheck,
  Plus,
  DollarSign,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export const CrmHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'pipeline' | 'customers'>('pipeline');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    verticalInterest: 'freight_logistics' as VerticalType,
    estimatedMonthlyValue: 50000,
    notes: '',
  });

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    billingAddress: '',
    taxId: '',
    creditLimit: 100000,
    paymentTerms: 'net_30',
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.getLeads(),
  });

  const { data: customers = [], isLoading: isCustLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: LeadStage }) =>
      crmApi.updateLeadStage(leadId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: (leadId: string) => crmApi.convertLeadToCustomer(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['crmCustomers'] });
      setViewMode('customers');
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: typeof newLead) => crmApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsNewLeadModalOpen(false);
      setNewLead({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        verticalInterest: 'freight_logistics',
        estimatedMonthlyValue: 50000,
        notes: '',
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: typeof newCustomer) => crmApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['crmCustomers'] });
      setIsNewCustomerModalOpen(false);
      setNewCustomer({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        billingAddress: '',
        taxId: '',
        creditLimit: 100000,
        paymentTerms: 'net_30',
      });
    },
  });

  const stages: { id: LeadStage; label: string; color: string }[] = [
    { id: 'inquiry', label: 'Inquiries', color: 'border-blue-500/40 text-blue-400' },
    { id: 'qualification', label: 'Qualification', color: 'border-purple-500/40 text-purple-400' },
    { id: 'proposal', label: 'Proposal Sent', color: 'border-cyan-500/40 text-cyan-400' },
    { id: 'negotiation', label: 'Negotiation', color: 'border-amber-500/40 text-amber-400' },
    { id: 'won', label: 'Won / Signed', color: 'border-emerald-500/40 text-emerald-400' },
  ];

  const customerColumns: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Entity',
      sortable: true,
      accessor: (r) => r.companyName || r.name,
      render: (_, row) => (
        <div>
          <span className="font-bold text-white text-xs block">{row.companyName || row.name}</span>
          <span className="text-[11px] font-mono text-slate-400">{row.code}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-200 block font-medium">{row.contactPerson}</span>
          <span className="text-[11px] text-slate-400">{row.email} • {row.phone}</span>
        </div>
      ),
    },
    {
      key: 'credit',
      header: 'Credit Limit / Balance',
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-slate-200 block">Limit: {formatCurrency(row.creditLimit)}</span>
          <span className="text-amber-400 font-semibold">Due: {formatCurrency(row.outstandingBalance)}</span>
        </div>
      ),
    },
    {
      key: 'trips',
      header: 'Completed Trips',
      accessor: (r) => r.totalTripsCompleted,
      render: (val) => <span className="font-bold font-mono text-white text-xs">{val || 0} Journeys</span>,
    },
    {
      key: 'status',
      header: 'Account Status',
      accessor: (r) => r.status,
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'default'}>
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
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM & Enterprise Shipper Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logistics freight pipeline, qualification, contract negotiations, and corporate customer profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'pipeline' ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsNewLeadModalOpen(true)}
            >
              Add Lead
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsNewCustomerModalOpen(true)}
            >
              Add Customer
            </Button>
          )}

          <Tabs
            tabs={[
              { id: 'pipeline', label: 'Sales Pipeline (Kanban)' },
              { id: 'customers', label: 'Customer Directory', count: customers.length },
            ]}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id as any)}
            variant="pills"
          />
        </div>
      </div>

      {/* Kanban Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const totalStageValue = stageLeads.reduce((sum, l) => sum + l.estimatedMonthlyValue, 0);

            return (
              <div key={stage.id} className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-3.5 space-y-3 min-w-[230px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{stage.label}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    {formatCurrency(totalStageValue)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-3 bg-[#141c2e] hover:border-blue-500/50 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white block truncate">{lead.companyName}</span>
                        <Badge variant="outline" size="sm" className="capitalize text-[9px]">
                          {lead.verticalInterest?.replace('_', ' ') || 'Logistics'}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-300 font-medium">{lead.contactPerson}</span>
                        <span className="block text-[10px] text-slate-500">{lead.phone}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">{lead.notes}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {formatCurrency(lead.estimatedMonthlyValue)}/mo
                        </span>
                        
                        {stage.id === 'won' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => convertLeadMutation.mutate(lead.id)}
                            isLoading={convertLeadMutation.isPending}
                            className="text-[10px] py-0.5 px-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            leftIcon={<Sparkles className="h-3 w-3" />}
                          >
                            Convert Client
                          </Button>
                        ) : (
                          <button
                            onClick={() => {
                              const nextIdx = stages.findIndex((s) => s.id === stage.id) + 1;
                              if (nextIdx < stages.length) {
                                updateStageMutation.mutate({ leadId: lead.id, stage: stages[nextIdx].id });
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Advance Stage"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customers Table View */}
      {viewMode === 'customers' && (
        <DataTable
          columns={customerColumns}
          data={customers}
          isLoading={isCustLoading}
          searchPlaceholder="Search customer account, contact person..."
        />
      )}

      {/* NEW LEAD MODAL */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Add Inbound Shipper Opportunity"
        description="Record a new shipper lead into the freight sales pipeline."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLeadMutation.mutate(newLead);
          }}
          className="space-y-4 text-xs"
        >
          <Input
            label="Company / Shipper Legal Name"
            required
            placeholder="e.g. Caterpillar Logistics Americas"
            value={newLead.companyName}
            onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              required
              placeholder="e.g. Sarah Jenkins"
              value={newLead.contactPerson}
              onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g. +1 (312) 555-0922"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>

          <Input
            label="Corporate Email Address"
            type="email"
            required
            placeholder="e.g. logistics@caterpillar.com"
            value={newLead.email}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Vertical of Interest"
              value={newLead.verticalInterest}
              onChange={(e) => setNewLead({ ...newLead, verticalInterest: e.target.value as any })}
              options={[
                { value: 'freight_logistics', label: 'Freight Logistics' },
                { value: 'cold_chain', label: 'Cold Chain & Temperature' },
                { value: 'corporate_shuttle', label: 'Corporate Fleet / Shuttle' },
                { value: 'b2b_contract', label: 'B2B Dedicated Contract' },
                { value: 'last_mile', label: 'Last-Mile Delivery' },
                { value: 'tourist_taxi', label: 'Tourist Taxi & Tours' },
                { value: 'bulk_fleet', label: 'Bulk Liquid / Dry Bulk' },
                { value: 'project_logistics', label: 'Project Cargo / Heavy Haul' },
              ]}
            />

            <Input
              label="Estimated Monthly Spend ($)"
              type="number"
              value={newLead.estimatedMonthlyValue}
              onChange={(e) => setNewLead({ ...newLead, estimatedMonthlyValue: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Initial Discovery Notes & Scope"
            placeholder="e.g. Needs 10 dedicated reefer units for daily dairy distribution"
            value={newLead.notes}
            onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
          />

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createLeadMutation.isPending}>
              Create Pipeline Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* NEW CUSTOMER MODAL */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Register Enterprise Shipper Account"
        description="Onboard an enterprise corporate shipper profile with credit terms and tax credentials."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCustomerMutation.mutate(newCustomer);
          }}
          className="space-y-4 text-xs"
        >
          <Input
            label="Enterprise Legal Name"
            required
            placeholder="e.g. Baxter Healthcare Corporation"
            value={newCustomer.companyName}
            onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Primary Contact Person"
              required
              placeholder="e.g. David Vance"
              value={newCustomer.contactPerson}
              onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g. +1 (847) 555-8900"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Billing Email"
              type="email"
              required
              placeholder="e.g. ap-invoices@baxter.com"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            />

            <Input
              label="Tax Identification / EIN"
              placeholder="e.g. 36-1234567"
              value={newCustomer.taxId}
              onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Authorized Credit Limit ($)"
              type="number"
              value={newCustomer.creditLimit}
              onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
            />

            <Select
              label="Commercial Payment Terms"
              value={newCustomer.paymentTerms}
              onChange={(e) => setNewCustomer({ ...newCustomer, paymentTerms: e.target.value })}
              options={[
                { value: 'net_15', label: 'Net 15 Days' },
                { value: 'net_30', label: 'Net 30 Days' },
                { value: 'net_60', label: 'Net 60 Days' },
                { value: 'due_on_receipt', label: 'Due on Receipt' },
              ]}
            />
          </div>

          <Input
            label="Corporate Billing Address"
            placeholder="e.g. One Baxter Parkway, Deerfield, IL 60015"
            value={newCustomer.billingAddress}
            onChange={(e) => setNewCustomer({ ...newCustomer, billingAddress: e.target.value })}
          />

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createCustomerMutation.isPending}>
              Onboard Shipper
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
