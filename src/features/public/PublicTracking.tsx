import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { publicPortalApi } from '../../api/publicPortal.api';
import { CourierShipment } from '../../types';
import {
  PackageCheck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  ShieldCheck,
  AlertCircle,
  FileSignature,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import { usePublicTrackShipment } from '../../hooks/queries';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';

export const PublicTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenantSlug = 'workspace' } = useParams<{ tenantSlug: string }>();
  const initialAwb = searchParams.get('awb') || '';

  const [query, setQuery] = useState(initialAwb);
  const [activeAwb, setActiveAwb] = useState(initialAwb);

  const {
    data: shipment,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = usePublicTrackShipment(activeAwb);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    setSearchParams({ awb: clean });
    setActiveAwb(clean);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Search bar */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-white tracking-tight">Real-Time Consignment & AWB Tracker</h1>
        <p className="text-xs text-slate-400">
          Enter your authoritative AWB tracking number to verify real-time GPS hub scans and digital delivery receipts.
        </p>

        <form onSubmit={handleSubmit} className="pt-3 max-w-lg mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. AWB-EXP-88910 or TRK-88910-US"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>
          <Button variant="primary" type="submit" isLoading={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs py-2.5">
            Track
          </Button>
        </form>
      </div>

      {/* Shipment Results */}
      {shipment ? (
        <div className="space-y-6">
          {/* Main Status Header */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Authoritative Consignment Number
              </span>
              <h2 className="text-2xl font-black text-white font-mono mt-0.5">{shipment.awbNumber}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>Service: <strong className="text-slate-200 capitalize">{shipment.serviceType.replace(/_/g, ' ')}</strong></span>
                <span>•</span>
                <span>Due by: <strong className="text-emerald-400 font-mono">{shipment.expectedDeliveryDate}</strong></span>
              </div>
            </div>

            <div>
              <Badge variant={shipment.currentStatus === 'delivered' ? 'success' : 'info'} size="lg">
                {shipment.currentStatus.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Route Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Origin / Shipper
              </span>
              <div className="font-bold text-slate-200 text-sm">{shipment.sender.name}</div>
              <div className="text-slate-400 mt-0.5">{shipment.sender.address}, {shipment.sender.city}</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Destination / Consignee
              </span>
              <div className="font-bold text-slate-200 text-sm">{shipment.receiver.name}</div>
              <div className="text-slate-400 mt-0.5">{shipment.receiver.address}, {shipment.receiver.city}</div>
            </div>
          </div>

          {/* Proof of Delivery Banner (if delivered) */}
          {shipment.pod && shipment.pod.status === 'pod_verified' && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Proof of Delivery Verified (e-PoD)</h4>
                  <p className="text-slate-300 mt-0.5">
                    Received by <strong className="text-white">{shipment.pod.recipientName}</strong> at {shipment.pod.deliveryTimestamp}.
                  </p>
                </div>
              </div>

              {shipment.pod.signatureDataUrl && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center shrink-0">
                  <span className="text-[10px] text-slate-400 block mb-1">Recipient Signature</span>
                  <img src={shipment.pod.signatureDataUrl} alt="Signature" className="h-8 w-auto mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* Chronological Event History */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Consignment Journey & Hub Handshakes
            </h3>

            <div className="relative pl-6 space-y-6 border-l border-slate-800">
              {shipment.timeline.map((event, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-[#0f172a]" />
                  <div className="text-xs font-mono text-emerald-400 font-semibold">{event.timestamp}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{event.description}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">AWB Not Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No consignment matching "<strong className="text-slate-200">{query}</strong>" was found in our live telemetry dispatch database.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery('AWB-EXP-88910');
                setActiveAwb('AWB-EXP-88910');
                setSearchParams({ awb: 'AWB-EXP-88910' });
              }}
            >
              Try Sample AWB-EXP-88910
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
