import React, { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { publicPortalApi } from '../../api/publicPortal.api';
import { TenantPublicCms } from '../../types';
import {
  PackageCheck,
  Search,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const PublicPortalLayout: React.FC = () => {
  const { tenantSlug = 'workspace' } = useParams<{ tenantSlug: string }>();
  const [cms, setCms] = useState<TenantPublicCms | null>(null);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCms = async () => {
      try {
        setCmsError(null);
        const data = await publicPortalApi.getTenantCms(tenantSlug);
        setCms(data);
      } catch (error) {
        setCms(null);
        setCmsError(error instanceof Error ? error.message : 'This public site could not be loaded.');
      }
    };
    fetchCms();
  }, [tenantSlug]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    navigate(`/public/${tenantSlug}/track?awb=${encodeURIComponent(trackingInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              Live Logistics Network Operating 24/7 across all metropolitan & regional corridors.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            {cms?.contactPhone && (
              <a href={`tel:${cms.contactPhone}`} className="hover:text-white flex items-center gap-1">
                <Phone className="h-3 w-3" /> {cms.contactPhone}
              </a>
            )}
            {cms?.contactEmail && (
              <a href={`mailto:${cms.contactEmail}`} className="hover:text-white flex items-center gap-1">
                <Mail className="h-3 w-3" /> {cms.contactEmail}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to={`/public/${tenantSlug}`} className="flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20">
              {cms?.companyName.slice(0, 2).toUpperCase() || 'OC'}
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                {cms?.companyName || 'Logistics Workspace'}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Customer Services & Booking
              </span>
            </div>
          </Link>

          {/* Quick Tracking Search in Header */}
          <form onSubmit={handleTrackSubmit} className="hidden md:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Track AWB (e.g. AWB-EXP-88910)..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full pl-9 pr-20 py-2 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors"
              >
                Track
              </button>
            </div>
          </form>

          {/* Nav Links */}
          <nav className="flex items-center gap-3">
            <Link
              to={`/public/${tenantSlug}`}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Services
            </Link>
            <Link
              to={`/public/${tenantSlug}/track`}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Track AWB
            </Link>
            <Link
              to={`/public/${tenantSlug}/book`}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              Book Service Online
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {cmsError && <div role="alert" className="mx-auto mt-4 max-w-4xl px-4 text-center text-xs text-amber-300">{cmsError}</div>}
        <Outlet context={{ cms }} />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0f17] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Powered by OmniCore Logistics & Fleet Multi-Tenant Cloud Ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/app/dashboard" className="text-slate-400 hover:text-white flex items-center gap-1">
              Tenant Staff Portal <ExternalLink className="h-3 w-3" />
            </Link>
            <span>© 2026 {cms?.companyName || 'OmniCore'}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
