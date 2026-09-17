import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '../../api/branches.api';
import { MapPin, ChevronDown, Check, Building } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Branch } from '../../types';

export const BranchSwitcher: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('omnicore_active_branch') || 'all';
  });
  const [isOpen, setIsOpen] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getBranches(),
  });

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const handleSelect = (id: string) => {
    setSelectedBranchId(id);
    localStorage.setItem('omnicore_active_branch', id);
    setIsOpen(false);
  };

  return (
    <div className="relative hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/30 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all max-w-[170px] cursor-pointer"
        title="Scope Fleet by Regional Branch"
      >
        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span className="font-medium truncate text-left text-[11px]">
          {selectedBranch ? `${selectedBranch.city} (${selectedBranch.code})` : 'All Branches'}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-40">
            <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Regional Operating Hub / Branch
              </p>
            </div>

            <button
              onClick={() => handleSelect('all')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer',
                selectedBranchId === 'all'
                  ? 'bg-blue-600/20 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <div>
                <span className="block font-medium">All Branches / Enterprise</span>
                <span className="text-[10px] text-slate-500">Unfiltered multi-depot view</span>
              </div>
              {selectedBranchId === 'all' && <Check className="h-3.5 w-3.5 text-blue-400" />}
            </button>

            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelect(b.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-blue-600/20 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <span className="block truncate font-medium">{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {b.city}, {b.state} • {b.vehiclesCount} vehicles
                    </span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
