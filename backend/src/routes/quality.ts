import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const dsFile = path.join(process.cwd(), 'uploads', 'data', 'data-sources.json');

router.get('/overview', (_req, res) => {
  try {
    if (!fs.existsSync(dsFile)) return res.json({ success: true, data: [] });
    const raw = fs.readFileSync(dsFile, 'utf-8');
    const items = JSON.parse(raw) as Array<{ id: string; name: string; type: string; config?: Record<string, string> }>;
    const checks = items.map(i => {
      const cfg = i.config || {};
      const base = { id: i.id, name: i.name, type: i.type, status: 'ok' as 'ok' | 'warn' | 'error', checks: [] as { name: string; ok: boolean; message?: string }[] };
      function add(name: string, ok: boolean, message?: string) {
        base.checks.push({ name, ok, message });
        if (!ok) base.status = base.status === 'error' ? 'error' : 'warn';
      }
      switch (i.type) {
        case 'google_analytics':
          add('Property ID present', Boolean((cfg.propertyId || '').trim()));
          add('Credentials present', Boolean((cfg.apiToken || cfg.credentialsBase64 || cfg.serviceAccountJson || '').trim()));
          break;
        case 'google_search_console':
          add('Site URL present', Boolean((cfg.siteUrl || '').trim()));
          add('OAuth refresh token', Boolean((cfg.refreshToken || '').trim()));
          break;
        case 'google_merchant_center':
          add('Merchant ID present', Boolean((cfg.merchantId || '').trim()));
          add('OAuth refresh token', Boolean((cfg.refreshToken || '').trim()));
          break;
        case 'google_ads':
          add('Customer ID present', Boolean((cfg.customerId || '').trim()));
          add('Developer token present', Boolean((cfg.developerToken || '').trim()));
          break;
        case 'shopify':
          add('Shop domain present', Boolean((cfg.shopDomain || '').trim()));
          add('Access token present', Boolean((cfg.accessToken || '').trim()));
          break;
        case 'facebook_ads':
          add('Ad account present', Boolean((cfg.accountId || '').trim()));
          add('Access token present', Boolean((cfg.accessToken || '').trim()));
          break;
        case 'postgresql':
          add('Host present', Boolean((cfg.host || '').trim()));
          add('Database present', Boolean((cfg.database || '').trim()));
          break;
        case 'database':
          add('Host present', Boolean((cfg.host || '').trim()));
          add('Database present', Boolean((cfg.database || '').trim()));
          break;
        case 'bigquery':
          add('Project ID present', Boolean((cfg.projectId || '').trim()));
          add('Service Account present', Boolean((cfg.serviceAccount || '').trim()));
          break;
      }
      return base;
    });
    res.json({ success: true, data: checks });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to compute quality overview' });
  }
});

export default router;

