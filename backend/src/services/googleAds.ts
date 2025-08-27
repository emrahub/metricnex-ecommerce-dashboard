import { GoogleAdsApi } from 'google-ads-api';

class GoogleAdsService {
  private client: GoogleAdsApi;

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    });
  }

  public async getCampaigns(customerId: string) {
    try {
      const customer = this.client.Customer({
        customer_id: customerId,
        login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
      });

      const campaigns = await customer.report({
        entity: 'campaign',
        attributes: ['campaign.id', 'campaign.name', 'campaign.status'],
        metrics: ['metrics.clicks', 'metrics.impressions', 'metrics.cost_micros'],
        constraints: {
          'campaign.status': 'ENABLED',
        },
        limit: 20,
      });

      return campaigns;
    } catch (error) {
      console.error('Failed to fetch campaigns from Google Ads:', error);
      throw error;
    }
  }
}

export default new GoogleAdsService();