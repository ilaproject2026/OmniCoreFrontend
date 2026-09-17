import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../../api/drivers.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Driver } from '../../types';
import { DriverProfileDrawer } from './DriverProfileDrawer';
import {
  Users,
  Plus,
  Eye,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  Award,
  Phone,
  Mail,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const DriverList: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Add Driver Form State
  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    licenseType: 'Class A CDL',
    licenseNumber: '',
    licenseExpiryDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    experienceYears: 5,
    status: 'available' as Driver['status'],
    safetyScore: 98,
  });

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', statusFilter],
    queryFn: () => driversApi.getDrivers({ status: statusFilter }),
  });

  // Create Driver Mutation
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Driver>) => driversApi.createDriver(payload),
    onSuccess: (createdDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsAddModalOpen(false);
      setNewDriver({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        licenseType: 'Class A CDL',
        licenseNumber: '',
        licenseExpiryDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        experienceYears: 5,
        status: 'available',
        safetyScore: 98,
      });
      setActionFeedback(`Driver ${createdDriver.firstName} ${createdDriver.lastName} registered successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newDriver,
      experienceYears: Number(newDriver.experienceYears),
      safetyScore: Number(newDriver.safetyScore),
    });
  };

  const columns: ColumnDef<Driver>[] = [
    {
      key: 'name',
      header: 'Driver Name & Contact',
      sortable: true,
      accessor: (r) => `${r.firstName} ${r.lastName}`,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
            alt={row.firstName}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white block">
                {row.firstName} {row.lastName}
              </span>
              {row.experienceYears !== undefined && row.experienceYears > 0 && (
                <span className="text-[10px] bg-blue-500/15 text-blue-400 font-medium px-1.5 py-0.2 rounded border border-blue-500/30">
                  {row.experienceYears}y exp
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{row.phone}</span>
              {row.address && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[140px] text-slate-500" title={row.address}>
                    {row.address}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'license',
      header: 'License & Validity',
      accessor: (r) => r.licenseNumber,
      render: (_, row) => {
        const isExpiringSoon = new Date(row.licenseExpiryDate).getTime() - Date.now() < 30 * 86400000;

        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-slate-200 block font-semibold">
                {row.licenseNumber}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1 rounded">
                {row.licenseType.includes('Hazmat')
                  ? 'Hazmat'
                  : row.licenseType.includes('Reefer')
                  ? 'Reefer'
                  : 'CDL'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-slate-400">Exp: {formatDate(row.licenseExpiryDate)}</span>
              {isExpiringSoon && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3" /> Due Soon
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Duty Status',
      sortable: true,
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'available') return <Badge variant="success" dot>Available</Badge>;
        if (val === 'on_trip') return <Badge variant="info" dot>On Trip</Badge>;
        if (val === 'on_duty') return <Badge variant="purple" dot>On Duty</Badge>;
        return <Badge variant="default">{val}</Badge>;
      },
    },
    {
      key: 'assignedVehicle',
      header: 'Assigned Vehicle',
      render: (_, row) => (
        <div>
          {row.assignedVehicleReg ? (
            <span className="font-mono text-blue-400 font-semibold text-xs block">
              {row.assignedVehicleReg}
            </span>
          ) : (
            <span className="text-slate-500 italic text-xs">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'safety',
      header: 'Safety & On-Time',
      sortable: true,
      accessor: (r) => r.safetyScore,
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-400 font-mono">{row.safetyScore}/100</span>
          <span className="text-[10px] text-slate-400 block">{row.onTimeDeliveryRate}% on-time</span>
        </div>
      ),
    },
    {
      key: 'trips',
      header: 'Trips Completed',
      sortable: true,
      accessor: (r) => r.totalTrips,
      render: (val) => <span className="font-mono text-slate-300 font-bold">{val}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDriver(row);
          }}
          leftIcon={<Eye className="h-3.5 w-3.5 text-blue-400" />}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Commercial Driver Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            CDL credentials, license expirations, safety telematics, and permission-protected payroll.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Driver
        </Button>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        searchPlaceholder="Search driver name, license number, phone..."
        onRowClick={(row) => setSelectedDriver(row)}
        filterSlot={
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'available', label: 'Available' },
              { value: 'on_trip', label: 'On Trip' },
              { value: 'on_duty', label: 'On Duty' },
            ]}
          />
        }
      />

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Commercial Linehaul Driver"
        description="Enroll a new commercial CDL driver into the active fleet roster."
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Driver First Name"
              required
              placeholder="e.g. Robert"
              value={newDriver.firstName}
              onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
            />

            <Input
              label="Driver Last Name"
              required
              placeholder="e.g. Chen"
              value={newDriver.lastName}
              onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
            />

            <Input
              label="Phone Number"
              type="tel"
              required
              placeholder="e.g. +1 (312) 555-8831"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. robert.c@apexlogistics.com"
              value={newDriver.email}
              onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
            />

            <div className="md:col-span-2">
              <Input
                label="Residential / Operating Address"
                placeholder="e.g. 450 N Michigan Ave, Suite 1200, Chicago, IL 60611"
                value={newDriver.address}
                onChange={(e) => setNewDriver({ ...newDriver, address: e.target.value })}
              />
            </div>

            <Select
              label="Commercial Licence Classification"
              value={newDriver.licenseType}
              onChange={(e) => setNewDriver({ ...newDriver, licenseType: e.target.value })}
              options={[
                { value: 'Class A CDL', label: 'Class A CDL (Standard Commercial Linehaul)' },
                { value: 'Class A CDL + Hazmat & Tanker', label: 'Class A CDL + Hazmat & Tanker Endorsement' },
                { value: 'Class A CDL + Reefer Endorsement', label: 'Class A CDL + Reefer Cold Chain' },
                { value: 'Class B CDL', label: 'Class B CDL (Medium Straight Truck)' },
                { value: 'Class C CDL', label: 'Class C CDL (Commercial Passenger / Cab)' },
              ]}
            />

            <Input
              label="Commercial Licence Number"
              required
              placeholder="e.g. CDL-IL-98421034"
              value={newDriver.licenseNumber}
              onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
            />

            <Input
              label="Licence Expiration Date"
              type="date"
              required
              value={newDriver.licenseExpiryDate}
              onChange={(e) => setNewDriver({ ...newDriver, licenseExpiryDate: e.target.value })}
            />

            <Input
              label="Years of Commercial Experience"
              type="number"
              min="0"
              max="50"
              placeholder="e.g. 8"
              value={newDriver.experienceYears}
              onChange={(e) => setNewDriver({ ...newDriver, experienceYears: Number(e.target.value) })}
            />

            <Select
              label="Initial Duty Roster Status"
              value={newDriver.status}
              onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value as Driver['status'] })}
              options={[
                { value: 'available', label: 'Available for Dispatch (In Pool)' },
                { value: 'on_duty', label: 'On Duty (Depot / Facility Assignment)' },
              ]}
            />

            <Input
              label="Initial Telematics Safety Rating"
              type="number"
              min="50"
              max="100"
              placeholder="98"
              value={newDriver.safetyScore}
              onChange={(e) => setNewDriver({ ...newDriver, safetyScore: Number(e.target.value) })}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending}
            >
              Register Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* Driver Profile Drawer */}
      <DriverProfileDrawer
        driver={selectedDriver}
        isOpen={Boolean(selectedDriver)}
        onClose={() => setSelectedDriver(null)}
      />
    </div>
  );
};
