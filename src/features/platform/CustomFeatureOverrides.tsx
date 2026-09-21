import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { platformApi } from '../../api/platform.api';
import { TenantCustomFeatureOverride, Tenant } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import {
  Layers,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Zap,
  KeyRound,
} from 'lucide-react';

import {
  useTenantDetail,
  useTenantCustomOverrides,
  useUpdateTenantCustomOverrideMutation,
  useCreateCustomFeatureDefinitionMutation,
} from '../../hooks/queries';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';

export const CustomFeatureOverrides: React.FC = () => {
  const { id = 'tenant_apex' } = useParams<{ id: string }>();

  // TanStack Queries
  const { data: tenant, isLoading: isLoadingTenant } = useTenantDetail(id);
  const {
    data: overrides = [],
    isLoading: isLoadingOverrides,
    isError: isOverridesError,
    error: overridesError,
    refetch: refetchOverrides,
  } = useTenantCustomOverrides(id);

  // TanStack Mutations
  const updateOverrideMutation = useUpdateTenantCustomOverrideMutation();
  const createOverrideMutation = useCreateCustomFeatureDefinitionMutation();

  const loading = isLoadingTenant || isLoadingOverrides;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleToggle = async (featureKey: string, currentStatus: boolean) => {
    try {
      await updateOverrideMutation.mutateAsync({
        tenantId: id,
        featureKey,
        isEnabled: !currentStatus,
      });
    } catch (err) {
      console.error('Failed to toggle override:', err);
    }
  };

  const handleAddNewOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    try {
      await createOverrideMutation.mutateAsync({
        tenantId: id,
        featureKey: newKey,
        featureName: newName || newKey,
        description: newDesc,
        isEnabled: true,
      });
      setIsAddModalOpen(false);
      setNewKey('');
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error('Failed to add override:', err);
    }
  };

  const getSourceBadge = (source: TenantCustomFeatureOverride['source']) => {
    switch (source) {
      case 'custom_provision':
        return <Badge variant="warning" size="xs">CUSTOM OVERRIDE</Badge>;
      case 'enterprise_override':
        return <Badge variant="danger" size="xs">ENTERPRISE OVERRIDE</Badge>;
      case 'vertical':
        return <Badge variant="info" size="xs">VERTICAL DEFAULT</Badge>;
      case 'addon':
        return <Badge variant="neutral" size="xs">SUBSCRIBED ADD-ON</Badge>;
      case 'package':
      default:
        return <Badge variant="outline" size="xs">PACKAGE CORE</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/platform/tenants"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Tenants Directory
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                Custom Feature Provisioning & Overrides
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant or revoke isolated operational features for <strong className="text-slate-200">{tenant?.name || 'Tenant'}</strong> with audit source attribution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/platform/roles">
            <Button
              size="sm"
              variant="outline"
              icon={<KeyRound className="h-4 w-4 text-amber-400" />}
            >
              Role Permissions Matrix
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchOverrides()}
            icon={<RefreshCw className={`h-4 w-4 ${isLoadingOverrides ? 'animate-spin' : ''}`} />}
          >
            Reload Overrides
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Provision Custom Feature
          </Button>
        </div>
      </div>

      {/* Tenant Context Bar */}
      {tenant && (
        <Card className="p-4 border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-blue-400" />
            <div>
              <span className="font-bold text-white text-sm">{tenant.name}</span>
              <span className="text-slate-400 ml-2 font-mono">({tenant.slug})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <div>Package: <strong className="text-blue-400 uppercase">{tenant.subscription?.package}</strong></div>
            <div>Billing: <strong className="text-slate-200 uppercase">{tenant.subscription?.billingCycle}</strong></div>
            <div>Active MRR: <strong className="text-emerald-400 font-mono">${tenant.subscription?.mrr}</strong></div>
          </div>
        </Card>
      )}

      {/* Overrides Table */}
      <QueryStateWrapper
        isLoading={isLoadingOverrides}
        isError={isOverridesError}
        error={overridesError}
        onRetry={refetchOverrides}
        loadingMessage="Loading feature entitlement matrix from platform registry..."
      >
        <Card className="p-0 overflow-hidden border-slate-800">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Feature Entitlement Matrix ({overrides.length} rules)
          </span>
          <span className="text-[11px] text-slate-400">
            Custom overrides supersede standard subscription tier restrictions.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/40 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Feature Name & Key</th>
                <th className="p-3">Source Attribution</th>
                <th className="p-3">Author / Timestamp</th>
                <th className="p-3">Entitlement Status</th>
                <th className="p-3 text-right">Provisioning Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {overrides.map((override) => (
                <tr key={override.featureKey} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-200">{override.name}</div>
                    <span className="font-mono text-[10px] text-slate-500">{override.featureKey}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">{override.description}</p>
                  </td>
                  <td className="p-3">
                    {getSourceBadge(override.source)}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    <div>{override.enabledBy || 'system'}</div>
                    <div className="text-slate-500 text-[10px]">{override.enabledAt || 'Initial Provision'}</div>
                  </td>
                  <td className="p-3">
                    {override.isEnabled ? (
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                        <XCircle className="h-4 w-4" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="xs"
                      variant={override.isEnabled ? 'outline' : 'primary'}
                      className={override.isEnabled ? 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20' : 'bg-emerald-600 hover:bg-emerald-500'}
                      onClick={() => handleToggle(override.featureKey, override.isEnabled)}
                    >
                      {override.isEnabled ? 'Revoke Override' : 'Enable Feature'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </QueryStateWrapper>

      {/* Modal: Add Custom Override */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision Custom Feature Override"
      >
        <form onSubmit={handleAddNewOverride} className="space-y-4">
          <Input
            label="Feature Key"
            required
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="e.g. ai_predictive_telematics"
          />

          <Input
            label="Display Name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. AI Predictive Telematics"
          />

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Reason / Description</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              placeholder="Enterprise contract exception requested by client..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<Zap className="h-4 w-4" />}>
              Grant Feature Entitlement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
