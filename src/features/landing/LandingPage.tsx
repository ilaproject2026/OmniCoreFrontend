import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PACKAGES, VERTICALS } from '../../config/constants';
import { PackageTier, TenantRole } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Crown,
  Building2,
  Briefcase,
  Truck,
  DollarSign,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Globe,
  Radio,
  FileText,
  Boxes,
  Lock,
  Compass,
  Cpu,
  TrendingUp,
  Activity,
  CheckCircle2,
  Navigation,
  HelpCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [activePreviewTab, setActivePreviewTab] = useState<'super_admin' | 'tenant_admin' | 'manager'>('super_admin');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleQuickRoleAccess = (role: TenantRole | 'super_admin', targetRoute: string) => {
    switchRole(role);
    navigate(targetRoute);
  };

  const FAQS = [
    {
      q: 'Who is the first user in OmniCore and what can they do?',
      a: 'The first user in OmniCore is the Platform Super Admin (Super User). The Super Admin possesses supreme power across the entire platform. They can provision and manage all isolated tenants, monitor global subscriptions, and customize granular permissions for every tenant role.',
    },
    {
      q: 'How does multi-tenant data isolation work?',
      a: 'Every tenant in OmniCore is logically isolated at the schema and session boundary. Tenant users can only view and manipulate assets, drivers, trips, and financials belonging strictly to their tenant workspace, guaranteed by DRF middleware and JWT tenant scoping.',
    },
    {
      q: 'What can the Operations Manager role access?',
      a: 'By default, the Operations Manager role handles financial details (invoicing, billing ledgers), HR & personnel, insurance claims, marketing campaigns, and reports analytics. They are restricted from direct vehicle fleet, driver maintenance, and trip dispatch, ensuring strict separation of financial management and field operations.',
    },
    {
      q: 'Can the Super Admin customize permissions for individual roles?',
      a: 'Yes! Through the Role Permissions Matrix (/platform/roles), the Platform Super Admin can toggle individual capabilities on or off for any role (Operations Manager, Fleet Manager, Finance, HR, Driver) or inject custom permission strings in real time.',
    },
    {
      q: 'What industry verticals are supported out of the box?',
      a: 'OmniCore supports over 12 specialized transport verticals including Freight Logistics (FTL/LTL), Cold Chain Telemetry, Courier & Express Delivery, Corporate Commuter Shuttle, Heavy Machinery, B2B Contracts, and Packers & Movers.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="h-full w-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-black tracking-tight text-white text-lg">
                  Omni<span className="text-blue-500">Core</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold uppercase">
                  SaaS Core v2.5
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#roles-architecture" className="hover:text-white transition-colors">
              Role Hierarchy
            </a>
            <a href="#verticals" className="hover:text-white transition-colors">
              Verticals
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Plans & Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </Button>
            </Link>
            <button
              onClick={() => handleQuickRoleAccess('super_admin', '/platform/dashboard')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span>Super Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/60">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Next-Generation Multi-Tenant Fleet & Logistics Cloud</span>
          </div> */}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            The Unified SaaS Operating System for Modern Logistics Fleets
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Multi-tenant fleet management, automated dispatch, live IoT telematics, cold chain monitoring, and financial billing. Scaled for enterprise logistics with a fine-grained RBAC matrix controlled by your Super Admin.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register First Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => handleQuickRoleAccess('super_admin', '/platform/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 transition-all cursor-pointer"
            >
              <Crown className="h-4 w-4 text-amber-300" />
              <span>Explore as Super Admin</span>
            </button>

            <a
              href="#pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-all"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Browse Plans</span>
            </a>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">99.99%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">SLA Uptime Guarantee</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">&lt;120ms</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">IoT GPS Telemetry Latency</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">12+</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Transport Verticals</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">100%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Isolated Tenant Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT PREVIEW SHOWCASE */}
      <section className="py-16 bg-[#090e1a] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              One Cloud Engine, Tailored Role Experiences
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Preview how OmniCore instantly adapts its workspace and permissions according to the authenticated user.
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 mt-6">
              <button
                onClick={() => setActivePreviewTab('super_admin')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activePreviewTab === 'super_admin'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span>Super Admin (Supreme)</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('tenant_admin')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activePreviewTab === 'tenant_admin'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Building2 className="h-3.5 w-3.5 text-blue-300" />
                <span>Tenant Admin (All Fleet)</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('manager')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activePreviewTab === 'manager'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
                <span>Operations Manager (Finance & HR)</span>
              </button>
            </div>
          </div>

          {/* Interactive Mock Window */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1322] shadow-2xl overflow-hidden max-w-5xl mx-auto">
            <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-[11px] ml-2 text-slate-400">
                  {activePreviewTab === 'super_admin'
                    ? 'https://omnicore.io/platform/dashboard'
                    : activePreviewTab === 'tenant_admin'
                    ? 'https://apex-global.omnicore.io/app/dashboard'
                    : 'https://apex-global.omnicore.io/app/finance'}
                </span>
              </div>
              <Badge variant="purple" size="xs">
                {activePreviewTab === 'super_admin'
                  ? '👑 Platform Super Admin Mode'
                  : activePreviewTab === 'tenant_admin'
                  ? '🏢 Tenant Admin Authority'
                  : '💼 Operations Manager RBAC'}
              </Badge>
            </div>

            <div className="p-6">
              {activePreviewTab === 'super_admin' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-white font-bold text-sm">Platform Global Orchestration Ledger</h4>
                      <p className="text-[11px] text-slate-400">Super Admin can control everything, provision tenants, and customize role permissions.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickRoleAccess('super_admin', '/platform/roles')}
                      leftIcon={<Crown className="h-3.5 w-3.5 text-amber-300" />}
                      className="text-xs"
                    >
                      Open Role Permissions Matrix
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/20">
                      <span className="text-slate-400 text-[10px] block">Total Provisioned Tenants</span>
                      <span className="text-xl font-bold text-white font-mono">14 Enterprises</span>
                    </div>
                    <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
                      <span className="text-slate-400 text-[10px] block">Monthly Recurring Revenue (MRR)</span>
                      <span className="text-xl font-bold text-emerald-400 font-mono">$48,920/mo</span>
                    </div>
                    <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
                      <span className="text-slate-400 text-[10px] block">Role Permissions Customizer</span>
                      <span className="text-xs font-bold text-cyan-300 block mt-1">Full Authority Over Roles</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'tenant_admin' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-white font-bold text-sm">Apex Global Logistics Workspace</h4>
                      <p className="text-[11px] text-slate-400">Tenant Admin manages fleet, drivers, dispatch, workshop, and all tenant functions.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickRoleAccess('tenant_admin', '/app/fleet')}
                      leftIcon={<Truck className="h-3.5 w-3.5" />}
                      className="text-xs"
                    >
                      Launch Fleet Management
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Active Fleet Vehicles</span>
                      <span className="text-xl font-bold text-white font-mono">68 Units Live</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Active Waybills & Trips</span>
                      <span className="text-xl font-bold text-cyan-400 font-mono">12 En Route</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Subordinated To</span>
                      <span className="text-xs font-bold text-purple-300 block mt-1">Platform Super Admin</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'manager' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-white font-bold text-sm">Operations Manager Scope</h4>
                      <p className="text-[11px] text-slate-400">Dedicated to Financial details, HR, Insurance claims, Marketing, and Reports analysis.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleQuickRoleAccess('operations_manager', '/app/finance')}
                      leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500"
                    >
                      View Financial Operations
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20">
                      <span className="text-slate-400 text-[10px] block">Authorized Modules</span>
                      <span className="text-xs font-bold text-emerald-300 block mt-1">Finance, HR, Insurance, Marketing, Reports</span>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20">
                      <span className="text-slate-400 text-[10px] block">Restricted Modules</span>
                      <span className="text-xs font-bold text-amber-300 block mt-1">Fleet, Drivers, Trips (Protected)</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Permissions Set By</span>
                      <span className="text-xs font-bold text-purple-300 block mt-1">Super Admin Customizer</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT OMNICORE CAN DO (CORE CAPABILITIES) */}
      <section id="capabilities" className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
              Enterprise Feature Matrix
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Everything Your Fleet & Logistics Business Needs
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              Comprehensive modules engineered for speed, accuracy, and operational efficiency across multi-modal transport.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Fleet & Telematics */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Fleet Inventory & IoT Telematics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live GPS vehicle tracking with speed telemetry, fuel burn rates, OBD-II diagnostic fault codes, and cold chain temperature alerts.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Live GPS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">OBD-II Sensors</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Temp Breaches</span>
              </div>
            </Card>

            {/* Card 2: Smart Dispatch & Trips */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Navigation className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Dispatch, Trips & Route Optimization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated driver allocation, turn-by-turn routing, waybill management, Courier AWB tracking, and corporate commuter shuttle scheduling.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Smart Routing</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Courier AWBs</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Shuttle Rosters</span>
              </div>
            </Card>

            {/* Card 3: Financials & Contracts */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Financials, Billing & B2B Tenders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated commercial freight invoicing, accounts receivable ledgers, B2B tender contract SLAs, insurance claims, and payroll disbursements.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Invoicing</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Claims</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">B2B Contracts</span>
              </div>
            </Card>

            {/* Card 4: Workforce & HR */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Personnel HR & Driver Directory</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                CDL license compliance, medical certification tracking, shift rosters, hours-of-service compliance, and driver safety performance scoring.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">CDL Tracking</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Driver Scoring</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Shift Rosters</span>
              </div>
            </Card>

            {/* Card 5: Workshop & Spare Parts */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Boxes className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Workshop Maintenance & Spare Parts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Preventative servicing work orders, mechanic assignees, warehouse parts inventory, cross-docking logistics, and warranty claim tracking.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Work Orders</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Parts Inventory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Preventative</span>
              </div>
            </Card>

            {/* Card 6: Super Admin Custom RBAC */}
            <Card className="p-6 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Crown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base">Super Admin Power & Custom RBAC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Platform Super Admin controls the system, provisions new organizations, and customizes fine-grained operational permissions for any role.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Super User Authority</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Custom Permissions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">Tenant Isolation</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. ROLE HIERARCHY & SUPER ADMIN ARCHITECTURE */}
      <section id="roles-architecture" className="py-20 bg-[#070b14] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
              Hierarchical Access Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              The First User is the Super User — Commanding Complete Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              OmniCore establishes a strict, transparent authority hierarchy where the Platform Super Admin customizes permissions and controls everything.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Level 1: Super Admin */}
            <div className="p-6 rounded-2xl border border-purple-500/40 bg-purple-950/20 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase font-mono">
                    <Crown className="h-4 w-4 text-amber-400" /> Tier 1: Platform Super Admin
                  </span>
                  <Badge variant="purple" size="xs">Supreme Power (*)</Badge>
                </div>
                <h3 className="text-white font-bold text-base mt-3">The Supreme System Operator</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  The primary user who initializes the OmniCore ecosystem. Controls all tenants, manages global subscriptions, and has the exclusive capability to <strong>set customized permissions for any tenant role</strong>.
                </p>
                <div className="space-y-1.5 pt-4 text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Controls everything across the entire platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Can customize role permissions for any user</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Provisions and suspends isolated SaaS tenants</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/20 space-y-2">
                <Link
                  to="/auth/register?role=super_admin"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-purple-600/30"
                >
                  <UserPlus className="h-3.5 w-3.5 text-amber-300" />
                  <span>Register as Super Admin</span>
                </Link>
                <button
                  onClick={() => handleQuickRoleAccess('super_admin', '/platform/dashboard')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 transition-colors cursor-pointer"
                >
                  <Crown className="h-3 w-3 text-amber-300" />
                  <span>Quick Demo Portal</span>
                </button>
              </div>
            </div>

            {/* Level 2: Tenant Admin */}
            <div className="p-6 rounded-2xl border border-blue-500/40 bg-blue-950/20 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase font-mono">
                    <Building2 className="h-4 w-4 text-blue-400" /> Tier 2: Tenant Administrator
                  </span>
                  <Badge variant="info" size="xs">Tenant Authority (*)</Badge>
                </div>
                <h3 className="text-white font-bold text-base mt-3">Tenant Operational Command</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Operates strictly under the Super Admin within an isolated tenant. Manages all tenant functions: fleet vehicles, driver directory, dispatch, warehouse inventory, and business settings.
                </p>
                <div className="space-y-1.5 pt-4 text-xs text-blue-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Full control over fleet, drivers & dispatch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Manages tenant settings & personnel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Subordinated strictly under the Super User</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-500/20 space-y-2">
                <Link
                  to="/auth/register?role=tenant_admin"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
                >
                  <UserPlus className="h-3.5 w-3.5 text-blue-200" />
                  <span>Register Tenant Org</span>
                </Link>
                <button
                  onClick={() => handleQuickRoleAccess('tenant_admin', '/app/dashboard')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 transition-colors cursor-pointer"
                >
                  <Building2 className="h-3 w-3 text-blue-300" />
                  <span>Quick Demo Portal</span>
                </button>
              </div>
            </div>

            {/* Level 3: Manager Role */}
            <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase font-mono">
                    <Briefcase className="h-4 w-4 text-emerald-400" /> Tier 3: Operations Manager
                  </span>
                  <Badge variant="success" size="xs">Finance & HR Scoped</Badge>
                </div>
                <h3 className="text-white font-bold text-base mt-3">Business & Financial Custodian</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Handles financial details, HR personnel, insurance claims, marketing campaigns, and reports analytics. Strictly excluded from fleet, drivers, and trips for secure segregation of duties.
                </p>
                <div className="space-y-1.5 pt-4 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Manages Finance & Freight Invoicing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Handles HR Directory, Payroll & Claims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>No access to Fleet / Trips (Protected)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-500/20">
                <button
                  onClick={() => handleQuickRoleAccess('operations_manager', '/app/finance')}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5 text-white" />
                  <span>Launch as Operations Mgr</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BROWSE PLANS & PRICING */}
      <section id="pricing" className="py-20 bg-[#090e1a] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Transparent Subscription Tiers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Scale Your Fleet with Predictable Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              Browse plans designed for fleet sizes ranging from 25 vehicles to cross-country multi-modal conglomerates.
            </p>

            {/* Billing Cycle Switch */}
            <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  billingCycle === 'annually' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <span>Annual Pre-paid</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['basic', 'standard', 'corporate', 'enterprise'] as PackageTier[]).map((tierKey) => {
              const pkg = PACKAGES[tierKey];
              const price = billingCycle === 'monthly' ? pkg.monthlyPrice : Math.round(pkg.annualPrice / 12);
              const isPopular = tierKey === 'corporate';

              return (
                <Card
                  key={tierKey}
                  className={cn(
                    'p-6 flex flex-col justify-between transition-all relative',
                    isPopular
                      ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/40 shadow-2xl shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="glow" size="sm" className="shadow-lg">
                        Most Popular Tier
                      </Badge>
                    </div>
                  )}

                  <div>
                    <div className="pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 block">
                        {pkg.name}
                      </span>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">{formatCurrency(price)}</span>
                        <span className="text-xs text-slate-400 font-medium">/month</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{pkg.tagline}</p>
                    </div>

                    <div className="py-4 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                        <span>Capacity:</span>
                        <span className="text-white font-bold font-mono">{pkg.maxVehicles} Vehicles • {pkg.maxUsers} Seats</span>
                      </div>

                      {pkg.coreFeatures.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-[11px]">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <Link to={`/auth/register?tier=${tierKey}&role=tenant_admin`}>
                      <Button
                        variant={isPopular ? 'primary' : 'outline'}
                        size="sm"
                        className="w-full text-xs font-bold"
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Register Plan
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2',
                        isOpen && 'rotate-90 text-blue-400'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/60 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOOTER CALL TO ACTION & FOOTER */}
      <footer className="py-12 bg-[#05080f] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-sm text-white">OmniCore Cloud Platform</span>
              <span className="text-[10px] text-slate-500">• Multi-Tenant SaaS Operating System</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                All Cloud Services Operational
              </span>
              <Link to="/auth/login">
                <Button size="sm" variant="ghost" className="text-xs text-slate-300 hover:text-white">
                  Login Portal
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                  Register Account
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 OmniCore Logistics Cloud, Inc. All rights reserved. Strict Multi-Tenant Isolation Enforced.</p>
            <div className="flex items-center gap-4">
              <a href="#capabilities" className="hover:text-slate-400">Capabilities</a>
              <a href="#roles-architecture" className="hover:text-slate-400">RBAC Hierarchy</a>
              <a href="#pricing" className="hover:text-slate-400">Subscription Plans</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
