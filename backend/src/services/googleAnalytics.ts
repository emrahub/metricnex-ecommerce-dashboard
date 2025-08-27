import { BetaAnalyticsDataClient } from '@google-analytics/data';

class GoogleAnalyticsService {
  private analyticsDataClient: BetaAnalyticsDataClient | null = null;

  private initClient() {
    if (!this.analyticsDataClient) {
      const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;
      if (!base64) {
        throw new Error('GOOGLE_CREDENTIALS_BASE64 environment variable is not set');
      }
      const credentialsJson = Buffer.from(base64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsJson);
      this.analyticsDataClient = new BetaAnalyticsDataClient({ credentials });
    }
    return this.analyticsDataClient;
  }

  public async getReport(propertyId: string, startDate: string, endDate: string, metrics: string[], dimensions: string[]) {
    try {
      const client = this.initClient();
      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
      });

      return response;
    } catch (error) {
      console.error('Failed to fetch report from Google Analytics:', error);
      throw error;
    }
  }
}

export default new GoogleAnalyticsService();