import api from './api';

export interface GoogleAdsCampaign {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    clicks: string;
    impressions: string;
    costMicros: string;
  };
}

export const googleAdsService = {
  getCampaigns: async (customerId: string): Promise<GoogleAdsCampaign[]> => {
    const response = await api.post<GoogleAdsCampaign[]>('/google-ads/campaigns', { customerId });
    return response.data;
  },
};