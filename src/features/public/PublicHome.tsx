import React, { useState } from 'react';
import { useOutletContext, useParams, Link, useNavigate } from 'react-router-dom';
import { TenantPublicCms } from '../../types';
import {
  PackageCheck,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  Snowflake,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const PublicHome: React.FC = () => {
  const { cms } = useOutletContext<{ cms: TenantPublicCms | null }>();
  const { tenantSlug = 'workspace' } = useParams<{ tenantSlug: string }>();
  const [awbInput, setAwbInput] = useState('');
  const navigate = useNavigate();

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awbInput.trim()) return;
    navigate(`/public/${tenantSlug}/track?awb=${encodeURIComponent(awbInput.trim())}`);
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Snowflake':
        return <Snowflake className="h-6 w-6 text-cyan-400" />;
      case 'Truck':
        return <Truck className="h-6 w-6 text-emerald-400" />;
      case 'Users':
      case 'Briefcase':
        return <Users className="h-6 w-6 text-indigo-400" />;
      case 'PackageCheck':
      case 'Zap':
      default:
        return <PackageCheck className="h-6 w-6 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-[#0f172a] via-[#0b0f19] to-[#0a0e17]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="success" size="sm" className="font-semibold px-3 py-1">
            2026 FLEET & LOGISTICS EXCELLENCE
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {cms?.heroHeadline || 'Mission-Critical Logistics & Precision Transport'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {cms?.heroSubtitle ||
              'Reliable freight haulage, express courier dispatch, and passenger fleet mobility across North America.'}
          </p>

          {/* Big AWB Tracking Search Form */}
          <div className="pt-4 max-w-xl mx-auto">
            <form onSubmit={handleTrackSubmit} className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden p-1.5 bg-slate-900 border border-slate-700">
              <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Enter Authoritative AWB (e.g. AWB-EXP-88910)..."
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all shrink-0"
              >
                Track Live
              </button>
            </form>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={`/public/${tenantSlug}/book`}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              Book Service Online <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Our Operational Capabilities</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tailored logistics verticals equipped with real-time telematics and strict SLA compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cms?.enabledServices.map((svc) => (
            <div
              key={svc.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                  {getServiceIcon(svc.icon)}
                </div>
                <h3 className="font-bold text-base text-white">{svc.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{svc.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <Link
                  to={`/public/${tenantSlug}/book?service=${encodeURIComponent(svc.vertical || '')}`}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Book this vertical <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Special Digital Promotions Banner */}
      {cms?.promotions && cms.promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Tag className="h-4 w-4" /> Exclusive Digital Promotion
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                {cms.promotions[0].discountText}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Use coupon code <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">{cms.promotions[0].code}</span> at booking checkout. {cms.promotions[0].validity}.
              </p>
            </div>
            <Link
              to={`/public/${tenantSlug}/book`}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0"
            >
              Claim Offer & Book
            </Link>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {cms?.faqs && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5 text-cyan-400" /> Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Common inquiries regarding tracking, deliveries, and enterprise booking.
            </p>
          </div>

          <div className="space-y-4">
            {cms.faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
                <h4 className="font-bold text-sm text-slate-200">{faq.question}</h4>
                <p className="text-slate-400 mt-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
