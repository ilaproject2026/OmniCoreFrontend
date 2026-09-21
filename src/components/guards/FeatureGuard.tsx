import React from 'react';
import { AddonKey } from '../../types';
import { useTenant } from '../../contexts/TenantContext';

interface FeatureGuardProps {
  module?: string;
  feature?: string;
  addon?: AddonKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  module,
  feature,
  addon,
  fallback = null,
  children,
}) => {
  const { hasFeature, hasAddon, isModuleAllowedByPlan } = useTenant();

  if (module && !isModuleAllowedByPlan(module)) {
    return <>{fallback}</>;
  }

  if (addon && !hasAddon(addon)) {
    return <>{fallback}</>;
  }

  if (feature && !hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
