import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { EmptyState } from '../feedback/EmptyState';
import { Skeleton } from '../feedback/Skeleton';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export type Column<T> = ColumnDef<T>;

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField?: keyof T;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchable?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id' as keyof T,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchable = true,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search criteria or filters.',
  filterSlot,
  actionsSlot,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => c.key));
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Normalize incoming data safely (handles arrays, { data: [...] }, { results: [...] })
  const rawList = useMemo<T[]>(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).data)) return (data as any).data;
      if (Array.isArray((data as any).results)) return (data as any).results;
    }
    return [];
  }, [data]);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return rawList;
    const term = searchTerm.toLowerCase();
    return rawList.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [rawList, searchTerm]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!Array.isArray(filteredData)) return [];
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      let valA = col?.accessor ? col.accessor(a) : a[sortKey];
      let valB = col?.accessor ? col.accessor(b) : b[sortKey];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // Pagination
  const totalPages = Math.ceil((sortedData?.length || 0) / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!Array.isArray(sortedData)) return [];
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      const allIds = paginatedData.map((row) => String(row[keyField]));
      onSelectionChange(Array.from(new Set([...selectedIds, ...allIds])));
    } else {
      const paginatedIds = new Set(paginatedData.map((row) => String(row[keyField])));
      onSelectionChange(selectedIds.filter((id) => !paginatedIds.has(id)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const activeCols = columns.filter((col) => visibleColumns.includes(col.key));

  return (
    <div className={cn('w-full rounded-xl border border-slate-800 bg-[#141c2e] text-slate-100 shadow-sm overflow-hidden flex flex-col', className)}>
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 p-4 bg-[#0f172a]/50">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              className="h-9 text-xs"
            />
          )}
          {filterSlot}
        </div>

        <div className="flex items-center gap-2">
          {actionsSlot}

          {/* Column Visibility Toggle */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              onClick={() => setShowColumnToggle(!showColumnToggle)}
            >
              Columns
            </Button>

            {showColumnToggle && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl z-20">
                <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Toggle Columns
                </p>
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisibleColumns([...visibleColumns, col.key]);
                        } else {
                          if (visibleColumns.length > 1) {
                            setVisibleColumns(visibleColumns.filter((k) => k !== col.key));
                          }
                        }
                      }}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    {col.header}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 uppercase tracking-wider font-semibold">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((r) => selectedIds.includes(String(r[keyField])))
                    }
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-white',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={cn(
                          'h-3 w-3',
                          sortKey === col.key ? 'text-blue-400' : 'text-slate-600'
                        )}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td className="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>}
                  {activeCols.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length + (selectable ? 1 : 0)} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowId = String(row[keyField] || idx);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors hover:bg-slate-800/40',
                      isSelected && 'bg-blue-950/20',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRow(rowId);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}

                    {activeCols.map((col) => {
                      const value = col.accessor ? col.accessor(row) : row[col.key];
                      return (
                        <td key={col.key} className={cn('px-4 py-3 text-slate-300', col.className)}>
                          {col.render ? col.render(value, row) : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 px-4 py-3 bg-[#0f172a]/50 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{sortedData.length}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 font-medium text-slate-300">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
