import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../../api/crm.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import { Select } from '../../components/common/Select';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Lead, Customer, LeadStage, VerticalType } from '../../types';
import {
  Plus,
  ArrowRight,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

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

  const stages: { id: LeadStage; label: string; description: string; color: string; nextStage?: LeadStage; actionLabel?: string }[] = [
    { id: 'inquiry', label: 'Inquiries', description: 'New lead needs first contact', color: 'border-blue-500/40 text-blue-400', nextStage: 'qualification', actionLabel: 'Qualify lead' },
    { id: 'qualification', label: 'Qualification', description: 'Confirm need, fit, and timing', color: 'border-purple-500/40 text-purple-400', nextStage: 'proposal', actionLabel: 'Send proposal' },
    { id: 'proposal', label: 'Proposal Sent', description: 'Scope and pricing shared', color: 'border-cyan-500/40 text-cyan-400', nextStage: 'negotiation', actionLabel: 'Start negotiation' },
    { id: 'negotiation', label: 'Negotiation', description: 'Resolve terms and close', color: 'border-amber-500/40 text-amber-400', nextStage: 'won', actionLabel: 'Mark won' },
    { id: 'won', label: 'Won / Signed', description: 'Closed won; ready to onboard', color: 'border-emerald-500/40 text-emerald-400' },
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400 mb-2">Customer growth</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">CRM & Sales Pipeline</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-6">
            Qualify shipper opportunities, track negotiations, and manage active customer accounts.
          </p>
        </div>

        <div className="shrink-0">
          {viewMode === 'pipeline' ? (
            <Button
              size="md"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsNewLeadModalOpen(true)}
            >
              Add Lead
            </Button>
          ) : (
            <Button
              size="md"
              variant="primary"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsNewCustomerModalOpen(true)}
            >
              Add Customer
            </Button>
          )}

        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">
            {viewMode === 'pipeline' ? 'Opportunity pipeline' : 'Customer directory'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'pipeline'
              ? `${leads.length} ${leads.length === 1 ? 'opportunity' : 'opportunities'} across five sales stages`
              : `${customers.length} ${customers.length === 1 ? 'customer account' : 'customer accounts'}`}
          </p>
        </div>
        <div className="shrink-0">
          <Tabs
            tabs={[
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'customers', label: 'Customers', count: customers.length },
            ]}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id as 'pipeline' | 'customers')}
            variant="pills"
          />
        </div>
      </section>

      {/* Kanban Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const totalStageValue = stageLeads.reduce((sum, l) => sum + l.estimatedMonthlyValue, 0);

            return (
              <section key={stage.id} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-3.5 sm:p-4 space-y-3.5 min-h-[360px] shadow-sm">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{stage.label}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{stage.description}</span>
                  </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-800/80 border ${stage.color}`}>
                      {stageLeads.length}
                    </span>
                </div>

                <div className="rounded-xl bg-slate-950/40 border border-slate-800/70 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Monthly value</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    {formatCurrency(totalStageValue)}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageLeads.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-700/80 px-3 py-5 text-center text-[11px] text-slate-500">
                      No opportunities here yet
                    </div>
                  )}
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-3.5 bg-slate-800/75 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 space-y-3 text-xs transition-colors">
                      <div className="space-y-2">
                        <span className="font-semibold text-white block leading-5 break-words">{lead.companyName}</span>
                        <Badge variant="outline" size="sm" className="capitalize text-[9px]">
                          {lead.verticalInterest?.replace('_', ' ') || 'Logistics'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-400">
                        <span className="text-slate-300 font-medium block">{lead.contactPerson}</span>
                        <span className="text-slate-500 block">{lead.phone}</span>
                      </div>

                      {lead.notes && <p className="text-[11px] text-slate-400 leading-5 line-clamp-3">{lead.notes}</p>}

                      <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {formatCurrency(lead.estimatedMonthlyValue)}/mo
                        </span>
                        
                        {stage.id === 'won' ? (
                          lead.convertedCustomerId ? (
                            <Badge variant="success" size="sm">Customer created</Badge>
                          ) : (
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
                          )
                        ) : stage.nextStage ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateStageMutation.mutate({ leadId: lead.id, stage: stage.nextStage! })}
                            isLoading={updateStageMutation.isPending}
                            leftIcon={<ArrowRight className="h-3 w-3" />}
                            title={`Move ${lead.companyName} to ${stage.nextStage}`}
                          >
                            {stage.actionLabel}
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
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

            <PhoneNumberInput
              label="Phone Number"
              required
              value={newLead.phone}
              onChange={(phone) => setNewLead({ ...newLead, phone })}
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

            <PhoneNumberInput
              label="Phone Number"
              required
              value={newCustomer.phone}
              onChange={(phone) => setNewCustomer({ ...newCustomer, phone })}
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
