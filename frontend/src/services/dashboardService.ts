import api, { ApiResponse } from './api';

export interface DashboardMetrics {
  totalReports: number;
  reportsThisMonth: number;
  activeScheduledReports: number;
  totalDataSources: number;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    redis: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  };
}

export const dashboardService = {
  // Get dashboard metrics
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await api.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');
    return response.data;
  },
};