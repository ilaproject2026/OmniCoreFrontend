import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { ADDONS, VERTICALS } from '../../config/constants';
import {
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  ExternalLink,
  Cpu,
  ShieldCheck,
  Zap,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeaturesAndAddons: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => platformApi.getStats(),
  });

  const categories = ['All', 'Operations', 'Specialized', 'Intelligence', 'Connectivity'];

  const filteredAddons = ADDONS.filter((addon) => {
    const matchesCat = selectedCategory === 'All' || addon.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (addon.requiredForVerticals || []).some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Calculate adoption percentage map from platform stats
  const adoptionMap = React.useMemo(() => {
    const map: Record<string, { count: number; percentage: number }> = {};
    (stats?.addonAdoption || []).forEach((a) => {
      map[a.name] = { count: a.count, percentage: a.percentage };
    });
    return map;
  }, [stats?.addonAdoption]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Operations':
        return <Cpu className="h-4 w-4 text-blue-400" />;
      case 'Specialized':
        return <Zap className="h-4 w-4 text-amber-400" />;
      case 'Intelligence':
        return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case 'Connectivity':
        return <Radio className="h-4 w-4 text-cyan-400" />;
      default:
        return <Layers className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Features & Specialized Add-ons</h1>
            <Badge variant="info">Modular Architecture</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure domain add-ons, monthly price overlays, vertical auto-bundling rules, and tenant adoption meters.
          </p>
        </div>

        <Link to="/platform/tenants">
          <Button size="sm" variant="outline" leftIcon={<Sliders className="h-4 w-4" />}>
            Manage Tenant Custom Overrides
          </Button>
        </Link>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Add-on Modules"
          value={`${ADDONS.length} Modules`}
          subtitle="Available for tenant provisioning"
          icon={<Layers className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Most Adopted Add-on"
          value="GPS Telematics"
          subtitle="66% ecosystem adoption rate"
          icon={<Radio className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Add-on Revenue Share"
          value="24.8%"
          subtitle="Of total monthly recurring revenue"
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Modular Capability Sets"
          value="4 Domains"
          subtitle="Operations, Specialized, Intel, Sync"
          icon={<Sparkles className="h-5 w-5" />}
          accentColor="purple"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search add-on, vertical, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Add-on Cards Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAddons.map((addon) => {
            const adoption = adoptionMap[addon.name] || { count: 0, percentage: 0 };

            return (
              <Card key={addon.key} className="flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                        {getCategoryIcon(addon.category)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{addon.name}</h4>
                        <Badge variant="outline" size="sm" className="mt-0.5 text-[10px]">
                          {addon.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-400 text-base">
                        +${addon.monthlyPrice}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/month /tenant</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                    {addon.description}
                  </p>

                  {/* Auto-bundling rule */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
                      Auto-Bundled For Verticals:
                    </span>
                    {addon.requiredForVerticals && addon.requiredForVerticals.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {addon.requiredForVerticals.map((v) => (
                          <span
                            key={v}
                            className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            {v.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        Standalone a-la-carte add-on (Opt-in by any tenant)
                      </span>
                    )}
                  </div>
                </div>

                {/* Adoption Meter & Footer */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ecosystem Adoption:</span>
                    <span className="font-semibold text-cyan-400 font-mono">
                      {adoption.percentage}% ({adoption.count} tenants)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.max(5, adoption.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-500">{addon.key}</span>
                    <Link
                      to="/platform/tenants"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      Provision <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Vertical Entitlement Auto-Bundling Matrix */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Vertical Specialization & Add-on Entitlement Rules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            When a tenant registers for a specific vertical, OmniCore automatically provisions and bundles the corresponding specialized domain capabilities.
          </p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold text-slate-300">Industry Vertical</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-300">Description</th>
                  <th className="py-3.5 px-4 font-semibold text-cyan-400">Auto-Bundled Add-ons</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-400">Specialized UI Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.values(VERTICALS).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.badgeColor || '#3b82f6' }} />
                      {v.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs">{v.description}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ADDONS.filter((a) => (a.requiredForVerticals || []).includes(v.id)).map((a) => (
                          <span
                            key={a.key}
                            className="bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            {a.name}
                          </span>
                        ))}
                        {ADDONS.filter((a) => (a.requiredForVerticals || []).includes(v.id)).length === 0 && (
                          <span className="text-slate-500 italic text-[11px]">Core baseline only</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="glow" size="sm">
                        {v.features[0] || 'Domain Custom'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
