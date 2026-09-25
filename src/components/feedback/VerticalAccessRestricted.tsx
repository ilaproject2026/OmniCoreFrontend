import React from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2, Crown, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VerticalType } from '../../types';
import { VERTICALS } from '../../config/constants';

interface VerticalAccessRestrictedProps {
  verticalKey: VerticalType;
  serviceTitle?: string;
  description?: string;
}

export const VerticalAccessRestricted: React.FC<VerticalAccessRestrictedProps> = ({
  verticalKey,
  serviceTitle,
  description,
}) => {
  const { user } = useAuth();
  const { tenant, updateTenantVerticals } = useTenant();

  const isOmniCoreAdmin = Boolean(
    user?.isPlatformUser ||
    user?.platformRole === 'omnicore_admin' ||
    user?.platformRole === 'super_admin'
  );

  const verticalDef = VERTICALS[verticalKey] || {
    name: serviceTitle || verticalKey.replace(/_/g, ' ').toUpperCase(),
    description: 'Specialized enterprise transport service vertical',
    features: [],
  };

  const serviceName = serviceTitle || verticalDef.name;

  const handleAdminGrant = async () => {
    if (!isOmniCoreAdmin || !tenant?.id) return;
    const current = tenant.verticals || [];
    if (!current.includes(verticalKey)) {
      await updateTenantVerticals(tenant.id, [...current, verticalKey]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Card className="max-w-2xl w-full p-8 border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="warning" size="sm" dot>
              Vertical Service Restricted
            </Badge>
            <Badge variant="purple" size="sm">
              Controlled by OmniCore Admin
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {serviceName} Not Activated
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
            {description ||
              `Access to ${serviceName} is governed by your contract with OmniCore. When your organization contracted for software support, this specific vertical was not provisioned for your workspace.`}
          </p>
        </div>

        {/* Vertical Entitlement Specs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px]">Organization Workspace:</span>
              <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                {tenant.name || 'Your Company'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Required Vertical:</span>
              <Badge variant="glow" size="sm" className="mt-0.5">
                {serviceName}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block mb-2">
              Currently Activated Verticals for this Customer:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tenant.verticals && tenant.verticals.length > 0 ? (
                tenant.verticals.map((v) => {
                  const def = VERTICALS[v];
                  return (
                    <span
                      key={v}
                      className="px-2 py-1 rounded-md bg-blue-950/60 border border-blue-800/40 text-blue-300 text-[11px] flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3 text-blue-400" />
                      {def?.name || v}
                    </span>
                  );
                })
              ) : (
                <span className="text-slate-500 italic">No specialized verticals active</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-1">
            <span className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              OmniCore Role-Based Access Model:
            </span>
            <p className="text-[11px] text-slate-400 leading-normal">
              In OmniCore, role-based access is centered around customer service requirements.
              The OmniCore Project Admin grants customers access to specific software verticals
              (such as Courier Express, Tourist Bus/Taxi, or Commuter Shuttle) based on business contracts.
            </p>
          </div>
        </div>

        {/* OmniCore Admin Instant Activation Action */}
        {isOmniCoreAdmin && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-purple-200 text-xs">
                OmniCore Project Admin Override
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80">
              As the OmniCore Project Administrator, you have authority to immediately grant this customer access to the {serviceName} vertical.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdminGrant}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Grant {serviceName} to {tenant.name}
            </Button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/app/dashboard">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Dashboard
            </Button>
          </Link>
          {!isOmniCoreAdmin && (
            <a
              href="mailto:support@omnicore.io?subject=Vertical%20Activation%20Request"
              className="w-full sm:w-auto"
            >
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                Request Vertical Activation from OmniCore
              </Button>
            </a>
          )}
        </div>
      </Card>
    </div>
  );
};
