import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accidentsApi } from '../../api/accidents.api';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { AccidentReport } from '../../types';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  FileCheck,
  Wrench,
  DollarSign,
  Car,
  UserX,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AccidentManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [newAccident, setNewAccident] = useState({
    vehicleId: '',
    vehicleReg: '',
    driverId: '',
    driverName: '',
    dateTime: new Date().toISOString(),
    location: 'I-80 Mile Marker 142, Joliet, IL',
    severity: 'moderate' as AccidentReport['severity'],
    description: '',
    policeReportNumber: '',
    thirdPartyInvolved: false,
    thirdPartyDetails: '',
    estimatedDamageCost: 8500,
  });

  const { data: accidents = [], isLoading } = useQuery({
    queryKey: ['accidents'],
    queryFn: () => accidentsApi.getAccidents(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['fleetVehicles', 'all', 'all'],
    queryFn: () => fleetApi.getVehicles({ status: 'all', vertical: 'all' }),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  const reportMutation = useMutation({
    mutationFn: (data: typeof newAccident) => accidentsApi.reportAccident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      setIsReportModalOpen(false);
      setNewAccident({
        vehicleId: '',
        vehicleReg: '',
        driverId: '',
        driverName: '',
        dateTime: new Date().toISOString(),
        location: 'I-80 Mile Marker 142, Joliet, IL',
        severity: 'moderate',
        description: '',
        policeReportNumber: '',
        thirdPartyInvolved: false,
        thirdPartyDetails: '',
        estimatedDamageCost: 8500,
      });
    },
  });

  // Calculate Incident Summary
  const totalIncidents = accidents.length;
  const severeIncidents = accidents.filter((a) => a.severity === 'severe' || a.severity === 'fatal').length;
  const totalEstimatedDamage = accidents.reduce((acc, a) => acc + (a.estimatedDamageCost || 0), 0);
  const activeClaims = accidents.filter((a) => a.insuranceClaimStatus === 'filed' || a.insuranceClaimStatus === 'under_review').length;

  const getSeverityBadge = (severity: AccidentReport['severity']) => {
    switch (severity) {
      case 'minor':
        return <Badge variant="warning">Minor Scrape</Badge>;
      case 'moderate':
        return <Badge variant="danger">Moderate Collision</Badge>;
      case 'severe':
        return <Badge variant="danger" dot>Severe / Tow Required</Badge>;
      case 'fatal':
        return <Badge variant="danger" dot>Critical Fatality</Badge>;
      default:
        return <Badge variant="default">{severity}</Badge>;
    }
  };

  const getClaimBadge = (status?: AccidentReport['insuranceClaimStatus']) => {
    switch (status) {
      case 'filed':
        return <Badge variant="info">Claim Filed</Badge>;
      case 'under_review':
        return <Badge variant="purple">Under Review</Badge>;
      case 'approved':
      case 'settled':
        return <Badge variant="success">Settled</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="default">Unfiled</Badge>;
    }
  };

  const columns: ColumnDef<AccidentReport>[] = [
    {
      key: 'reportNumber',
      header: 'Report # & Asset',
      sortable: true,
      accessor: (r) => r.reportNumber,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.reportNumber}</span>
          <span className="font-mono text-emerald-400 text-xs font-semibold">{row.vehicleReg}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Operating Driver',
      accessor: (r) => r.driverName,
      render: (val) => <span className="text-slate-200 font-medium text-xs">{val}</span>,
    },
    {
      key: 'location',
      header: 'Location & Time',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-200 block font-medium">{row.location}</span>
          <span className="text-[10px] text-slate-400 font-mono">{formatDate(row.dateTime || row.incidentDate)}</span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Incident Severity',
      accessor: (r) => r.severity,
      render: (val) => getSeverityBadge(val as any),
    },
    {
      key: 'damage',
      header: 'Estimated Damage',
      sortable: true,
      accessor: (r) => r.estimatedDamageCost,
      render: (val) => (
        <span className="font-mono font-bold text-rose-400 text-xs">{formatCurrency(val || 0)}</span>
      ),
    },
    {
      key: 'insurance',
      header: 'Insurance Claim & Work Order',
      render: (_, row) => (
        <div className="text-xs space-y-1">
          <div>{getClaimBadge(row.insuranceClaimStatus)}</div>
          {row.maintenanceWorkOrderId && (
            <span className="text-[10px] text-blue-400 font-mono block">
              WO: {row.maintenanceWorkOrderId}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            Accident, Collision & Grounding Incident Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic asset grounding, police FIR records, driver safety score reduction, and automated insurance claims.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsReportModalOpen(true)}
        >
          Report Incident & Ground Asset
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recorded Incidents"
          value={`${totalIncidents} Collisions`}
          subtitle="All fleet operations (YTD)"
          icon={<Car className="h-4 w-4" />}
          accentColor="amber"
        />

        <StatCard
          title="Estimated Fleet Damage"
          value={formatCurrency(totalEstimatedDamage)}
          subtitle="Physical damage appraisals"
          icon={<DollarSign className="h-4 w-4" />}
          accentColor="rose"
        />

        <StatCard
          title="Severe / Tow Cases"
          value={`${severeIncidents} Cases`}
          subtitle="Major chassis / powertrain impacts"
          icon={<AlertTriangle className="h-4 w-4" />}
          accentColor={severeIncidents > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Active Insurance Claims"
          value={`${activeClaims} Claims`}
          subtitle="Under insurer underwriting review"
          icon={<FileCheck className="h-4 w-4" />}
          accentColor="blue"
        />
      </div>

      {/* Accidents Table */}
      <DataTable
        columns={columns}
        data={accidents}
        isLoading={isLoading}
        searchPlaceholder="Search report #, vehicle, driver, location..."
      />

      {/* REPORT ACCIDENT MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Vehicle Collision & Ground Asset"
        description="Filing immediately changes the vehicle status to 'accident' (grounded) and initiates an insurance claim."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reportMutation.mutate(newAccident);
          }}
          className="space-y-4 text-xs"
        >
          <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Grounding Protocol:</strong> The selected asset will be immediately pulled from active dispatch,
              marked as <code>accident</code>, and an emergency repair work order will be created.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Involved Fleet Vehicle"
              required
              value={newAccident.vehicleId}
              onChange={(e) => {
                const vehId = e.target.value;
                const v = vehicles.find((veh) => veh.id === vehId);
                setNewAccident({
                  ...newAccident,
                  vehicleId: vehId,
                  vehicleReg: v ? v.registrationNumber : '',
                  driverId: v?.assignedDriverId || newAccident.driverId,
                  driverName: v?.assignedDriverName || newAccident.driverName,
                });
              }}
              options={[
                { value: '', label: '-- Select Involved Vehicle --' },
                ...vehicles.map((v) => ({
                  value: v.id,
                  label: `${v.registrationNumber} — ${v.make} ${v.model} (${v.status})`,
                })),
              ]}
            />

            <Select
              label="Operating Driver at Impact"
              required
              value={newAccident.driverId}
              onChange={(e) => {
                const driverId = e.target.value;
                const d = drivers.find((dr) => dr.id === driverId);
                setNewAccident({
                  ...newAccident,
                  driverId,
                  driverName: d ? `${d.firstName} ${d.lastName}` : '',
                });
              }}
              options={[
                { value: '', label: '-- Select Driver --' },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.firstName} ${d.lastName} (${d.licenseType})`,
                })),
              ]}
            />

            <Input
              label="Incident Date & Time"
              type="datetime-local"
              required
              value={newAccident.dateTime.slice(0, 16)}
              onChange={(e) => setNewAccident({ ...newAccident, dateTime: new Date(e.target.value).toISOString() })}
            />

            <Select
              label="Severity Level"
              required
              value={newAccident.severity}
              onChange={(e) => setNewAccident({ ...newAccident, severity: e.target.value as any })}
              options={[
                { value: 'minor', label: 'Minor (Scratch / Dent / Driveable)' },
                { value: 'moderate', label: 'Moderate (Body Panel Damage / Driveable)' },
                { value: 'severe', label: 'Severe (Major Impact / Towing Required)' },
                { value: 'fatal', label: 'Fatal / Critical Emergency' },
              ]}
            />

            <Input
              label="Exact Incident Location / GPS Coordinates"
              required
              placeholder="e.g. Interstate 80 Eastbound Exit 133, Des Moines, IA"
              value={newAccident.location}
              onChange={(e) => setNewAccident({ ...newAccident, location: e.target.value })}
            />

            <Input
              label="Estimated Physical Damage ($)"
              type="number"
              required
              value={newAccident.estimatedDamageCost}
              onChange={(e) => setNewAccident({ ...newAccident, estimatedDamageCost: Number(e.target.value) })}
            />

            <Input
              label="Police Incident / Case Number"
              placeholder="e.g. ISP-2026-88190"
              value={newAccident.policeReportNumber}
              onChange={(e) => setNewAccident({ ...newAccident, policeReportNumber: e.target.value })}
            />

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="thirdParty"
                checked={newAccident.thirdPartyInvolved}
                onChange={(e) => setNewAccident({ ...newAccident, thirdPartyInvolved: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="thirdParty" className="text-slate-200 font-medium">
                Third-Party Vehicle / Property Involved
              </label>
            </div>
          </div>

          <Input
            label="Collision Description & Circumstances"
            required
            placeholder="e.g. Rear-end collision on highway during heavy rain; brake lockup"
            value={newAccident.description}
            onChange={(e) => setNewAccident({ ...newAccident, description: e.target.value })}
          />

          {newAccident.thirdPartyInvolved && (
            <Input
              label="Third-Party Details (Driver, Plate, Insurer)"
              placeholder="e.g. John Doe, IL Plate 884-XYZ, State Farm Policy #88120"
              value={newAccident.thirdPartyDetails}
              onChange={(e) => setNewAccident({ ...newAccident, thirdPartyDetails: e.target.value })}
            />
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={reportMutation.isPending}>
              Submit Incident & Ground Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
