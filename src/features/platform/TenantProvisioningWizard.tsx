import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { platformApi, BACKEND_PACKAGE_UUID_FALLBACKS } from '../../api/platform.api';
import { useQuery } from '@tanstack/react-query';
import { VERTICALS, PACKAGES, ADDONS } from '../../config/constants';
import { VerticalType, PackageTier, AddonKey } from '../../types';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Layers,
  Package as PackageIcon,
  PlusCircle,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useTenant } from '../../contexts/TenantContext';
import { PlanFeatureRestricted } from '../../components/feedback/PlanFeatureRestricted';

export const TenantProvisioningWizard: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateMultipleTenants } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);

  if (!canCreateMultipleTenants) {
    return (
      <div className="py-8">
        <PlanFeatureRestricted
          moduleName="Multiple Tenant Provisioning"
          requiredTier="enterprise"
          description="Multi-subsidiary and multiple tenant creation is an exclusive capability of the OmniCore Enterprise plan. Upgrade to Enterprise to spin up and orchestrate multiple isolated tenant workspaces."
        />
      </div>
    );
  }
  const [provisionStageText, setProvisionStageText] = useState('');
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  // Load packages from backend to resolve real UUIDs
  const { data: backendPackages = [] } = useQuery({
    queryKey: ['backendPackages'],
    queryFn: () => platformApi.getPackages(),
  });

  // Form State across 8 Steps
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    slug: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    country: 'United States',
    city: '',
    address: '',
  });

  const [selectedVerticals, setSelectedVerticals] = useState<VerticalType[]>(['freight_logistics']);
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>('standard');
  const [selectedAddons, setSelectedAddons] = useState<AddonKey[]>(['addon_telematics']);
  const [subscriptionConfig, setSubscriptionConfig] = useState({
    billingCycle: 'monthly' as 'monthly' | 'annually',
    currency: 'USD',
    autoRenew: true,
  });
  const [adminUser, setAdminUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tempPassword: 'OmniSecurePass2026!',
  });
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  const toggleVertical = (v: VerticalType) => {
    if (selectedVerticals.includes(v)) {
      if (selectedVerticals.length > 1) {
        setSelectedVerticals(selectedVerticals.filter((item) => item !== v));
      }
    } else {
      setSelectedVerticals([...selectedVerticals, v]);
    }
  };

  const toggleAddon = (key: AddonKey) => {
    if (selectedAddons.includes(key)) {
      setSelectedAddons(selectedAddons.filter((k) => k !== key));
    } else {
      setSelectedAddons([...selectedAddons, key]);
    }
  };

  // Pricing calculations
  const pkgDef = PACKAGES[selectedPackage];
  const pkgPrice = subscriptionConfig.billingCycle === 'monthly' ? pkgDef.monthlyPrice : pkgDef.annualPrice / 12;
  const addonsPrice = selectedAddons.reduce((sum, key) => {
    const a = ADDONS.find((addon) => addon.key === key);
    return sum + (a?.monthlyPrice || 0);
  }, 0);
  const totalMonthlyMrr = pkgPrice + addonsPrice;

  const validateStep = (step: number): boolean => {
    setStepValidationError(null);
    if (step === 1) {
      if (!companyInfo.name.trim()) {
        setStepValidationError('Please enter the Company / Fleet Operator Name.');
        return false;
      }
      if (!companyInfo.primaryContactEmail.trim() && !adminUser.email.trim()) {
        setStepValidationError('Please enter a Commercial Contact Email.');
        return false;
      }
    }
    if (step === 6) {
      if (!adminUser.email.trim() && !companyInfo.primaryContactEmail.trim()) {
        setStepValidationError('Please enter an Administrator Email address.');
        return false;
      }
    }
    return true;
  };

  // Step 8: Animated provisioning sequence
  const startProvisioning = async () => {
    setIsSubmitting(true);
    setProvisionError(null);
    setFieldErrors(null);
    setCurrentStep(8);

    const stages = [
      { pct: 20, text: 'Initializing isolated multi-tenant schema & tenant ID...' },
      { pct: 45, text: 'Mapping selected vertical models & routing partitions...' },
      { pct: 65, text: `Binding ${selectedPackage.toUpperCase()} subscription & ${selectedAddons.length} add-ons...` },
      { pct: 85, text: 'Configuring initial Tenant Administrator role & RBAC matrix...' },
      { pct: 100, text: 'Tenant ecosystem activated successfully!' },
    ];

    for (const stage of stages) {
      setProvisionProgress(stage.pct);
      setProvisionStageText(stage.text);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const companyName = companyInfo.name.trim() || 'New Tenant Workspace';
      const email =
        companyInfo.primaryContactEmail.trim() ||
        adminUser.email.trim() ||
        `admin@${companyInfo.slug || 'tenant'}.com`;

      // Persist to API with both DRF backend required fields and frontend model fields
      await platformApi.createTenant({
        // DRF serializer required fields
        company_name: companyName,
        email: email,

        // Model & frontend fields
        name: companyName,
        slug: companyInfo.slug || companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        primaryContactName: companyInfo.primaryContactName || `${adminUser.firstName} ${adminUser.lastName}`.trim(),
        primary_contact_name: companyInfo.primaryContactName || `${adminUser.firstName} ${adminUser.lastName}`.trim(),
        primaryContactEmail: email,
        primary_contact_email: email,
        primaryContactPhone: companyInfo.primaryContactPhone || adminUser.phone,
        primary_contact_phone: companyInfo.primaryContactPhone || adminUser.phone,
        phone: companyInfo.primaryContactPhone || adminUser.phone,
        country: companyInfo.country || 'United States',
        city: companyInfo.city,
        address: companyInfo.address,
        verticals: selectedVerticals,
        status: 'active',

        // Admin root user
        first_name: adminUser.firstName || 'Root',
        last_name: adminUser.lastName || 'Admin',
        admin_email: adminUser.email || email,
        admin_phone: adminUser.phone || companyInfo.primaryContactPhone,
        admin_password: adminUser.tempPassword,
        password: adminUser.tempPassword,
        admin_user: {
          first_name: adminUser.firstName || 'Root',
          last_name: adminUser.lastName || 'Admin',
          email: adminUser.email || email,
          phone: adminUser.phone || companyInfo.primaryContactPhone,
          password: adminUser.tempPassword,
        },

        // Subscription details with valid backend Package UUID
        package:
          backendPackages.find((p) => p.code?.toLowerCase() === selectedPackage.toLowerCase())?.id ||
          BACKEND_PACKAGE_UUID_FALLBACKS[selectedPackage] ||
          '18321b13-9bd0-4d52-ac59-607ef6ae260d',
        package_tier: selectedPackage,
        package_id:
          backendPackages.find((p) => p.code?.toLowerCase() === selectedPackage.toLowerCase())?.id ||
          BACKEND_PACKAGE_UUID_FALLBACKS[selectedPackage] ||
          '18321b13-9bd0-4d52-ac59-607ef6ae260d',
        subscription: {
          package: selectedPackage,
          package_id:
            backendPackages.find((p) => p.code?.toLowerCase() === selectedPackage.toLowerCase())?.id ||
            BACKEND_PACKAGE_UUID_FALLBACKS[selectedPackage] ||
            '18321b13-9bd0-4d52-ac59-607ef6ae260d',
          status: 'active',
          billingCycle: subscriptionConfig.billingCycle,
          startDate: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          mrr: Math.round(totalMonthlyMrr),
          currency: subscriptionConfig.currency,
          enabledAddons: selectedAddons,
          autoRenew: subscriptionConfig.autoRenew,
        },
      });

      setIsSubmitting(false);
      setIsProvisioned(true);
    } catch (err: any) {
      setIsSubmitting(false);
      const apiErr = err.response?.data;
      const errorMsg =
        apiErr?.error?.message ||
        apiErr?.message ||
        err.message ||
        'Tenant provisioning failed. Please check validation rules.';
      const errorsObj = apiErr?.error?.fields || apiErr?.fields || apiErr?.errors || null;
      setProvisionError(errorMsg);
      setFieldErrors(errorsObj);
    }
  };

  const stepTitles = [
    'Company Information',
    'Select Verticals',
    'Select Package',
    'Optional Add-ons',
    'Subscription Config',
    'Initial Administrator',
    'Review Summary',
    'Provision Tenant',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Provision New SaaS Tenant</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise 8-Step Multi-Tenant Provisioning Wizard
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/platform/tenants')}>
          Cancel
        </Button>
      </div>

      {/* Steps Indicator Bar */}
      <div className="bg-[#141c2e] border border-slate-800 rounded-xl p-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-[650px] justify-between">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <div key={title} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0',
                      isDone && 'bg-blue-600 text-white',
                      isCurrent && 'bg-blue-500/20 text-blue-400 border border-blue-500 ring-2 ring-blue-500/30',
                      !isDone && !isCurrent && 'bg-slate-800 text-slate-500 border border-slate-700'
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : stepNum}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium whitespace-nowrap',
                      isCurrent ? 'text-white font-semibold' : 'text-slate-400'
                    )}
                  >
                    {title}
                  </span>
                </div>
                {idx < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-6 sm:w-10 mx-2 transition-all shrink-0',
                      isDone ? 'bg-blue-600' : 'bg-slate-800'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <Card className="p-6">
        {/* STEP 1: Company Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 1: Company & Organization Information</h3>
              <p className="text-xs text-slate-400">Enter primary commercial identity and legal operating details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input
                label="Company / Fleet Operator Name"
                required
                placeholder="e.g. Acme Transport Logistics"
                value={companyInfo.name}
                error={fieldErrors?.company_name?.[0] || fieldErrors?.name?.[0]}
                onChange={(e) => {
                  const val = e.target.value;
                  setCompanyInfo({
                    ...companyInfo,
                    name: val,
                    slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                  });
                  if (fieldErrors?.company_name || fieldErrors?.name) {
                    setFieldErrors((prev) => {
                      if (!prev) return null;
                      const next = { ...prev };
                      delete next.company_name;
                      delete next.name;
                      return Object.keys(next).length ? next : null;
                    });
                  }
                }}
              />

              <div className="space-y-1">
                <Input
                  label="Tenant Subdomain / Slug"
                  required
                  placeholder="e.g. acme-transport"
                  value={companyInfo.slug}
                  error={
                    fieldErrors?.slug
                      ? Array.isArray(fieldErrors.slug)
                        ? fieldErrors.slug.join(' ')
                        : String(fieldErrors.slug)
                      : undefined
                  }
                  onChange={(e) => {
                    setCompanyInfo({ ...companyInfo, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                    if (fieldErrors?.slug) {
                      setFieldErrors((prev) => {
                        if (!prev) return null;
                        const next = { ...prev };
                        delete next.slug;
                        return Object.keys(next).length ? next : null;
                      });
                    }
                  }}
                  helperText="Subdomain: https://[slug].omnicore.io (Must be unique across all tenants)"
                />
                {fieldErrors?.slug && (
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900);
                      const base = companyInfo.slug.replace(/-\d+$/, '') || 'workspace';
                      const newSlug = `${base}-${rand}`;
                      setCompanyInfo({ ...companyInfo, slug: newSlug });
                      setFieldErrors((prev) => {
                        if (!prev) return null;
                        const next = { ...prev };
                        delete next.slug;
                        return Object.keys(next).length ? next : null;
                      });
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate unique slug
                  </button>
                )}
              </div>

              <Input
                label="Primary Contact Person"
                required
                placeholder="e.g. Jane Doe"
                value={companyInfo.primaryContactName}
                onChange={(e) => setCompanyInfo({ ...companyInfo, primaryContactName: e.target.value })}
              />

              <Input
                label="Commercial Contact Email"
                type="email"
                required
                placeholder="e.g. admin@company.com"
                value={companyInfo.primaryContactEmail}
                error={fieldErrors?.primary_contact_email?.[0] || fieldErrors?.email?.[0]}
                onChange={(e) => {
                  setCompanyInfo({ ...companyInfo, primaryContactEmail: e.target.value });
                  if (fieldErrors?.primary_contact_email || fieldErrors?.email) {
                    setFieldErrors((prev) => {
                      if (!prev) return null;
                      const next = { ...prev };
                      delete next.primary_contact_email;
                      delete next.email;
                      return Object.keys(next).length ? next : null;
                    });
                  }
                }}
              />

              <PhoneNumberInput
                label="Primary Contact Phone"
                value={companyInfo.primaryContactPhone}
                onChange={(primaryContactPhone) => setCompanyInfo({ ...companyInfo, primaryContactPhone })}
              />

              <Input
                label="Country of Operation"
                value={companyInfo.country}
                onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
              />

              <Input
                label="City / Operating Hub"
                placeholder="e.g. Chicago, IL"
                value={companyInfo.city}
                onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
              />

              <Input
                label="Headquarters Address"
                placeholder="e.g. 400 N Michigan Ave, Suite 1200"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Select Verticals */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 2: Select Logistics & Transport Verticals</h3>
              <p className="text-xs text-slate-400">Choose one or more verticals. The tenant's navigation and telemetry widgets adapt automatically.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {Object.values(VERTICALS).map((v) => {
                const isSelected = selectedVerticals.includes(v.id);

                return (
                  <div
                    key={v.id}
                    onClick={() => toggleVertical(v.id)}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between',
                      isSelected
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/40 shadow-sm'
                        : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-white">{v.name}</span>
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full flex items-center justify-center text-[10px]',
                            isSelected ? 'bg-blue-600 text-white' : 'border border-slate-700'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{v.description}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {v.features.slice(0, 2).map((f) => (
                        <span key={f} className="text-[9px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Select Package */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 3: Select Subscription Package Tier</h3>
              <p className="text-xs text-slate-400">Select base license package determining core limits and foundational modules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {Object.values(PACKAGES).map((pkg) => {
                const isSelected = selectedPackage === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative',
                      isSelected
                        ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-[#0f172a]/70 hover:border-slate-700'
                    )}
                  >
                    {pkg.id === 'corporate' && (
                      <span className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h4 className="font-bold text-sm text-white">{pkg.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{pkg.tagline}</p>

                      <div className="mt-4 mb-3">
                        <span className="text-2xl font-black text-white">${pkg.monthlyPrice}</span>
                        <span className="text-xs text-slate-400"> /mo</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Max Vehicles:</span>
                          <span className="font-bold text-slate-200">{pkg.maxVehicles}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Staff Seats:</span>
                          <span className="font-bold text-slate-200">{pkg.maxUsers}</span>
                        </div>
                        {pkg.coreFeatures.slice(0, 3).map((f) => (
                          <div key={f} className="flex items-start gap-1.5 text-[11px] text-slate-300 pt-1">
                            <Check className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        className="w-full text-xs"
                      >
                        {isSelected ? 'Selected Tier' : 'Select Tier'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Optional Add-ons */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 4: Select Optional Specialized Add-ons</h3>
              <p className="text-xs text-slate-400">Toggle operational modules to expand warehouse, cold-chain, or integration capabilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.key);

                return (
                  <div
                    key={addon.key}
                    onClick={() => toggleAddon(addon.key)}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none',
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'h-5 w-5 rounded flex items-center justify-center text-xs shrink-0 mt-0.5',
                        isSelected ? 'bg-cyan-600 text-white' : 'border border-slate-700'
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">{addon.name}</span>
                        <span className="text-[11px] font-mono text-cyan-400 shrink-0">+${addon.monthlyPrice}/mo</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{addon.description}</p>
                      <span className="inline-block mt-2 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {addon.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Subscription Config */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 5: Billing & Subscription Configuration</h3>
              <p className="text-xs text-slate-400">Configure billing interval, currency, and payment options.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Billing Interval</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSubscriptionConfig({ ...subscriptionConfig, billingCycle: 'monthly' })}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer text-center',
                      subscriptionConfig.billingCycle === 'monthly'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <span className="text-xs font-bold block">Monthly</span>
                    <span className="text-[10px] text-slate-400">Standard monthly invoicing</span>
                  </div>

                  <div
                    onClick={() => setSubscriptionConfig({ ...subscriptionConfig, billingCycle: 'annually' })}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer text-center relative',
                      subscriptionConfig.billingCycle === 'annually'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                      Save 15%
                    </span>
                    <span className="text-xs font-bold block">Annual (Pre-paid)</span>
                    <span className="text-[10px] text-slate-400">Billed annually</span>
                  </div>
                </div>
              </div>

              <Select
                label="Contract Currency"
                value={subscriptionConfig.currency}
                onChange={(e) => setSubscriptionConfig({ ...subscriptionConfig, currency: e.target.value })}
                options={[
                  { value: 'USD', label: 'USD - United States Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'CAD', label: 'CAD - Canadian Dollar' },
                ]}
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between mt-4">
              <div>
                <p className="text-xs font-semibold text-white">Estimated Monthly Recurring Revenue (MRR)</p>
                <p className="text-[11px] text-slate-400">Base tier ({pkgDef.name}) + {selectedAddons.length} specialized add-ons</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{formatCurrency(totalMonthlyMrr)}</span>
                <span className="text-xs text-slate-500"> /month</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Initial Administrator */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 6: Initial Tenant Administrator</h3>
              <p className="text-xs text-slate-400">Create the root administrator account for this tenant workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input
                label="Admin First Name"
                required
                placeholder="e.g. Sarah"
                value={adminUser.firstName}
                onChange={(e) => setAdminUser({ ...adminUser, firstName: e.target.value })}
              />

              <Input
                label="Admin Last Name"
                required
                placeholder="e.g. Jenkins"
                value={adminUser.lastName}
                onChange={(e) => setAdminUser({ ...adminUser, lastName: e.target.value })}
              />

              <Input
                label="Admin Email (Login Username)"
                type="email"
                required
                placeholder="e.g. admin@company.com"
                value={adminUser.email}
                error={fieldErrors?.admin_email?.[0] || fieldErrors?.email?.[0]}
                onChange={(e) => {
                  setAdminUser({ ...adminUser, email: e.target.value });
                  if (fieldErrors?.admin_email || fieldErrors?.email) {
                    setFieldErrors((prev) => {
                      if (!prev) return null;
                      const next = { ...prev };
                      delete next.admin_email;
                      delete next.email;
                      return Object.keys(next).length ? next : null;
                    });
                  }
                }}
              />

              <PhoneNumberInput
                label="Direct Phone / Mobile"
                value={adminUser.phone}
                onChange={(phone) => setAdminUser({ ...adminUser, phone })}
              />

              <div className="md:col-span-2">
                <Input
                  label="Temporary Password"
                  type="text"
                  value={adminUser.tempPassword}
                  onChange={(e) => setAdminUser({ ...adminUser, tempPassword: e.target.value })}
                  helperText="The administrator will be prompted to update this password upon initial authentication."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Review */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Step 7: Review & Validation</h3>
              <p className="text-xs text-slate-400">Confirm all parameters before provisioning the dedicated tenant workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg border border-slate-800 bg-[#0f172a]/70 p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">Tenant Organization</p>
                <div className="flex justify-between"><span className="text-slate-400">Company:</span> <span className="text-white font-medium">{companyInfo.name || 'Organization Workspace'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Subdomain:</span> <span className="text-blue-400 font-mono">{companyInfo.slug || 'workspace'}.omnicore.io</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Location:</span> <span className="text-slate-200">{companyInfo.city || ''}, {companyInfo.country}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Contact:</span> <span className="text-slate-200">{companyInfo.primaryContactName || `${adminUser.firstName} ${adminUser.lastName}`.trim()}</span></div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#0f172a]/70 p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">Plan & Entitlements</p>
                <div className="flex justify-between"><span className="text-slate-400">Package:</span> <span className="text-blue-400 font-bold uppercase">{selectedPackage}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Selected Verticals:</span> <span className="text-slate-200">{selectedVerticals.length} enabled</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Active Add-ons:</span> <span className="text-cyan-400 font-medium">{selectedAddons.length} enabled</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Monthly MRR:</span> <span className="text-emerald-400 font-bold">{formatCurrency(totalMonthlyMrr)}</span></div>
              </div>

              <div className="md:col-span-2 rounded-lg border border-slate-800 bg-[#0f172a]/70 p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">Root Administrator</p>
                <div className="flex justify-between"><span className="text-slate-400">Administrator:</span> <span className="text-white font-medium">{`${adminUser.firstName} ${adminUser.lastName}`.trim() || 'Admin'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Login Email:</span> <span className="text-blue-400 font-mono">{adminUser.email || companyInfo.primaryContactEmail}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Provision Tenant Execution */}
        {currentStep === 8 && (
          <div className="py-8 text-center space-y-6">
            {provisionError ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl">
                    <AlertTriangle className="h-9 w-9" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white">Tenant Provisioning Failed</h3>
                <p className="text-xs text-red-300 bg-red-950/40 border border-red-800/40 p-3 rounded-lg">
                  {provisionError}
                </p>

                {fieldErrors && (
                  <div className="text-left bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <p className="font-bold text-slate-200">Validation Errors:</p>
                    {Object.entries(fieldErrors).map(([field, msgs]) => (
                      <div key={field} className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-[11px]">
                        <span className="font-mono font-bold text-red-400 capitalize">{field.replace('_', ' ')}:</span>
                        <span className="text-slate-300">{Array.isArray(msgs) ? msgs.join(' ') : String(msgs)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProvisionError(null);
                      setCurrentStep(1);
                    }}
                  >
                    Edit Company & Slug Info
                  </Button>
                  {fieldErrors?.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/40 text-blue-400 hover:bg-blue-950/30"
                      onClick={() => {
                        const rand = Math.floor(100 + Math.random() * 900);
                        const base = companyInfo.slug.replace(/-\d+$/, '') || 'workspace';
                        const newSlug = `${base}-${rand}`;
                        setCompanyInfo({ ...companyInfo, slug: newSlug });
                        setFieldErrors((prev) => {
                          if (!prev) return null;
                          const next = { ...prev };
                          delete next.slug;
                          return Object.keys(next).length ? next : null;
                        });
                        setProvisionError(null);
                        setCurrentStep(1);
                      }}
                      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    >
                      Make Slug Unique & Edit
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startProvisioning}
                  >
                    Retry Provisioning
                  </Button>
                </div>
              </div>
            ) : !isProvisioned ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xl">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white">Provisioning OmniCore Tenant...</h3>
                <p className="text-xs text-slate-400">{provisionStageText}</p>

                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${provisionProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white">Tenant Activated Successfully!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>{companyInfo.name || 'Your organization'}</strong> is now live on the OmniCore ecosystem with {selectedVerticals.length} verticals, {selectedPackage.toUpperCase()} tier, and {selectedAddons.length} specialized add-ons.
                </p>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/platform/tenants')}
                  >
                    View All Tenants
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/app/dashboard')}
                  >
                    Launch Tenant Operations
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {stepValidationError && (
          <div className="mt-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{stepValidationError}</span>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        {currentStep < 8 && (
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 1 || isSubmitting}
              onClick={() => {
                setStepValidationError(null);
                setCurrentStep((s) => Math.max(1, s - 1));
              }}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous Step
            </Button>

            {currentStep < 7 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setStepValidationError(null);
                    setCurrentStep((s) => Math.min(7, s + 1));
                  }
                }}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Proceed to Step {currentStep + 1}
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={() => {
                  if (validateStep(1) && validateStep(6)) {
                    startProvisioning();
                  }
                }}
                rightIcon={<Sparkles className="h-4 w-4" />}
              >
                Deploy & Provision Tenant
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
