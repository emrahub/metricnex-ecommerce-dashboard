import api, { ApiResponse, Report, ReportCategory } from './api';

export const reportService = {
  // Get all reports
  getReports: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Report[]>> => {
    const response = await api.get<ApiResponse<Report[]>>('/reports', { params });
    return response.data;
  },

  // Get single report
  getReport: async (id: string): Promise<ApiResponse<Report>> => {
    const response = await api.get<ApiResponse<Report>>(`/reports/${id}`);
    return response.data;
  },

  // Create new report
  createReport: async (data: {
    title: string;
    description?: string;
    type: string;
    format: string;
    timeRange?: string;
  }): Promise<ApiResponse<Report>> => {
    const response = await api.post<ApiResponse<Report>>('/reports', data);
    return response.data;
  },

  // Delete report
  deleteReport: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/reports/${id}`);
    return response.data;
  },

  // Export report
  exportReport: async (id: string, format?: string): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get report categories
  getCategories: async (): Promise<ApiResponse<ReportCategory[]>> => {
    const response = await api.get<ApiResponse<ReportCategory[]>>('/reports/categories');
    return response.data;
  },
};