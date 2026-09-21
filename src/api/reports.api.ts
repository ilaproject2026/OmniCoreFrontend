import { apiClient } from './client';

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: string[];
}

export interface ReportDataset {
  title: string;
  category: string;
  generatedAt: string;
  columns: string[];
  rows: Record<string, any>[];
  summary: { label: string; value: string | number }[];
}

export const reportsApi = {
  getCategories: (): ReportCategory[] => [
    {
      id: 'fleet',
      name: 'Fleet Utilization & Telematics',
      description: 'Vehicle active hours, odometer progress, idle engine time, and fuel economy.',
      icon: 'Truck',
      fields: ['Vehicle Reg', 'Make/Model', 'Total KM', 'Fuel Used (L)', 'Utilization %', 'Status'],
    },
    {
      id: 'trips',
      name: 'Trips & Dispatch Revenue',
      description: 'Completed linehaul journeys, on-time percentage, billable amounts, and route margins.',
      icon: 'Navigation',
      fields: ['Trip Code', 'Customer', 'Origin', 'Destination', 'Commercial Rate', 'Expenses', 'Net Margin'],
    },
    {
      id: 'maintenance',
      name: 'Workshop & Maintenance Spend',
      description: 'Breakdown frequencies, parts replacement costs, and technician labor utilization.',
      icon: 'Wrench',
      fields: ['Work Order', 'Vehicle', 'Type', 'Workshop', 'Parts Cost', 'Labor Cost', 'Total Cost'],
    },
    {
      id: 'finance',
      name: 'Financial P&L & Aging Invoices',
      description: 'Revenue realization, outstanding accounts receivable, and vertical margin breakdown.',
      icon: 'DollarSign',
      fields: ['Invoice #', 'Client', 'Due Date', 'Total Amount', 'Balance Due', 'Status'],
    },
    {
      id: 'cold_chain',
      name: 'Cold-Chain Integrity & Breach Log',
      description: 'Pharma and perishable temperature logs, temperature excursions, and compliance SLA.',
      icon: 'Snowflake',
      fields: ['Trip Code', 'Reefer Unit', 'Target Temp', 'Min Temp', 'Max Temp', 'Breach Incidents', 'SLA Result'],
    },
  ],

  generateReport: async (categoryId: string, dateRange?: { start: string; end: string }): Promise<ReportDataset> => {
    const response = await apiClient.post<ReportDataset>('/reports/generate/', { categoryId, dateRange });
    return response.data;
  },
};
