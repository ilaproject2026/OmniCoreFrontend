import React from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { ShieldAlert, Lock, ArrowLeft, UserCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleAccessRestrictedProps {
  moduleName: string;
  requiredPermission?: string;
  description?: string;
}

export const RoleAccessRestricted: React.FC<RoleAccessRestrictedProps> = ({
  moduleName,
  requiredPermission,
  description,
}) => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const roleLabel = user?.tenantRole
    ? user.tenantRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : user?.isPlatformUser
    ? 'Platform Administrator'
    : 'Standard User';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Card className="max-w-lg w-full p-8 border-slate-800 bg-[#0f172a]/70 shadow-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="warning" size="sm" dot>
              Role Permission Limited
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {moduleName} Access Restricted
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {description ||
              `Your current account role does not have administrative privileges to access the ${moduleName} module.`}
          </p>
        </div>

        {/* Role & Permission Specs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Your Active Role:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Organization:</span>
            <span className="font-medium text-slate-200">{tenant.name}</span>
          </div>

          {requiredPermission && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Required Entitlement:</span>
              <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-[11px] text-slate-500">
            Need access to this function? Contact your Tenant Administrator ({tenant.primaryContactEmail || 'admin@omnicore.io'}) to update your role permissions.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/app/dashboard">
              <Button size="sm" variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Return to Operations Hub
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
