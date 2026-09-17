import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../../api/contracts.api';
import { crmApi } from '../../api/crm.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Drawer } from '../../components/common/Drawer';
import { Contract, Tender, ContractProfitability } from '../../types';
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Briefcase,
  TrendingUp,
  Award,
  DollarSign,
  Truck,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export const ContractsHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'contracts' | 'tenders'>('contracts');
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Proposal cost estimation state
  const [newTender, setNewTender] = useState({
    title: '',
    clientName: '',
    industry: '',
    estimatedValue: 1200000,
    estimatedVehicleRequired: 6,
    fleetCosts: 450000,
    fuelEstimates: 280000,
    crewPayroll: 310000,
    margins: 160000,
  });

  // Direct Contract Onboarding State
  const [newContractForm, setNewContractForm] = useState({
    title: '',
    customerName: '',
    customerId: '',
    totalContractValue: 500000,
    slaTargetPercent: 98,
    minMonthlyTrips: 40,
    dedicatedVehiclesCount: 4,
    billingCycle: 'monthly' as const,
    paymentTermsDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsApi.getContracts(),
  });

  const { data: tenders = [], isLoading: isTendersLoading } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => contractsApi.getTenders(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['crmCustomers'],
    queryFn: () => crmApi.getCustomers(),
  });

  // Profitability telemetry query for selected contract
  const { data: profitability, isLoading: isProfitabilityLoading } = useQuery({
    queryKey: ['contractProfitability', selectedContract?.id],
    queryFn: () => contractsApi.getContractProfitability(selectedContract!.id),
    enabled: Boolean(selectedContract?.id),
  });

  const tenderMutation = useMutation({
    mutationFn: (data: typeof newTender) =>
      contractsApi.createTender({
        title: data.title,
        clientName: data.clientName,
        industry: data.industry,
        estimatedValue: data.estimatedValue,
        estimatedVehicleRequired: data.estimatedVehicleRequired,
        costBreakdown: {
          fleetCosts: data.fleetCosts,
          fuelEstimates: data.fuelEstimates,
          crewPayroll: data.crewPayroll,
          margins: data.margins,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setIsTenderModalOpen(false);
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: typeof newContractForm) =>
      contractsApi.createContract({
        title: data.title,
        clientName: data.customerName,
        customerName: data.customerName,
        customerId: data.customerId || undefined,
        totalContractValue: data.totalContractValue,
        slaTargetPercent: data.slaTargetPercent,
        minMonthlyTrips: data.minMonthlyTrips,
        dedicatedVehiclesCount: data.dedicatedVehiclesCount,
        billingCycle: data.billingCycle,
        paymentTerms: `Net ${data.paymentTermsDays} Days`,
        paymentTermsDays: data.paymentTermsDays,
        startDate: data.startDate,
        endDate: data.endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsNewContractModalOpen(false);
    },
  });

  const awardTenderMutation = useMutation({
    mutationFn: (tenderId: string) => contractsApi.awardTenderToContract(tenderId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setActiveTab('contracts');
      setSelectedContract(result.contract);
    },
  });

  const contractColumns: ColumnDef<Contract>[] = [
    {
      key: 'code',
      header: 'Contract Code & Title',
      sortable: true,
      accessor: (r) => r.contractCode,
      render: (_, row) => (
        <div>
          <span className="font-bold font-mono text-white text-xs block">{row.contractCode}</span>
          <span className="text-slate-300 font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Enterprise Client',
      accessor: (r) => r.customerName || r.clientName,
      render: (val) => <span className="font-semibold text-slate-200">{val}</span>,
    },
    {
      key: 'value',
      header: 'Contract Value',
      sortable: true,
      accessor: (r) => r.totalContractValue,
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-white block">{formatCurrency(row.totalContractValue)}</span>
          <span className="text-[10px] text-emerald-400">Realized: {formatCurrency(row.realizedRevenue)}</span>
        </div>
      ),
    },
    {
      key: 'sla',
      header: 'SLA Performance',
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400 font-mono">{row.slaActualPercent}%</span>
          <span className="text-[10px] text-slate-400 block">Target: {row.slaTargetPercent}%</span>
        </div>
      ),
    },
    {
      key: 'fleet',
      header: 'Dedicated Assets',
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-mono text-slate-200">{row.dedicatedVehiclesCount || 0} Vehicles</span>
          <span className="text-[10px] text-slate-400 block font-mono">Min {row.minMonthlyTrips || 0} trips/mo</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Period & Expiry',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-300 block">{formatDate(row.startDate)} to {formatDate(row.endDate)}</span>
          {row.status === 'expiring_soon' && (
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" /> Expiry Alert: {row.renewalAlertDays} Days
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'active') return <Badge variant="success" dot>Active SLA</Badge>;
        if (val === 'expiring_soon') return <Badge variant="warning" dot>Renewal Due</Badge>;
        return <Badge variant="default">{val}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'P&L & SLA',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedContract(row)}
          leftIcon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
        >
          View P&L
        </Button>
      ),
    },
  ];

  const tenderColumns: ColumnDef<Tender>[] = [
    {
      key: 'tenderCode',
      header: 'Tender ID & RFP',
      accessor: (r) => r.tenderCode,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.tenderCode}</span>
          <span className="text-slate-300 font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client / Agency',
      accessor: (r) => r.clientName,
      render: (_, row) => (
        <div>
          <span className="text-slate-200 block font-medium">{row.clientName}</span>
          <span className="text-[10px] text-slate-400">{row.industry}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Estimated Value',
      accessor: (r) => r.estimatedValue,
      render: (val) => <span className="font-mono font-bold text-emerald-400 text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'fleetReq',
      header: 'Fleet Quota',
      accessor: (r) => r.estimatedVehicleRequired,
      render: (val) => <span className="font-mono text-slate-300 text-xs">{val} Dedicated Units</span>,
    },
    {
      key: 'deadline',
      header: 'Submission Deadline',
      accessor: (r) => r.submissionDeadline,
      render: (val) => <span className="text-slate-300 text-xs font-mono">{formatDate(val)}</span>,
    },
    {
      key: 'status',
      header: 'Proposal Status',
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'submitted') return <Badge variant="info">Submitted</Badge>;
        if (val === 'under_review') return <Badge variant="purple">Under Review</Badge>;
        if (val === 'awarded') return <Badge variant="success">Awarded</Badge>;
        return <Badge variant="default">{val}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        row.status !== 'awarded' ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => awardTenderMutation.mutate(row.id)}
            isLoading={awardTenderMutation.isPending}
            leftIcon={<Award className="h-3.5 w-3.5" />}
          >
            Award to Contract
          </Button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Converted
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contracts & Tender Proposals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tender cost estimators, digital SLA tracking, minimum guarantee billing, and live contract P&L profitability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewContractModalOpen(true)}
          >
            New Enterprise Contract
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Calculator className="h-4 w-4" />}
            onClick={() => setIsTenderModalOpen(true)}
          >
            Build Tender Proposal
          </Button>
        </div>
      </div>

      {/* Visual Contract Lifecycle Progression Bar */}
      <Card className="p-4 bg-[#141c2e]">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">1</span>
            <span className="text-slate-300 font-semibold">Tender Notice</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">2</span>
            <span className="text-slate-300 font-semibold">Cost Estimation</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">3</span>
            <span className="text-slate-300 font-semibold">Proposal Submission</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">4</span>
            <span className="text-emerald-300 font-semibold">Active Contract Execution</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">5</span>
            <span className="text-amber-300 font-semibold">SLA Renewal</span>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: 'contracts', label: 'Active Enterprise Contracts', count: contracts.length },
          { id: 'tenders', label: 'Tenders & Proposals', count: tenders.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'contracts' && (
        <DataTable
          columns={contractColumns}
          data={contracts}
          isLoading={isContractsLoading}
          searchPlaceholder="Search contract title, code, client name..."
        />
      )}

      {activeTab === 'tenders' && (
        <DataTable
          columns={tenderColumns}
          data={tenders}
          isLoading={isTendersLoading}
          searchPlaceholder="Search tender ID, client, industry..."
        />
      )}

      {/* CONTRACT DETAILS & PROFITABILITY DRAWER */}
      <Drawer
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
        title={selectedContract ? `${selectedContract.contractCode} • ${selectedContract.title}` : 'Contract Details'}
        subtitle={selectedContract?.customerName || selectedContract?.clientName}
        size="xl"
      >
        {selectedContract && (
          <div className="space-y-6 text-xs p-1">
            {/* Header Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Value</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {formatCurrency(selectedContract.totalContractValue)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Billed: {formatCurrency(selectedContract.realizedRevenue)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">SLA Actual</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                  {selectedContract.slaActualPercent}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Target: {selectedContract.slaTargetPercent}%</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Dedicated Fleet</span>
                <span className="text-base font-bold font-mono text-blue-400 mt-1 block">
                  {selectedContract.dedicatedVehiclesCount || 0} Units
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Min {selectedContract.minMonthlyTrips || 0} Trips/mo</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Billing Cycle</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block capitalize">
                  {selectedContract.billingCycle || 'Monthly'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Net {selectedContract.paymentTermsDays || 30} Days</span>
              </div>
            </div>

            {/* LIVE CONTRACT PROFITABILITY P&L BREAKDOWN */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="font-semibold text-white text-sm">Live Contract Profitability & Operational P&L</h4>
                    <span className="text-[11px] text-slate-400">Aggregated directly from executed linehaul trips and telemetry.</span>
                  </div>
                </div>
                {profitability && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                    (profitability.grossProfit ?? profitability.netProfit) >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {(profitability.profitMarginPercent ?? profitability.marginPercent).toFixed(1)}% Margin
                  </span>
                )}
              </div>

              {isProfitabilityLoading ? (
                <div className="py-8 text-center text-slate-500">Calculating telemetry P&L...</div>
              ) : profitability ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans block">Billed Revenue</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                        {formatCurrency(profitability.billedRevenue || profitability.totalRevenue || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {profitability.completedTrips || profitability.completedTripsCount || 0} Trips Billed
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans block">Fuel Expenditure</span>
                      <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                        {formatCurrency(profitability.fuelExpenses)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">Trip Logs & Receipts</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans block">Maintenance Allocated</span>
                      <span className="text-sm font-bold text-purple-400 mt-0.5 block">
                        {formatCurrency(profitability.maintenanceExpenses || profitability.maintenanceCost || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">Fleet Work Orders</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-sans block">Net Contract Profit</span>
                      <span className={`text-sm font-bold mt-0.5 block ${
                        (profitability.grossProfit ?? profitability.netProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(profitability.grossProfit ?? profitability.netProfit)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">Gross Surplus</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Total Operating Expenses (Fuel + Crew + Maintenance):</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatCurrency(
                        profitability.totalOperatingCosts ||
                        (profitability.fuelExpenses + (profitability.driverExpenses || profitability.driverWages) + (profitability.maintenanceExpenses || profitability.maintenanceCost))
                      )}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Contract Routes / SLA Specs */}
            {selectedContract.routes && selectedContract.routes.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Contracted Dedicated Routes & Rates
                </span>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/70 text-slate-300 font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="p-2.5">Origin ➔ Destination</th>
                        <th className="p-2.5 text-right">Distance</th>
                        <th className="p-2.5 text-right">Rate / Trip</th>
                        <th className="p-2.5 text-right">Transit Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedContract.routes.map((route, idx) => (
                        <tr key={route.id || idx} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-medium text-white">
                            {route.origin} <span className="text-slate-500">➔</span> {route.destination}
                          </td>
                          <td className="p-2.5 text-right font-mono">{route.distanceKm} km</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(route.ratePerTrip || route.agreedRate || 0)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">
                            {route.transitTimeHours ? `${route.transitTimeHours}h max` : 'SLA Standard'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* NEW DIRECT CONTRACT ONBOARDING MODAL */}
      <Modal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        title="Onboard Enterprise SLA Contract"
        description="Establish a long-term dedicated fleet agreement with minimum trip guarantees and performance SLAs."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createContractMutation.mutate(newContractForm);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contract Agreement Title"
              required
              placeholder="e.g. Midwest Linehaul Dedicated Logistics"
              value={newContractForm.title}
              onChange={(e) => setNewContractForm({ ...newContractForm, title: e.target.value })}
            />

            <Select
              label="Registered CRM Enterprise Shipper"
              required
              value={newContractForm.customerId}
              onChange={(e) => {
                const custId = e.target.value;
                const c = customers.find((cust) => cust.id === custId);
                setNewContractForm({
                  ...newContractForm,
                  customerId: custId,
                  customerName: c ? (c.companyName || c.name) : newContractForm.customerName,
                });
              }}
              options={[
                { value: '', label: '-- Select CRM Shipper Account --' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.companyName || c.name} (${c.contactPerson})`,
                })),
              ]}
            />

            <Input
              label="Enterprise Shipper Name (Display)"
              required
              value={newContractForm.customerName}
              onChange={(e) => setNewContractForm({ ...newContractForm, customerName: e.target.value })}
            />

            <Input
              label="Total Contract Value ($)"
              type="number"
              required
              value={newContractForm.totalContractValue}
              onChange={(e) => setNewContractForm({ ...newContractForm, totalContractValue: Number(e.target.value) })}
            />

            <Input
              label="Target SLA Performance (%)"
              type="number"
              value={newContractForm.slaTargetPercent}
              onChange={(e) => setNewContractForm({ ...newContractForm, slaTargetPercent: Number(e.target.value) })}
            />

            <Input
              label="Dedicated Vehicles Assigned"
              type="number"
              value={newContractForm.dedicatedVehiclesCount}
              onChange={(e) => setNewContractForm({ ...newContractForm, dedicatedVehiclesCount: Number(e.target.value) })}
            />

            <Input
              label="Minimum Monthly Guaranteed Trips"
              type="number"
              value={newContractForm.minMonthlyTrips}
              onChange={(e) => setNewContractForm({ ...newContractForm, minMonthlyTrips: Number(e.target.value) })}
            />

            <Select
              label="Billing Cycle"
              value={newContractForm.billingCycle}
              onChange={(e) => setNewContractForm({ ...newContractForm, billingCycle: e.target.value as any })}
              options={[
                { value: 'monthly', label: 'Monthly Invoicing' },
                { value: 'biweekly', label: 'Bi-Weekly Invoicing' },
                { value: 'quarterly', label: 'Quarterly Invoicing' },
                { value: 'per_trip', label: 'Per-Trip Settlement' },
              ]}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewContractModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createContractMutation.isPending}>
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tender Cost Estimator & Proposal Builder Modal */}
      <Modal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        title="Tender Cost Estimator & Proposal Builder"
        description="Estimate fleet equipment costs, crew payroll, fuel margins, and projected contract value."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            tenderMutation.mutate(newTender);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tender Project Title"
              required
              placeholder="e.g. Regional Highway Haulage Contract"
              value={newTender.title}
              onChange={(e) => setNewTender({ ...newTender, title: e.target.value })}
            />

            <Input
              label="Issuing Client / Authority"
              required
              placeholder="e.g. USPS, Pfizer, Target"
              value={newTender.clientName}
              onChange={(e) => setNewTender({ ...newTender, clientName: e.target.value })}
            />

            <Input
              label="Industry Classification"
              placeholder="e.g. Pharmaceuticals, Retail, Energy"
              value={newTender.industry}
              onChange={(e) => setNewTender({ ...newTender, industry: e.target.value })}
            />

            <Input
              label="Dedicated Vehicles Required"
              type="number"
              value={newTender.estimatedVehicleRequired}
              onChange={(e) => setNewTender({ ...newTender, estimatedVehicleRequired: Number(e.target.value) })}
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a] space-y-3">
            <span className="font-semibold text-white block flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-400" />
              Automated Cost Breakdown & Margins
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Fleet Amortization ($)"
                type="number"
                value={newTender.fleetCosts}
                onChange={(e) => setNewTender({ ...newTender, fleetCosts: Number(e.target.value) })}
              />
              <Input
                label="Projected Fuel ($)"
                type="number"
                value={newTender.fuelEstimates}
                onChange={(e) => setNewTender({ ...newTender, fuelEstimates: Number(e.target.value) })}
              />
              <Input
                label="Crew Payroll ($)"
                type="number"
                value={newTender.crewPayroll}
                onChange={(e) => setNewTender({ ...newTender, crewPayroll: Number(e.target.value) })}
              />
              <Input
                label="Target Margin ($)"
                type="number"
                value={newTender.margins}
                onChange={(e) => setNewTender({ ...newTender, margins: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">Total Tender Proposal Value:</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {formatCurrency(newTender.fleetCosts + newTender.fuelEstimates + newTender.crewPayroll + newTender.margins)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsTenderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={tenderMutation.isPending}>
              Save & Build Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
