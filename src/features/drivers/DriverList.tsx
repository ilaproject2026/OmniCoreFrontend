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
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { useTenant } from '../../contexts/TenantContext';

export const DriverList: React.FC = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [driverImage, setDriverImage] = useState<File | null>(null);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [driverDocuments, setDriverDocuments] = useState<Array<{ file: File; name: string }>>([]);
  const [documentReplacements, setDocumentReplacements] = useState<Record<string, File>>({});

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
    queryKey: ['drivers', tenant.id, statusFilter],
    queryFn: () => driversApi.getDrivers({ status: statusFilter }),
  });

  // Create Driver Mutation
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Driver> & { imageFile?: File; documentFiles?: Array<{ file: File; name: string }> }) => driversApi.createDriver(payload),
    onError: (error: any) => {
      if (!error?.driverCreated) return;
      const driver = error.driverCreated as Driver;
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setEditingDriver(driver);
      setNewDriver({
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        email: driver.email,
        address: driver.address || '',
        licenseType: driver.licenseType,
        licenseNumber: driver.licenseNumber,
        licenseExpiryDate: driver.licenseExpiryDate,
        experienceYears: driver.experienceYears || 0,
        status: driver.status,
        safetyScore: driver.safetyScore || 95,
      });
      setActionFeedback(`Driver ${driver.firstName} ${driver.lastName} was created. The image or document upload failed; correct the attachment and save this existing driver.`);
    },
    onSuccess: (createdDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsAddModalOpen(false);
      setDriverImage(null);
      setDriverDocuments([]);
      setImageValidationError(null);
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Driver> & { imageFile?: File; documentFiles?: Array<{ file: File; name: string }> } }) => driversApi.updateDriver(id, payload),
    onSuccess: (updatedDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsAddModalOpen(false);
      setEditingDriver(null);
      setDriverImage(null);
      setDriverDocuments([]);
      setImageValidationError(null);
      setActionFeedback(`Driver ${updatedDriver.firstName} ${updatedDriver.lastName} updated successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    },
  });

  const attachmentMutation = useMutation({
    mutationFn: () => driversApi.updateDriverAttachments(
      editingDriver!.id,
      driverImage || undefined,
      driverDocuments,
      Object.entries(documentReplacements).map(([id, file]) => {
        const current = editingDriver!.documents.find((document) => document.id === id)!;
        return { id, file, name: current.documentName || current.type, type: current.type };
      }),
    ),
    onSuccess: (updatedDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setEditingDriver(updatedDriver);
      setDriverImage(null);
      setDriverDocuments([]);
      setDocumentReplacements({});
      setImageValidationError(null);
      setActionFeedback(`Photo and documents for ${updatedDriver.firstName} ${updatedDriver.lastName} saved.`);
      setTimeout(() => setActionFeedback(null), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (driver: Driver) => driversApi.deleteDriver(driver.id),
    onSuccess: (_, deletedDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setActionFeedback(`Driver ${deletedDriver.firstName} ${deletedDriver.lastName} deleted.`);
      setTimeout(() => setActionFeedback(null), 4000);
    },
  });

  const openEditDriver = (driver: Driver) => {
    setDriverImage(null);
    setDriverDocuments([]);
    setDocumentReplacements({});
    setImageValidationError(null);
    setEditingDriver(driver);
    setNewDriver({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      phone: driver.phone || '',
      email: driver.email || '',
      address: driver.address || '',
      licenseType: driver.licenseType || 'Class A CDL',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiryDate: driver.licenseExpiryDate || '',
      experienceYears: driver.experienceYears || 0,
      status: driver.status,
      safetyScore: driver.safetyScore || 95,
    });
    createMutation.reset();
    updateMutation.reset();
    setIsAddModalOpen(true);
  };

  const handleDeleteDriver = (driver: Driver) => {
    if (window.confirm(`Delete ${driver.firstName} ${driver.lastName}? This action cannot be undone.`)) {
      deleteMutation.mutate(driver);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Driver> & { imageFile?: File; documentFiles?: Array<{ file: File; name: string }> } = {
      ...newDriver,
      experienceYears: Number(newDriver.experienceYears),
      safetyScore: Number(newDriver.safetyScore),
      imageFile: driverImage || undefined,
      documentFiles: driverDocuments,
    };
    if (imageValidationError) return;
    if (editingDriver) {
      const { imageFile: _imageFile, documentFiles: _documentFiles, ...driverFields } = payload;
      updateMutation.mutate({ id: editingDriver.id, payload: driverFields });
    } else {
      createMutation.mutate(payload);
    }
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
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedDriver(row); }} leftIcon={<Eye className="h-3.5 w-3.5 text-blue-400" />}>
            View
          </Button>
          <Button variant="ghost" size="icon" title="Edit driver" aria-label={`Edit ${row.firstName} ${row.lastName}`} onClick={(e) => { e.stopPropagation(); openEditDriver(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete driver" aria-label={`Delete ${row.firstName} ${row.lastName}`} onClick={(e) => { e.stopPropagation(); handleDeleteDriver(row); }} disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4 text-rose-400" />
          </Button>
        </div>
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
          onClick={() => { setEditingDriver(null); setIsAddModalOpen(true); }}
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
        title={editingDriver ? 'Edit Driver Profile' : 'Register Commercial Linehaul Driver'}
        description={editingDriver ? 'Update this driver’s contact and licence details.' : 'Enroll a new commercial CDL driver into the active fleet roster.'}
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {(createMutation.isError || updateMutation.isError || attachmentMutation.isError) && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold block">{editingDriver ? 'Upload or validation error:' : 'Backend validation error:'}</span>
                <span>
                  {(attachmentMutation.error as any)?.message || (updateMutation.error as any)?.message || (createMutation.error as any)?.message ||
                    'Driver registration failed on backend validation.'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <label className="block text-xs text-slate-300">
                <span className="mb-2 block font-semibold">{editingDriver ? 'Replace driver photo' : 'Driver photo'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  const extensionSupported = /\.(jpe?g|png|webp)$/i.test(file?.name || '');
                  const allowed = file && extensionSupported && (!file.type || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
                  setImageValidationError(file && !allowed ? 'Choose a JPG, PNG, or WEBP image. HEIC and other formats are not supported.' : null);
                  setDriverImage(allowed ? file : null);
                }} className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-3 file:py-2 file:text-blue-300" />
                <span className="mt-1 block text-[11px] text-slate-500">Supported formats: JPG, PNG, WEBP</span>
                {imageValidationError && <span className="mt-1 block text-[11px] text-rose-300">{imageValidationError}</span>}
              </label>
              <label className="block text-xs text-slate-300">
                <span className="mb-2 block font-semibold">Driver documents</span>
                <input type="file" multiple accept=".pdf,image/*" onChange={(e) => setDriverDocuments(Array.from(e.target.files || []).map((file) => ({ file, name: '' })))} className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-3 file:py-2 file:text-blue-300" />
                <span className="mt-1 block text-[11px] text-slate-500">{driverDocuments.length ? `${driverDocuments.length} file(s) selected — identify each document below` : 'Upload PDF or image files'}</span>
                {driverDocuments.map((document, index) => (
                  <div key={`${document.file.name}-${index}`} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <span className="truncate text-[11px] text-slate-400" title={document.file.name}>{document.file.name}</span>
                    <select required value={document.name} onChange={(e) => setDriverDocuments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs text-white">
                      <option value="">Select document type</option>
                      <option value="Driving Licence">Driving Licence</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Medical Certificate">Medical Certificate</option>
                      <option value="Police Clearance">Police Clearance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                ))}
                {editingDriver?.documents?.map((document) => (
                  <div key={document.id} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center border-t border-slate-800 pt-3">
                    <span className="truncate text-[11px] text-slate-300">Replace: {document.documentName || document.type.replace(/_/g, ' ')}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setDocumentReplacements((current) => ({ ...current, [document.id]: file }));
                    }} className="block w-full text-[11px] text-slate-400" />
                    {documentReplacements[document.id] && <span className="sm:col-span-2 text-[11px] text-emerald-300">Selected: {documentReplacements[document.id].name}</span>}
                  </div>
                ))}
              </label>
            </div>
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
              placeholder="e.g. driver@organization.com"
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
            {editingDriver && (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={!driverImage && !driverDocuments.length && !Object.keys(documentReplacements).length}
                isLoading={attachmentMutation.isPending}
                onClick={() => attachmentMutation.mutate()}
              >
                Save Photo & Documents
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => { setIsAddModalOpen(false); setEditingDriver(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingDriver ? 'Save Changes' : 'Register Driver'}
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
