import api from './api';
import { GoogleAnalyticsReport } from '../types';

export const googleAnalyticsService = {
  getReport: async (params: {
    propertyId: string;
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions: string[];
  }): Promise<GoogleAnalyticsReport> => {
    const response = await api.post<GoogleAnalyticsReport>('/analytics/google-analytics/report', params);
    return response.data;
  },
};