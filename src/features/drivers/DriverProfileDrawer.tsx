import React, { useState } from 'react';
import { Drawer } from '../../components/common/Drawer';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Driver } from '../../types';
import { useTenant } from '../../contexts/TenantContext';
import {
  User,
  FileCheck,
  Truck,
  DollarSign,
  Award,
  AlertTriangle,
  Lock,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export interface DriverProfileDrawerProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverProfileDrawer: React.FC<DriverProfileDrawerProps> = ({
  driver,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { can } = useTenant();

  if (!driver) return null;

  const canViewPayroll = can('payroll.view');

  const tabs = [
    { id: 'overview', label: 'Profile Overview', icon: <User className="h-3.5 w-3.5" /> },
    { id: 'license', label: 'License & Documents', icon: <FileCheck className="h-3.5 w-3.5" />, count: driver.documents.length },
    { id: 'assignments', label: 'Vehicle & Trips', icon: <Truck className="h-3.5 w-3.5" /> },
    { id: 'performance', label: 'Safety Score', icon: <Award className="h-3.5 w-3.5" /> },
    {
      id: 'payroll',
      label: 'Payroll & Compensation',
      icon: canViewPayroll ? <DollarSign className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />,
    },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${driver.firstName} ${driver.lastName}`}
      subtitle={`License: ${driver.licenseNumber} • ${driver.licenseType}`}
      width="lg"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-[#141c2e]">
              <img
                src={driver.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                alt={driver.firstName}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <Badge variant={driver.status === 'on_trip' ? 'info' : 'success'} size="sm" dot>
                    {driver.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {driver.phone}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {driver.email}</span>
                  {driver.address && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {driver.address}</span>
                    </>
                  )}
                  {driver.experienceYears !== undefined && driver.experienceYears > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-400 font-medium">{driver.experienceYears} Years Exp</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[11px]">Safety Score</span>
                <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {driver.safetyScore} / 100
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[11px]">Total Trips</span>
                <span className="text-xl font-bold text-white font-mono mt-0.5 block">
                  {driver.totalTrips}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[11px]">On-Time Rate</span>
                <span className="text-xl font-bold text-blue-400 font-mono mt-0.5 block">
                  {driver.onTimeDeliveryRate}%
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[11px]">Incidents Logged</span>
                <span className="text-xl font-bold text-slate-300 font-mono mt-0.5 block">
                  {driver.incidentCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: License & Documents */}
        {activeTab === 'license' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Commercial Driver License (CDL)</h4>
                <Badge variant="outline">{driver.licenseType}</Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">License Number: <strong className="text-white font-mono">{driver.licenseNumber}</strong></span>
                <span className="text-slate-400">Expiry: <strong className="text-amber-400 font-mono">{formatDate(driver.licenseExpiryDate)}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-300 block">Mandatory Regulatory Documents</span>
              {driver.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border border-slate-800 bg-[#141c2e] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white capitalize block">{doc.type.replace('_', ' ')}</span>
                    <span className="text-[11px] font-mono text-slate-400">{doc.documentNumber}</span>
                  </div>
                  <div>
                    {doc.isExpiringSoon ? (
                      <Badge variant="warning" dot>Expiring Soon</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Assignments */}
        {activeTab === 'assignments' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4">
              <span className="text-slate-400 block text-[11px]">Currently Assigned Linehaul Vehicle</span>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm font-mono">{driver.assignedVehicleReg || 'No Assigned Vehicle'}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Asset ID: {driver.assignedVehicleId || 'N/A'}</p>
                </div>
                <Badge variant={driver.assignedVehicleId ? 'info' : 'outline'}>
                  {driver.assignedVehicleId ? 'Bound to Vehicle' : 'In Pool'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Performance & Safety */}
        {activeTab === 'performance' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Telematics Driver Scorecard</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{driver.safetyScore}/100</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400"><span>Smooth Braking:</span> <span className="text-slate-200">98% compliant</span></div>
                <div className="flex justify-between text-slate-400"><span>Speed Limit Adherence:</span> <span className="text-slate-200">99.2% compliant</span></div>
                <div className="flex justify-between text-slate-400"><span>Cornering Stability:</span> <span className="text-slate-200">97.5% compliant</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Sensitive Payroll Information (Permission Gated) */}
        {activeTab === 'payroll' && (
          <div className="space-y-4 text-xs">
            {!canViewPayroll ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-3">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-white text-sm">Restricted Compensation Data</h4>
                <p className="mt-1 text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  You do not possess the <code className="text-red-400 bg-red-950/60 px-1 py-0.5 rounded">payroll.view</code> permission required to view compensation, base salary, or banking credentials.
                </p>
              </div>
            ) : driver.payroll ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-200">Authorized Payroll View</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Last Payout: {formatDate(driver.payroll.lastPayoutDate)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                    <span className="text-slate-400 block text-[11px]">Base Monthly Salary</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                      {formatCurrency(driver.payroll.baseSalary)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                    <span className="text-slate-400 block text-[11px]">Per-Trip Linehaul Allowance</span>
                    <span className="text-lg font-bold text-blue-400 font-mono mt-0.5 block">
                      {formatCurrency(driver.payroll.perTripAllowance)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                    <span className="text-slate-400 block text-[11px]">Overtime Hourly Rate</span>
                    <span className="text-lg font-bold text-slate-200 font-mono mt-0.5 block">
                      {formatCurrency(driver.payroll.overtimeRate)}/hr
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                    <span className="text-slate-400 block text-[11px]">Performance Bonus</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                      +{formatCurrency(driver.payroll.bonuses)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-2">
                  <span className="font-semibold text-slate-300 block">Bank Account & Tax Credentials</span>
                  <div className="flex justify-between text-slate-400"><span>Bank Name:</span> <span className="text-white font-medium">{driver.payroll.bankName}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Account Number:</span> <span className="text-white font-mono">{driver.payroll.bankAccountNumber}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Tax Identifier:</span> <span className="text-white font-mono">{driver.payroll.taxId}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">No payroll records configured for this driver.</p>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};
