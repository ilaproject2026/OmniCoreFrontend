import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Download, Printer, AlertCircle, Loader2 } from 'lucide-react';

type DateRangePreset = '7d' | '30d' | '90d' | 'ytd';

const toDateInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const getDateRange = (preset: DateRangePreset) => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  if (preset === 'ytd') start.setMonth(0, 1);
  else start.setDate(start.getDate() - (Number(preset.slice(0, -1)) - 1));
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
};

export const ReportsHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('trips');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorValue,
  } = useQuery({
    queryKey: ['reportCategories'],
    queryFn: () => reportsApi.getCategories(),
  });

  useEffect(() => {
    if (categories.length && !categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reportDataset', selectedCategory, dateRange.start, dateRange.end],
    queryFn: () => reportsApi.generateReport(selectedCategory, dateRange),
    enabled: Boolean(selectedCategory && categories.some((category) => category.id === selectedCategory)),
  });

  const handleExportCsv = () => {
    if (!report?.available) return;
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      report.columns.map(escapeCsv).join(','),
      ...report.rows.map((row) => report.columns.map((column) => escapeCsv(row[column])).join(',')),
    ];
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OmniCore_${selectedCategory}_${dateRange.start}_${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tenant-scoped operational and financial reports from recorded system data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportCsv} disabled={isLoading || !report?.available}>
            Export CSV
          </Button>
        </div>
      </div>

      {categoriesError && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {categoriesErrorValue instanceof Error ? categoriesErrorValue.message : 'Report categories could not be loaded.'}
        </div>
      )}

      {!categoriesError && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
            {categories.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <button key={category.id} type="button" onClick={() => setSelectedCategory(category.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all select-none text-xs flex flex-col justify-between ${
                    active ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/40' : 'border-slate-800 bg-[#0f172a]/70 hover:border-slate-700'
                  }`}>
                  <span>
                    <span className="font-bold text-white block">{category.name}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">{category.description}</span>
                  </span>
                  <span className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                    <span>{category.fields.length} columns</span>
                    {category.available === false && <Badge variant="warning" size="sm">Not connected</Badge>}
                    {active && category.available !== false && <Badge variant="info" size="sm">Selected</Badge>}
                  </span>
                </button>
              );
            })}
            {categoriesLoading && <div className="text-xs text-slate-400">Loading reports…</div>}
          </div>

          {!categoriesLoading && !categories.length && (
            <div role="status" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300">
              Your role does not have access to any report categories.
            </div>
          )}

          <div className="flex items-center justify-between gap-3 no-print">
            <p className="text-xs text-slate-400">Report period: <span className="font-mono text-slate-300">{dateRange.start} – {dateRange.end}</span></p>
            <Select aria-label="Report date range" value={datePreset} onChange={(event) => setDatePreset(event.target.value as DateRangePreset)}
              className="w-40 h-9 text-xs" options={[
                { value: '7d', label: 'Past 7 Days' },
                { value: '30d', label: 'Past 30 Days' },
                { value: '90d', label: 'Past 90 Days' },
                { value: 'ytd', label: 'Year to Date' },
              ]} />
          </div>

          {isError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error instanceof Error ? error.message : 'The selected report could not be generated.'}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating report…
            </div>
          )}

          {report && (
            <Card className="p-6 space-y-6 print:bg-white print:text-black">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest block">{report.category}</span>
                  <h2 className="text-xl font-bold text-white mt-1">{report.title}</h2>
                  <span className="text-xs text-slate-400">
                    {report.period.startDate} – {report.period.endDate} · Generated {new Date(report.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {report.notice && (
                <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {report.notice}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {report.summary.map((item) => (
                  <div key={item.label} className="p-3.5 rounded-lg border border-slate-800 bg-[#0f172a]/60">
                    <span className="text-slate-400 text-xs block">{item.label}</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      {report.columns.map((column) => <th key={column} className="px-4 py-3 whitespace-nowrap">{column}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.rows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-800/40">
                        {report.columns.map((column) => <td key={column} className="px-4 py-3 text-slate-200 whitespace-nowrap">{row[column] ?? '—'}</td>)}
                      </tr>
                    ))}
                    {!report.rows.length && (
                      <tr><td colSpan={Math.max(report.columns.length, 1)} className="px-4 py-10 text-center text-slate-400">
                        {report.available ? 'No records found for this date range.' : 'This report has no connected data source.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
