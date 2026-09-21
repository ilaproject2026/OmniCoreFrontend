import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { SupportTicket, TicketPriority, TicketStatus, TicketCategory } from '../../types';
import {
  Headphones,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  UserCheck,
  X,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export const SupportTickets: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<SupportTicket | null>(null);

  // Form state
  const [tenantName, setTenantName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('telematics_gps');
  const [priority, setPriority] = useState<TicketPriority>('high');

  // Queries
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['platformTickets', selectedStatus, selectedPriority],
    queryFn: async () => {
      try {
        return await platformApi.getTickets({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        });
      } catch {
        // Return empty real array if backend endpoint has no data yet
        return [];
      }
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['platformTenants'],
    queryFn: () => platformApi.getTenants(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<SupportTicket>) => platformApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformTickets'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      platformApi.updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformTickets'] });
      if (selectedTicketForDetail) {
        setSelectedTicketForDetail(null);
      }
    },
  });

  const resetForm = () => {
    setTenantName('');
    setRequesterName('');
    setRequesterEmail('');
    setSubject('');
    setDescription('');
    setCategory('telematics_gps');
    setPriority('high');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !tenantName) return;

    createMutation.mutate({
      ticketNumber: `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantName,
      requesterName: requesterName || 'Tenant Admin',
      requesterEmail: requesterEmail || 'admin@tenant.com',
      subject,
      description,
      category,
      priority,
      status: 'open',
      slaTargetHours: priority === 'critical' ? 4 : priority === 'high' ? 8 : 24,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
  };

  // KPI Calculations
  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const criticalCount = tickets.filter((t) => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;
  const waitingCount = tickets.filter((t) => t.status === 'waiting_tenant').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      searchQuery === '' ||
      t.ticketNumber?.toLowerCase().includes(q) ||
      t.tenantName?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.requesterEmail?.toLowerCase().includes(q)
    );
  });

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'critical':
        return <Badge variant="danger" dot className="animate-pulse">Critical SLA</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'medium':
        return <Badge variant="info">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'open':
        return <Badge variant="purple">Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning" dot>In Progress</Badge>;
      case 'waiting_tenant':
        return <Badge variant="outline">Waiting Tenant</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
    }
  };

  const columns: ColumnDef<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket #',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-400 block">{val}</span>
          <span className="text-[10px] text-slate-500">{row.createdAt}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (val) => getPriorityBadge(val as TicketPriority),
    },
    {
      key: 'tenant',
      header: 'Tenant & Requester',
      sortable: true,
      render: (_, row) => (
        <div>
          <span className="font-semibold text-white text-xs block">{row.tenantName}</span>
          <span className="text-[11px] text-slate-400">{row.requesterName} ({row.requesterEmail})</span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Issue Subject & Category',
      render: (_, row) => (
        <div className="max-w-xs">
          <span className="text-slate-200 font-medium text-xs block truncate">{row.subject}</span>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
            {row.category?.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'sla',
      header: 'SLA Window',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-xs text-slate-300">
            {row.slaRemainingHours !== undefined ? `${row.slaRemainingHours}h left` : `${row.slaTargetHours}h SLA`}
          </span>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assigned To',
      render: (val) => (
        <span className="text-xs text-slate-300">
          {val || <span className="text-slate-500 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => getStatusBadge(val as TicketStatus),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedTicketForDetail(row)}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Support & Helpdesk Tickets</h1>
            <Badge variant="purple">L2 / L3 Ops Escalations</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Super admin triage workspace for tenant escalations, SLA breaches, telematics diagnostics, and billing inquiries.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Support Ticket
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Open Tickets"
          value={`${openCount} Tickets`}
          subtitle="Awaiting resolution or triage"
          icon={<Headphones className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Critical SLA Alerts"
          value={`${criticalCount} Urgent`}
          subtitle="Resolution required within 4h"
          icon={<AlertCircle className="h-5 w-5" />}
          accentColor="rose"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Tenant Response"
          value={`${waitingCount} Tickets`}
          subtitle="Diagnostics requested from customer"
          icon={<Clock className="h-5 w-5" />}
          accentColor="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Resolved Tickets"
          value={`${resolvedCount} Closed`}
          subtitle="All-time resolved cases"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isLoading}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['all', 'open', 'in_progress', 'waiting_tenant', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticket #, tenant, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Tickets Data Table */}
      <DataTable
        columns={columns}
        data={filteredTickets}
        isLoading={isLoading}
        searchPlaceholder="Filter visible tickets..."
        emptyTitle="No support tickets"
        emptyDescription="No support tickets found matching your query criteria."
      />

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-lg w-full p-6 space-y-4 border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Create Escalation Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Tenant Customer *</label>
                <select
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select a registered tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                  {tenants.length === 0 && <option value="Apex Logistics">Apex Logistics</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Requester Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Requester Email</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@tenant.com"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Issue Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="telematics_gps">GPS & Telematics Hardware</option>
                    <option value="billing">Billing, Invoicing & Stripe</option>
                    <option value="integration_api">API & Webhook Integrations</option>
                    <option value="user_access">User Access & SSO Authentication</option>
                    <option value="bug_report">Software Bug / Glitch</option>
                    <option value="sla_breach">SLA Escalation</option>
                    <option value="feature_request">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Priority Level *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="critical">Critical (4h SLA)</option>
                    <option value="high">High (8h SLA)</option>
                    <option value="medium">Medium (24h SLA)</option>
                    <option value="low">Low (72h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telematics Gateway Disconnected for Chicago Hub fleet"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description & Diagnostics</label>
                <textarea
                  rows={3}
                  placeholder="Provide reproduction steps, affected vehicles, or tenant symptoms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={createMutation.isPending}>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Ticket Detail & Status Action Drawer */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-md w-full p-6 space-y-4 border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {selectedTicketForDetail.ticketNumber}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {selectedTicketForDetail.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tenant:</span>
                <span className="font-semibold text-white">{selectedTicketForDetail.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requester:</span>
                <span className="text-slate-200">{selectedTicketForDetail.requesterEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-mono text-cyan-400 capitalize">{selectedTicketForDetail.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority:</span>
                {getPriorityBadge(selectedTicketForDetail.priority)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                {getStatusBadge(selectedTicketForDetail.status)}
              </div>

              {selectedTicketForDetail.description && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 mt-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Details</span>
                  <p className="text-slate-300 leading-relaxed text-xs">{selectedTicketForDetail.description}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Update Ticket Status:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedTicketForDetail.id,
                      status: 'in_progress',
                    })
                  }
                >
                  Mark In Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedTicketForDetail.id,
                      status: 'waiting_tenant',
                    })
                  }
                >
                  Waiting Tenant
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedTicketForDetail.id,
                      status: 'resolved',
                    })
                  }
                >
                  Resolve Ticket
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
