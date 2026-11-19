import { apiClient } from './client';

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: string[];
  available?: boolean;
}

export interface ReportDataset {
  title: string;
  category: string;
  generatedAt: string;
  period: { startDate: string; endDate: string };
  available: boolean;
  notice?: string | null;
  columns: string[];
  rows: Record<string, string | number | null>[];
  summary: { label: string; value: string | number }[];
  truncated: boolean;
}

const getResponseData = (response: any) => response.data?.data || response.data;

export const reportsApi = {
  getCategories: async (): Promise<ReportCategory[]> => {
    const response = await apiClient.get('/reports/categories/');
    const data = getResponseData(response);
    return data?.categories || [];
  },

  generateReport: async (
    categoryId: string,
    dateRange: { start: string; end: string }
  ): Promise<ReportDataset> => {
    const response = await apiClient.get('/reports/generate/', {
      params: {
        category_id: categoryId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
    });
    const raw = getResponseData(response);
    return {
      title: raw.title,
      category: raw.category,
      generatedAt: raw.generated_at,
      period: {
        startDate: raw.period?.start_date || dateRange.start,
        endDate: raw.period?.end_date || dateRange.end,
      },
      available: raw.available !== false,
      notice: raw.notice || null,
      columns: raw.columns || [],
      rows: raw.rows || [],
      summary: raw.summary || [],
      truncated: Boolean(raw.truncated),
    };
  },
};
