import React, { useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { publicPortalApi } from '../../api/publicPortal.api';
import { TenantPublicCms } from '../../types';
import {
  PackageCheck,
  Truck,
  Bus,
  Car,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Snowflake,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';

import { useSubmitPublicBookingMutation } from '../../hooks/queries';

export const PublicBooking: React.FC = () => {
  const { tenantSlug = 'workspace' } = useParams<{ tenantSlug: string }>();
  const [selectedService, setSelectedService] = useState('courier_express');
  const outletCtx = useOutletContext<{ cms?: TenantPublicCms | null }>();
  const cms = outletCtx?.cms || null;
  const submitBookingMutation = useSubmitPublicBookingMutation();
  const isSubmitting = submitBookingMutation.isPending;

  const [confirmation, setConfirmation] = useState<{
    bookingReference: string;
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    pickupTime: '',
    estimatedWeightKg: 5,
    cargoDescription: '',
    couponCode: '',
    coldChainMandate: '-20°C strictly mandated',
    passengerCount: 1,
    notes: '',
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.senderName.trim()) {
      setSubmitError('Please enter the Sender / Contact Name.');
      return;
    }
    if (!form.senderPhone.trim()) {
      setSubmitError('Please enter the Sender Contact Phone Number.');
      return;
    }
    if (!form.senderAddress.trim()) {
      setSubmitError('Please enter the complete Pickup Address.');
      return;
    }
    if (!form.receiverName.trim()) {
      setSubmitError('Please enter the Recipient Name.');
      return;
    }
    if (!form.receiverPhone.trim()) {
      setSubmitError('Please enter the Recipient Phone Number.');
      return;
    }
    if (!form.receiverAddress.trim()) {
      setSubmitError('Please enter the Destination / Delivery Address.');
      return;
    }

    try {
      const res = await submitBookingMutation.mutateAsync({
        tenantSlug,
        serviceType: selectedService,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        senderAddress: form.senderAddress,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverAddress: form.receiverAddress,
        pickupTime: form.pickupTime,
        estimatedWeightKg: form.estimatedWeightKg,
        notes: form.notes,
      });

      setConfirmation({
        bookingReference: res.bookingReference,
        message: res.message,
      });
    } catch (err: any) {
      console.error('Booking submission failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Booking submission failed. Please verify the details and try again.';
      setSubmitError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2">
        <Badge variant="success" size="sm" className="font-semibold">
          ONLINE DISPATCH BOOKING
        </Badge>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Book Transport & Logistics Services
        </h1>
        <p className="text-xs text-slate-400">
          Instant booking directly with <strong className="text-slate-200">{cms?.companyName || 'our logistics team'}</strong>.
        </p>
      </div>

      {confirmation ? (
        <div className="p-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-5 shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block font-bold">
              Booking Received & Confirmed
            </span>
            <h2 className="text-3xl font-black text-white font-mono mt-1">
              {confirmation.bookingReference}
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
              {confirmation.message} An SMS and email notification with live GPS tracking links has been dispatched to your contact phone.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to={`/public/${tenantSlug}/track?awb=${confirmation.bookingReference}`}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              Track Booking Status
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmation(null);
                setForm({
                  senderName: '',
                  senderPhone: '',
                  senderAddress: '',
                  receiverName: '',
                  receiverPhone: '',
                  receiverAddress: '',
                  pickupTime: '',
                  estimatedWeightKg: 5,
                  cargoDescription: '',
                  couponCode: '',
                  coldChainMandate: '-20°C strictly mandated',
                  passengerCount: 1,
                  notes: '',
                });
              }}
            >
              Book Another Consignment
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-6">
          {submitError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Vertical Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Select Vertical Service Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'courier_express', label: 'Express Parcel', icon: PackageCheck },
                { id: 'corporate_shuttle', label: 'Shuttle Pooling', icon: Bus },
                { id: 'freight_logistics', label: 'FTL / Heavy Freight', icon: Truck },
                { id: 'cold_chain', label: 'Cold Chain Reefer', icon: Snowflake },
              ].map((svc) => {
                const Icon = svc.icon;
                const isSelected = selectedService === svc.id;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setSelectedService(svc.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 text-white ring-2 ring-emerald-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold">{svc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Inputs based on Vertical */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Customer & Pickup Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name / Company"
                required
                placeholder="e.g. Acme Health Products"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              />
              <Input
                label="Contact Phone Number"
                required
                placeholder="+1 555-0199"
                value={form.senderPhone}
                onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
              />
            </div>
            <Input
              label="Pickup Address / Departure Location"
              required
              placeholder="Full street address, building dock or transit station"
              value={form.senderAddress}
              onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
            />
          </div>

          {/* Delivery / Destination Details */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. Destination & Consignee Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient / Consignee Name"
                required
                placeholder="e.g. Dr. Sarah Jenkins"
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              />
              <Input
                label="Recipient Phone"
                placeholder="+1 555-9082"
                value={form.receiverPhone}
                onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
              />
            </div>
            <Input
              label="Dropoff / Delivery Address"
              required
              placeholder="Delivery destination address"
              value={form.receiverAddress}
              onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })}
            />
          </div>

          {/* Vertical specifics */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Cargo & Service Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Estimated Weight (kg)"
                type="number"
                value={form.estimatedWeightKg}
                onChange={(e) => setForm({ ...form, estimatedWeightKg: Number(e.target.value) })}
              />
              <Input
                label="Preferred Pickup Time"
                type="datetime-local"
                value={form.pickupTime}
                onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
              />
              <Input
                label="Promotional Coupon Code"
                placeholder="e.g. PROMO20"
                value={form.couponCode}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
              />
            </div>
            {selectedService === 'cold_chain' && (
              <Input
                label="Mandated Temperature Range"
                value={form.coldChainMandate}
                onChange={(e) => setForm({ ...form, coldChainMandate: e.target.value })}
              />
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold text-sm px-8"
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Submit Booking & Generate AWB
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
