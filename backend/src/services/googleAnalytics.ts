import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import path from 'path';

class GoogleAnalyticsService {
  private analyticsDataClient: BetaAnalyticsDataClient | null = null;

  private initClient() {
    if (!this.analyticsDataClient) {
      // 1) Prefer environment variable
      const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;

      let credentials: any | null = null;

      if (base64 && base64.trim()) {
        try {
          const credentialsJson = Buffer.from(base64, 'base64').toString('utf-8');
          credentials = JSON.parse(credentialsJson);
        } catch (e) {
          throw new Error('Invalid GOOGLE_CREDENTIALS_BASE64: cannot decode/parse JSON');
        }
      } else {
        // 2) Fallback to data-sources store (Settings → Data Sources → Google Analytics)
        try {
          const storePath = path.join(process.cwd(), 'uploads', 'data', 'data-sources.json');
          if (fs.existsSync(storePath)) {
            const raw = fs.readFileSync(storePath, 'utf-8');
            const items = JSON.parse(raw) as Array<{ type?: string; name?: string; config?: Record<string, any> }>;
            const ga = items.find(i => i?.type === 'google_analytics' || /google\s*analytics/i.test(String(i?.name || '')));
            const cfg = ga?.config || {};
            // Accept several possible keys from UI: apiToken (preferred), credentialsBase64, serviceAccountJson
            const token: string = String(cfg.apiToken || cfg.credentialsBase64 || cfg.serviceAccountJson || '').trim();
            if (token) {
              // If token looks like JSON, parse directly; otherwise assume base64-encoded JSON
              if (token.startsWith('{')) {
                credentials = JSON.parse(token);
              } else {
                const decoded = Buffer.from(token, 'base64').toString('utf-8');
                credentials = JSON.parse(decoded);
              }
            }
          }
        } catch (e) {
          // Ignore and let the error below guide the user
        }
      }

      if (!credentials) {
        throw new Error('Google Analytics credentials not found. Set GOOGLE_CREDENTIALS_BASE64 or configure in Settings → Data Sources.');
      }

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
