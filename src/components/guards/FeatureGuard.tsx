import React from 'react';
import { AddonKey, VerticalType } from '../../types';
import { useTenant } from '../../contexts/TenantContext';
import { VerticalAccessRestricted } from '../feedback/VerticalAccessRestricted';

interface FeatureGuardProps {
  module?: string;
  vertical?: VerticalType | VerticalType[];
  serviceTitle?: string;
  feature?: string;
  addon?: AddonKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  module,
  vertical,
  serviceTitle,
  feature,
  addon,
  fallback = null,
  children,
}) => {
  const { hasFeature, hasAddon, isModuleAllowedByPlan, isVerticalEnabled, isModuleAllowedByVertical } = useTenant();

  // 1. Vertical-based access control (Primary RBAC in OmniCore)
  if (vertical && !isVerticalEnabled(vertical)) {
    const primaryKey = Array.isArray(vertical) ? vertical[0] : vertical;
    return <>{fallback || <VerticalAccessRestricted verticalKey={primaryKey} serviceTitle={serviceTitle} />}</>;
  }

  // 2. Module vertical compatibility
  if (module && !isModuleAllowedByVertical(module)) {
    return <>{fallback}</>;
  }

  // 3. Subscription plan tier
  if (module && !isModuleAllowedByPlan(module)) {
    return <>{fallback}</>;
  }

  // 4. Add-on check
  if (addon && !hasAddon(addon)) {
    return <>{fallback}</>;
  }

  // 5. Feature toggle
  if (feature && !hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
