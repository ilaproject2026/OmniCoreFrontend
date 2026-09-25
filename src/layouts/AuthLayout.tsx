import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, Globe } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-[#0b0f17] text-slate-100">
      {/* Left Branding Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#101726] via-[#0f172a] to-[#090d15] border-r border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/auth/register" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-lg shadow-lg shadow-blue-500/20">
              OC
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Omni<span className="text-blue-400">Core</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Logistics & Fleet Ecosystem
              </span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            <Zap className="h-3.5 w-3.5" />
            <span>Next-Generation Multi-Tenant Fleet OS</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Precision control across 9 transport verticals.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            From cold-chain reefer compliance and intercity bus routes to e-commerce last-mile dispatch and heavy machinery rigging.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Multi-Modal Fleets</p>
                <p className="text-[11px] text-slate-500">Live telematics & temperature telemetry</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">DRF REST Ready</p>
                <p className="text-[11px] text-slate-500">Decoupled JWT auth & RBAC permissions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} OmniCore Technologies Inc.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Security Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Platform SLA</span>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Container */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-4 sm:p-8 lg:p-10 relative overflow-y-auto">
        <div className="w-full max-w-2xl py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
