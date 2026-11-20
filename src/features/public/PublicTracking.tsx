import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, MapPin, AlertCircle, PackageCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { usePublicTrackShipment } from '../../hooks/queries';

export const PublicTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAwb = searchParams.get('awb') || '';
  const [query, setQuery] = useState(initialAwb);
  const [activeAwb, setActiveAwb] = useState(initialAwb);
  const { data: shipment, isLoading, isError, error } = usePublicTrackShipment(activeAwb);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setSearchParams({ awb: clean });
    setActiveAwb(clean);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-white tracking-tight">Shipment Tracking</h1>
        <p className="text-xs text-slate-400">Enter the AWB reference provided when the shipment was booked.</p>
        <form onSubmit={handleSubmit} className="pt-3 max-w-lg mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input type="text" required aria-label="AWB tracking number" placeholder="e.g. OCT-AWB-AB12CD34"
              value={query} onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden font-mono" />
          </div>
          <Button variant="primary" type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs py-2.5">
            Track
          </Button>
        </form>
      </div>

      {isError && activeAwb && (
        <div role="alert" className="text-center py-8 p-6 rounded-2xl border border-amber-500/30 bg-slate-900/40">
          <AlertCircle className="h-9 w-9 text-amber-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white">Tracking information unavailable</h2>
          <p className="text-xs text-slate-400 mt-1">
            {(error as Error)?.message || `No shipment was found for ${activeAwb}.`}
          </p>
        </div>
      )}

      {shipment && (
        <div className="space-y-5">
          <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AWB reference</span>
              <h2 className="text-2xl font-black text-white font-mono mt-0.5">{shipment.awbNumber}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Service: <strong className="text-slate-200 capitalize">{shipment.serviceType.replace(/_/g, ' ').toLowerCase()}</strong>
                {shipment.expectedDelivery && <> · Expected delivery: <strong className="text-emerald-400">{new Date(shipment.expectedDelivery).toLocaleDateString()}</strong></>}
              </p>
            </div>
            <Badge variant={shipment.status === 'delivered' ? 'success' : 'info'} size="lg">
              {shipment.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Origin city</span>
              <p className="text-sm text-slate-200 mt-1">{shipment.senderCity || 'Not available'}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Destination city</span>
              <p className="text-sm text-slate-200 mt-1">{shipment.deliveryCity || 'Not available'}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Recipient</span>
              <p className="text-sm text-slate-200 mt-1">{shipment.maskedReceiver || 'Hidden for privacy'}</p>
            </div>
          </section>

          <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Tracking history
            </h3>
            {shipment.events.length ? (
              <div className="relative pl-6 space-y-5 border-l border-slate-800">
                {shipment.events.map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="relative">
                    <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-[#0f172a]" />
                    <div className="text-xs font-mono text-emerald-400 font-semibold">{new Date(event.timestamp).toLocaleString()}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{event.description || event.status.replace(/_/g, ' ')}</div>
                    {event.location && <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 flex items-center gap-2"><PackageCheck className="h-4 w-4" />No tracking events have been recorded yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
