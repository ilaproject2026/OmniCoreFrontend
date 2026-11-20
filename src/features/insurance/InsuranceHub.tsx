import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insuranceApi } from '../../api/insurance.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { InsurancePolicy, InsuranceClaim } from '../../types';
import { Plus, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

const errorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Request failed. Please try again.');
  }
  return 'Request failed. Please try again.';
};

export const InsuranceHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'policies' | 'claims'>('policies');
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimToSettle, setClaimToSettle] = useState<InsuranceClaim | null>(null);
  const [settledAmountInput, setSettledAmountInput] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [newPolicy, setNewPolicy] = useState({
    policyNumber: '',
    provider: '',
    type: 'fleet_comprehensive' as InsurancePolicy['type'],
    coverageAmount: 0,
    premiumAmount: 0,
    startDate: today,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [newClaim, setNewClaim] = useState({
    policyId: '',
    incidentDate: today,
    claimAmount: 0,
    description: '',
  });

  const { data: policies = [], isLoading: isPolLoading } = useQuery({
    queryKey: ['insurancePolicies'],
    queryFn: () => insuranceApi.getPolicies(),
  });

  const { data: claims = [], isLoading: isClmLoading } = useQuery({
    queryKey: ['insuranceClaims'],
    queryFn: () => insuranceApi.getClaims(),
  });

  const createPolicyMutation = useMutation({
    mutationFn: () => insuranceApi.createPolicy(newPolicy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
      setIsPolicyModalOpen(false);
      setNewPolicy({
        policyNumber: '', provider: '', type: 'fleet_comprehensive', coverageAmount: 0,
        premiumAmount: 0, startDate: today, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: () => insuranceApi.createClaim(newClaim),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] });
      setIsClaimModalOpen(false);
      setNewClaim({ policyId: '', incidentDate: today, claimAmount: 0, description: '' });
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ claim, status, settledAmount }: { claim: InsuranceClaim; status: InsuranceClaim['status']; settledAmount?: number }) =>
      insuranceApi.updateClaimStatus(claim.id, status, settledAmount === undefined ? undefined : { settledAmount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] }),
  });

  const policyColumns: ColumnDef<InsurancePolicy>[] = [
    {
      key: 'number',
      header: 'Policy Number & Underwriter',
      sortable: true,
      accessor: (r) => r.policyNumber,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.policyNumber}</span>
          <span className="text-slate-300 font-medium">{row.provider}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Coverage Type',
      accessor: (r) => r.type,
      render: (val: string) => (
        <Badge variant="outline" size="sm" className="capitalize">
          {val.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'coverage',
      header: 'Coverage Amount',
      sortable: true,
      accessor: (r) => r.coverageAmount,
      render: (val) => <span className="font-mono font-bold text-emerald-400 text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'premium',
      header: 'Annual Premium',
      sortable: true,
      accessor: (r) => r.premiumAmount,
      render: (val) => <span className="font-mono text-slate-300 text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'expiry',
      header: 'Policy Expiry',
      accessor: (r) => r.expiryDate,
      render: (val, row) => (
        <div className="text-xs font-mono">
          <span className="text-slate-200">{formatDate(val)}</span>
          {row.status === 'expiring_soon' && (
            <span className="text-amber-400 font-bold block text-[10px]">Renewal Due Soon</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'active') return <Badge variant="success" dot>Active Policy</Badge>;
        if (val === 'expiring_soon') return <Badge variant="warning" dot>Expiring</Badge>;
        return <Badge variant="danger">{val}</Badge>;
      },
    },
  ];

  const claimColumns: ColumnDef<InsuranceClaim>[] = [
    {
      key: 'claimNumber',
      header: 'Claim Number',
      accessor: (r) => r.claimNumber,
      render: (val) => <span className="font-mono font-bold text-white text-xs">{val}</span>,
    },
    {
      key: 'vehicle',
      header: 'Asset & Incident Date',
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-mono text-blue-400 font-bold block">{row.vehicleReg}</span>
          <span className="text-slate-400 text-[11px]">{formatDate(row.incidentDate)}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Claimed / Settled',
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-white font-bold block">{formatCurrency(row.claimAmount)}</span>
          {row.settledAmount && (
            <span className="text-emerald-400 text-[10px]">Settled: {formatCurrency(row.settledAmount)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Claim Status',
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'settled') return <Badge variant="success">Settled</Badge>;
        if (val === 'approved') return <Badge variant="info">Approved</Badge>;
        if (val === 'rejected') return <Badge variant="danger">Rejected</Badge>;
        if (val === 'investigating') return <Badge variant="warning">Under Survey</Badge>;
        return <Badge variant="default">Filed</Badge>;
      },
    },
    {
      key: 'desc',
      header: 'Damage Report Summary',
      accessor: (r) => r.description,
      render: (val) => <span className="text-slate-300 text-xs truncate max-w-[200px] block">{val}</span>,
    },
    {
      key: 'actions',
      header: 'Next Action',
      render: (_, row) => {
        if (row.status === 'filed') {
          return (
            <Button size="xs" variant="outline" leftIcon={<ArrowRight className="h-3 w-3" />} isLoading={updateClaimMutation.isPending}
              onClick={() => updateClaimMutation.mutate({ claim: row, status: 'investigating' })}>
              Start survey
            </Button>
          );
        }
        if (row.status === 'investigating') {
          return (
            <div className="flex gap-1.5">
              <Button size="xs" variant="success" leftIcon={<CheckCircle2 className="h-3 w-3" />} isLoading={updateClaimMutation.isPending}
                onClick={() => updateClaimMutation.mutate({ claim: row, status: 'approved' })}>
                Approve
              </Button>
              <Button size="xs" variant="danger" leftIcon={<XCircle className="h-3 w-3" />} isLoading={updateClaimMutation.isPending}
                onClick={() => updateClaimMutation.mutate({ claim: row, status: 'rejected' })}>
                Reject
              </Button>
            </div>
          );
        }
        if (row.status === 'approved') {
          return (
            <Button size="xs" variant="success" leftIcon={<CheckCircle2 className="h-3 w-3" />}
              onClick={() => { setClaimToSettle(row); setSettledAmountInput(String(row.settledAmount ?? row.claimAmount)); }}>
              Record settlement
            </Button>
          );
        }
        return <span className="text-[11px] text-slate-500">No action</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Insurance, Claims & Legal Compliance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Underwriter policies, goods-in-transit spoilage cover, and accident damage claim files.
          </p>
        </div>

        <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => activeTab === 'policies' ? setIsPolicyModalOpen(true) : setIsClaimModalOpen(true)}>
          {activeTab === 'policies' ? 'Add Insurance Policy' : 'File Insurance Claim'}
        </Button>
      </div>

      <Tabs
        tabs={[
          { id: 'policies', label: 'Insurance Policies', count: policies.length },
          { id: 'claims', label: 'Claims Ledger', count: claims.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'policies' && (
        <DataTable
          columns={policyColumns}
          data={policies}
          isLoading={isPolLoading}
          searchPlaceholder="Search policy number, provider..."
        />
      )}

      {activeTab === 'claims' && (
        <div className="space-y-3">
          {updateClaimMutation.isError && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errorMessage(updateClaimMutation.error)}
            </p>
          )}
          <DataTable
            columns={claimColumns}
            data={claims}
            isLoading={isClmLoading}
            searchPlaceholder="Search claim number, vehicle..."
          />
        </div>
      )}

      <Modal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} title="Add Insurance Policy"
        description="Register a fleet or cargo policy for this tenant." size="md">
        <form onSubmit={(event) => { event.preventDefault(); createPolicyMutation.mutate(); }} className="space-y-4 text-xs">
          {createPolicyMutation.isError && <p role="alert" className="text-red-300">{errorMessage(createPolicyMutation.error)}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Policy Number" required value={newPolicy.policyNumber}
              onChange={(event) => setNewPolicy({ ...newPolicy, policyNumber: event.target.value })} />
            <Input label="Insurance Provider" required value={newPolicy.provider}
              onChange={(event) => setNewPolicy({ ...newPolicy, provider: event.target.value })} />
          </div>
          <Select label="Coverage Type" required value={newPolicy.type}
            onChange={(event) => setNewPolicy({ ...newPolicy, type: event.target.value as InsurancePolicy['type'] })}
            options={[
              { value: 'fleet_comprehensive', label: 'Fleet Comprehensive' },
              { value: 'goods_in_transit', label: 'Goods in Transit' },
              { value: 'third_party_liability', label: 'Third Party Liability' },
              { value: 'cold_spoilage_cover', label: 'Cold / Spoilage Cover' },
            ]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Coverage Amount" type="number" min={1} step={1} required value={newPolicy.coverageAmount}
              onChange={(event) => setNewPolicy({ ...newPolicy, coverageAmount: Number(event.target.value) })} />
            <Input label="Annual Premium" type="number" min={0} step={1} required value={newPolicy.premiumAmount}
              onChange={(event) => setNewPolicy({ ...newPolicy, premiumAmount: Number(event.target.value) })} />
            <Input label="Start Date" type="date" required value={newPolicy.startDate}
              onChange={(event) => setNewPolicy({ ...newPolicy, startDate: event.target.value })} />
            <Input label="Expiry Date" type="date" min={newPolicy.startDate} required value={newPolicy.expiryDate}
              onChange={(event) => setNewPolicy({ ...newPolicy, expiryDate: event.target.value })} />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsPolicyModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createPolicyMutation.isPending}>Save Policy</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} title="File Insurance Claim"
        description="Create a claim against an active policy. A claim number will be generated automatically." size="md">
        <form onSubmit={(event) => { event.preventDefault(); createClaimMutation.mutate(); }} className="space-y-4 text-xs">
          {createClaimMutation.isError && <p role="alert" className="text-red-300">{errorMessage(createClaimMutation.error)}</p>}
          <Select label="Insurance Policy" required value={newClaim.policyId}
            onChange={(event) => setNewClaim({ ...newClaim, policyId: event.target.value })}
            options={[
              { value: '', label: policies.length ? 'Select a policy' : 'Add a policy first', disabled: true },
              ...policies.map((policy) => ({ value: policy.id, label: `${policy.policyNumber} — ${policy.provider}` })),
            ]} />
          {!policies.length && <p className="text-amber-400 text-xs">Create an insurance policy before filing a claim.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Incident Date" type="date" required value={newClaim.incidentDate}
              onChange={(event) => setNewClaim({ ...newClaim, incidentDate: event.target.value })} />
            <Input label="Claim Amount" type="number" min={1} step={1} required value={newClaim.claimAmount}
              onChange={(event) => setNewClaim({ ...newClaim, claimAmount: Number(event.target.value) })} />
          </div>
          <Input label="Incident / Damage Description" required value={newClaim.description}
            onChange={(event) => setNewClaim({ ...newClaim, description: event.target.value })} />
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsClaimModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!newClaim.policyId || newClaim.claimAmount <= 0 || createClaimMutation.isPending}
              isLoading={createClaimMutation.isPending}>Submit Claim</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(claimToSettle)} onClose={() => setClaimToSettle(null)} title="Record Claim Settlement"
        description={claimToSettle ? `Enter the approved payout for claim ${claimToSettle.claimNumber}.` : ''} size="sm">
        {claimToSettle && (
          <form onSubmit={(event) => {
            event.preventDefault();
            updateClaimMutation.mutate({ claim: claimToSettle, status: 'settled', settledAmount: Number(settledAmountInput) }, {
              onSuccess: () => setClaimToSettle(null),
            });
          }} className="space-y-4">
            {updateClaimMutation.isError && <p role="alert" className="text-red-300 text-xs">{errorMessage(updateClaimMutation.error)}</p>}
            <Input label="Approved Settlement Amount" type="number" min={1} max={claimToSettle.claimAmount} step={1} required
              value={settledAmountInput} onChange={(event) => setSettledAmountInput(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setClaimToSettle(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={Number(settledAmountInput) <= 0 || updateClaimMutation.isPending}
                isLoading={updateClaimMutation.isPending}>Save Settlement</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
