import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips.api';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Booking, Vehicle, Driver, VehicleType } from '../../types';
import {
  Navigation,
  Truck,
  Users,
  CheckCircle2,
  ArrowRight,
  Radio,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const formatVehicleType = (type?: string) => {
  switch (type) {
    case 'sedan':
      return 'Sedan / Cab';
    case 'suv':
      return 'SUV / Passenger Shuttle';
    case 'bus':
      return 'Bus / Coach';
    case 'mini_truck':
      return 'Mini Truck';
    case 'heavy_truck':
      return 'Heavy Truck (Linehaul)';
    case 'reefer_cold':
      return 'Reefer (Cold-Chain)';
    case 'flatbed':
      return 'Flatbed Trailer';
    case 'container':
      return 'Container Carrier';
    default:
      return type ? type.replace('_', ' ') : 'Commercial Vehicle';
  }
};

export const DispatchBoard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => tripsApi.getBookings(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['fleetVehicles', 'available'],
    queryFn: () => fleetApi.getVehicles({ status: 'available' }),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const pendingBookings = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const activeBooking = bookings.find((b) => b.id === selectedBookingId);

  // Determine required vehicle type for active booking
  const requiredType: VehicleType = activeBooking?.vehicleType || (
    activeBooking?.vertical === 'cold_chain'
      ? 'reefer_cold'
      : activeBooking?.vertical === 'corporate_shuttle'
      ? 'sedan'
      : 'heavy_truck'
  );

  // Matching available vehicles
  const matchingVehicles = vehicles.filter((v) => v.type === requiredType);
  const otherVehicles = vehicles.filter((v) => v.type !== requiredType);

  // Auto-select first matching vehicle when activeBooking changes
  useEffect(() => {
    if (!activeBooking) {
      setSelectedVehicleId('');
      return;
    }
    const readyMatch = matchingVehicles.find((v) => Boolean(v.assignedDriverId)) || matchingVehicles[0];
    if (readyMatch) {
      setSelectedVehicleId(readyMatch.id);
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedBookingId, vehicles.length]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const assignedDriver = drivers.find((d) => d.id === selectedVehicle?.assignedDriverId);

  const isTypeMatched = selectedVehicle ? selectedVehicle.type === requiredType : false;
  const canDispatch = Boolean(
    activeBooking &&
    selectedVehicle &&
    isTypeMatched &&
    (selectedVehicle.assignedDriverId || assignedDriver)
  );

  const dispatchMutation = useMutation({
    mutationFn: () => {
      if (!selectedBookingId || !selectedVehicleId) {
        throw new Error('Booking and Vehicle must be selected');
      }
      return tripsApi.dispatchBooking(
        selectedBookingId,
        selectedVehicleId,
        selectedVehicle?.assignedDriverId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setSelectedBookingId(null);
      setSelectedVehicleId('');
    },
  });

  return (
    <div className="space-y-6">
      {/* Dispatch Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Unassigned Bookings Queue */}
        <Card className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-400" />
                Unassigned Bookings
              </h3>
              <p className="text-[11px] text-slate-400">Select customer haul to dispatch</p>
            </div>
            <Badge variant="glow">{pendingBookings.length} In Queue</Badge>
          </div>

          <div className="space-y-2.5 max-h-[560px] overflow-y-auto">
            {pendingBookings.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No pending customer bookings.</p>
            ) : (
              pendingBookings.map((bk) => {
                const isSelected = selectedBookingId === bk.id;
                const bkType = bk.vehicleType || (
                  bk.vertical === 'cold_chain'
                    ? 'reefer_cold'
                    : bk.vertical === 'corporate_shuttle'
                    ? 'sedan'
                    : 'heavy_truck'
                );

                return (
                  <div
                    key={bk.id}
                    onClick={() => setSelectedBookingId(bk.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/40'
                        : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{bk.bookingCode}</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatCurrency(bk.estimatedAmount)}</span>
                    </div>

                    <p className="font-medium text-slate-200">{bk.customerName}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{bk.pickupLocation} ➔ {bk.dropoffLocation}</p>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400 font-medium">Req: {formatVehicleType(bkType)}</span>
                      <Badge variant="purple" size="sm">
                        {bk.vertical.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Column 2: Vehicle & Driver Matching Dock */}
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                Dispatch Assignment Dock
              </h3>
              <p className="text-[11px] text-slate-400">
                Match required vehicle type & automatically assign its linked driver
              </p>
            </div>
            {activeBooking && (
              <Badge variant="info">Booking {activeBooking.bookingCode} Active</Badge>
            )}
          </div>

          {!activeBooking ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <Truck className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="font-medium text-slate-400">Select an unassigned booking from the left queue to begin dispatch.</p>
            </div>
          ) : (
            <div className="space-y-5 text-xs">
              {/* Selected Booking Summary Card */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{activeBooking.customerName}</span>
                      <Badge variant="outline" size="sm">
                        Req: {formatVehicleType(requiredType)}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs">{activeBooking.cargoDescription}</p>
                    <p className="text-blue-300 text-xs">
                      {activeBooking.pickupLocation} ➔ {activeBooking.dropoffLocation}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-lg font-bold font-mono text-emerald-400 block">
                      {formatCurrency(activeBooking.estimatedAmount)}
                    </span>
                    <span className="text-[11px] text-slate-400">Scheduled: {activeBooking.scheduledPickupTime}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection Box - Enforcing Type Safety */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-400" />
                    Available Vehicles for {formatVehicleType(requiredType)}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {matchingVehicles.length} available matching asset{matchingVehicles.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {matchingVehicles.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">No Available {formatVehicleType(requiredType)}</span>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        All vehicles matching the required type ({formatVehicleType(requiredType)}) are currently on trip or in maintenance.
                        To prevent dispatch errors, you cannot assign an incompatible vehicle (e.g. assigning a truck for a cab or vice versa).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matchingVehicles.map((v) => {
                      const isPicked = selectedVehicleId === v.id;
                      const hasDriver = Boolean(v.assignedDriverId || v.assignedDriverName);

                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                            isPicked
                              ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/40'
                              : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-white font-mono text-xs">{v.registrationNumber}</span>
                              <span className="block text-[11px] text-slate-400">{v.make} {v.model}</span>
                            </div>
                            <Badge variant="success" size="sm">Available</Badge>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              Driver: <strong className={hasDriver ? 'text-blue-300' : 'text-amber-400'}>
                                {v.assignedDriverName || 'No Driver Assigned'}
                              </strong>
                            </span>
                            {v.capacityKg ? (
                              <span className="text-slate-500 font-mono">{(v.capacityKg / 1000).toFixed(0)}t cap</span>
                            ) : v.capacityPersons ? (
                              <span className="text-slate-500 font-mono">{v.capacityPersons} seats</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Driver Auto-Binding Card */}
              {selectedVehicle && (
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Bound Commercial Driver (Auto-Assigned from Vehicle)
                  </label>

                  {assignedDriver || selectedVehicle.assignedDriverName ? (
                    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={assignedDriver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-blue-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : selectedVehicle.assignedDriverName}
                            </span>
                            <Badge variant="success" size="sm">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Assigned Driver
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {assignedDriver?.licenseType || 'Commercial Driver Operator'} • Safety Score: {assignedDriver?.safetyScore || 95}/100
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono">{assignedDriver?.phone || '+1 (312) 555-0834'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>
                        Vehicle <strong>{selectedVehicle.registrationNumber}</strong> does not have an assigned driver in Fleet Management. Please assign a driver to this vehicle first or choose an available vehicle with an assigned driver.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Other Incompatible Available Vehicles Info Accordion / Note */}
              {otherVehicles.length > 0 && (
                <div className="p-3 rounded-lg border border-slate-800 bg-[#0f172a]/60 text-[11px] text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>
                      {otherVehicles.length} other available vehicle{otherVehicles.length !== 1 ? 's' : ''} hidden because they do not match required type ({formatVehicleType(requiredType)}).
                    </span>
                  </div>
                </div>
              )}

              {/* Final Dispatch Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {canDispatch ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Asset & Driver verified. Ready to dispatch trip.
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Select an available vehicle matching the booking type to proceed.
                    </span>
                  )}
                </div>

                <Button
                  size="md"
                  variant="primary"
                  onClick={() => dispatchMutation.mutate()}
                  isLoading={dispatchMutation.isPending}
                  disabled={!canDispatch}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Confirm & Dispatch Trip
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

