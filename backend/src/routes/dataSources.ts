import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import https from 'https';
import net from 'net';
import { Client as PGClient } from 'pg';
import { google } from 'googleapis';
// google-ads live test (requires full OAuth config)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { GoogleAdsApi } from 'google-ads-api';

type DataSourceStatus = 'connected' | 'disconnected' | 'unknown';
type DataSourceType = 'google_analytics' | 'google_ads' | 'shopify' | 'facebook_ads' | 'database' | string;

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  lastSync?: string;
  isActive?: boolean;
  config: Record<string, string>;
}

const router = Router();

// Prefer a stable location under the runtime CWD so dev (ts-node) and prod (dist) use the same file
const preferredDataDir = path.join(process.cwd(), 'uploads', 'data');
const preferredStoreFile = path.join(preferredDataDir, 'data-sources.json');

// Legacy locations used previously (depending on dev/prod pathing)
const legacyDirs = [
  path.join(__dirname, '../uploads/data'), // src/dev or dist/prod relative
  path.join(process.cwd(), 'dist', 'uploads', 'data'),
  path.join(process.cwd(), 'src', 'uploads', 'data'),
];

function ensureStore() {
  if (!fs.existsSync(preferredDataDir)) fs.mkdirSync(preferredDataDir, { recursive: true });

  // If preferred store doesn't exist, try to migrate from legacy paths
  if (!fs.existsSync(preferredStoreFile)) {
    for (const dir of legacyDirs) {
      const legacyFile = path.join(dir, 'data-sources.json');
      if (fs.existsSync(legacyFile)) {
        try {
          const content = fs.readFileSync(legacyFile);
          fs.writeFileSync(preferredStoreFile, content);
          return; // migrated
        } catch {
          // fall through to seeding
        }
      }
    }

    // Seed default content when nothing to migrate
    const seed: DataSource[] = [
      { id: 'seed_shopify', name: 'Shopify Store', type: 'shopify', status: 'disconnected', lastSync: 'Never', config: { shopDomain: '', accessToken: '' } },
      { id: 'seed_ga', name: 'Google Analytics', type: 'google_analytics', status: 'disconnected', lastSync: 'Never', config: { propertyId: '', apiToken: '' } },
      { id: 'seed_gads', name: 'Google Ads', type: 'google_ads', status: 'disconnected', lastSync: 'Never', config: { customerId: '', clientSecret: '' } },
      { id: 'seed_fb', name: 'Facebook Ads', type: 'facebook_ads', status: 'disconnected', lastSync: 'Never', config: { accountId: '', accessToken: '' } },
      { id: 'seed_mysql', name: 'MySQL Database', type: 'database', status: 'disconnected', lastSync: 'Never', config: { host: '', port: '3306', database: '', user: '', password: '' } },
      { id: 'seed_pg', name: 'PostgreSQL Database', type: 'postgresql', status: 'disconnected', lastSync: 'Never', config: { host: '', port: '5432', database: '', user: '', password: '', ssl: 'false' } },
    ];
    fs.writeFileSync(preferredStoreFile, JSON.stringify(seed, null, 2));
  } else {
    // Ensure important seed entries exist (e.g., new providers added later) and normalize bad statuses
    try {
      const raw = fs.readFileSync(preferredStoreFile, 'utf-8');
      const items = JSON.parse(raw) as DataSource[];
      let changed = false;
      if (!items.some(i => i.type === 'postgresql')) {
        items.push({
          id: 'seed_pg',
          name: 'PostgreSQL Database',
          type: 'postgresql' as DataSourceType,
          status: 'disconnected',
          lastSync: 'Never',
          config: { host: '', port: '5432', database: '', user: '', password: '', ssl: 'false' }
        } as any);
        changed = true;
      }
      // Normalize statuses for entries missing required config
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const cfg = it.config || {};
        if (it.type === 'google_analytics') {
          const hasToken = Boolean(String(cfg.apiToken || cfg.credentialsBase64 || cfg.serviceAccountJson || '').trim());
          const hasProp = Boolean(String(cfg.propertyId || '').trim());
          if (!(hasToken && hasProp) && it.status === 'connected') { items[i] = { ...it, status: 'disconnected' }; changed = true; }
        }
        if (it.type === 'database' || it.type === 'postgresql') {
          const hasAll = ['host','port','database','user','password'].every(k => String(cfg[k] || '').trim());
          if (!hasAll && it.status === 'connected') { items[i] = { ...it, status: 'disconnected' }; changed = true; }
        }
      }
      // Merge legacy stores into current when preferred exists but user previously saved elsewhere
      for (const dir of legacyDirs) {
        const legacyFile = path.join(dir, 'data-sources.json');
        if (fs.existsSync(legacyFile)) {
          try {
            const lraw = fs.readFileSync(legacyFile, 'utf-8');
            const litems = JSON.parse(lraw) as DataSource[];
            for (const li of litems) {
              const byId = items.findIndex(i => i.id === li.id);
              if (byId !== -1) {
                // Merge configs favoring non-empty values
                items[byId] = {
                  ...items[byId],
                  name: li.name || items[byId].name,
                  type: (li.type as DataSourceType) || items[byId].type,
                  status: li.status || items[byId].status,
                  config: { ...(items[byId].config || {}), ...(li.config || {}) },
                  lastSync: li.lastSync || items[byId].lastSync,
                } as DataSource;
                changed = true;
              } else {
                // If same type+name exists, merge; else append
                const byTypeName = items.findIndex(i => i.type === li.type && i.name === li.name);
                if (byTypeName !== -1) {
                  items[byTypeName] = {
                    ...items[byTypeName],
                    config: { ...(items[byTypeName].config || {}), ...(li.config || {}) },
                    status: li.status || items[byTypeName].status,
                    lastSync: li.lastSync || items[byTypeName].lastSync,
                  } as DataSource;
                  changed = true;
                } else {
                  items.push(li);
                  changed = true;
                }
              }
            }
          } catch {
            // ignore bad legacy file
          }
        }
      }
      if (changed) fs.writeFileSync(preferredStoreFile, JSON.stringify(items, null, 2));
    } catch {
      // ignore
    }
  }
}

function readAll(): DataSource[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(preferredStoreFile, 'utf-8');
    return JSON.parse(raw) as DataSource[];
  } catch (e) {
    // If JSON is corrupted, back it up and start fresh
    try {
      const corrupted = fs.readFileSync(preferredStoreFile);
      const bak = preferredStoreFile.replace(/\.json$/, '') + `-${Date.now()}.bak.json`;
      fs.writeFileSync(bak, corrupted);
    } catch {
      // ignore
    }
    return [];
  }
}

function writeAll(items: DataSource[]) {
  ensureStore();
  fs.writeFileSync(preferredStoreFile, JSON.stringify(items, null, 2));
}

const SECRET_KEYS = ['accessToken', 'password', 'apiToken', 'clientSecret', 'secret'];

function maskSecrets<T extends Record<string, any>>(config: T): T {
  const clone: Record<string, any> = { ...config };
  for (const key of Object.keys(clone)) {
    if (SECRET_KEYS.includes(key)) {
      const val = String(clone[key] || '');
      clone[key] = val ? '••••••••' : '';
    }
  }
  return clone as T;
}

router.get('/', (req, res) => {
  try {
    const items = readAll().filter(i => !/^seed_/i.test(i.id));
    // Mask secrets in list response
    const safe = items.map(i => ({ ...i, config: maskSecrets(i.config) }));
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to read data sources' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const items = readAll();
    const item = items.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    const includeSecrets = String(req.query.includeSecrets || 'false') === 'true';
    const data = includeSecrets ? item : { ...item, config: maskSecrets(item.config) };
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to read data source' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, config } = req.body || {};
    if (!name || !type || typeof config !== 'object') {
      return res.status(400).json({ success: false, error: 'name, type and config are required' });
    }
    const items = readAll();
    const ds: DataSource = {
      id: 'ds_' + Date.now(),
      name,
      type,
      status: 'unknown',
      lastSync: 'Never',
      config: config || {},
    };
    items.push(ds);
    writeAll(items);
    res.status(201).json({ success: true, data: ds });
  } catch (e: any) {
    console.error('Failed to create data source:', e);
    res.status(500).json({ success: false, error: 'Failed to create data source', message: e?.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  const items = readAll();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  const current = items[idx];
  const updated: DataSource = {
    ...current,
    name: patch.name ?? current.name,
    status: patch.status ?? current.status,
    lastSync: patch.lastSync ?? current.lastSync,
    config: { ...current.config, ...(patch.config || {}) },
  };
  items[idx] = updated;
  writeAll(items);
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const items = readAll();
  const next = items.filter(i => i.id !== id);
  if (next.length === items.length) return res.status(404).json({ success: false, error: 'Not found' });
  writeAll(next);
  res.json({ success: true });
});

router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const items = readAll();
    const item = items.find(i => i.id === id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });

    const result: { status: 'success' | 'failed'; provider: string; checks: { name: string; ok: boolean; message?: string }[] } = {
      status: 'success',
      provider: String(item.type),
      checks: [],
    };

    const cfg = item.config || {};

    function addCheck(name: string, ok: boolean, message?: string) {
      result.checks.push({ name, ok, message });
      if (!ok) result.status = 'failed';
    }

    switch (item.type) {
      case 'google_search_console': {
        const siteUrlOk = /^https?:\/\//.test(String(cfg.siteUrl || ''));
        addCheck('Site URL format', siteUrlOk, siteUrlOk ? undefined : 'Full URL required');
        const cidOk = Boolean((cfg.clientId || '').trim());
        const csecOk = Boolean((cfg.clientSecret || '').trim());
        const rtokOk = Boolean((cfg.refreshToken || '').trim());
        addCheck('OAuth Client ID', cidOk);
        addCheck('OAuth Client Secret', csecOk);
        addCheck('Refresh Token', rtokOk);

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && siteUrlOk && cidOk && csecOk && rtokOk) {
          try {
            const oauth2 = new google.auth.OAuth2(String(cfg.clientId), String(cfg.clientSecret));
            oauth2.setCredentials({ refresh_token: String(cfg.refreshToken) });
            const webmasters = google.webmasters({ version: 'v3', auth: oauth2 });
            const sites = await webmasters.sites.list();
            const found = (sites.data.siteEntry || []).some(se => se.siteUrl === String(cfg.siteUrl));
            addCheck('Live API call', true, found ? 'Site accessible' : 'Site not found in account');
          } catch (e: any) {
            addCheck('Live API call', false, e?.message || 'Failed to query GSC');
          }
        }
        break;
      }
      case 'google_merchant_center': {
        const merchantOk = /^\d{3,}$/.test(String(cfg.merchantId || ''));
        addCheck('Merchant ID', merchantOk, merchantOk ? undefined : 'Numeric Merchant ID');
        const cidOk = Boolean((cfg.clientId || '').trim());
        const csecOk = Boolean((cfg.clientSecret || '').trim());
        const rtokOk = Boolean((cfg.refreshToken || '').trim());
        addCheck('OAuth Client ID', cidOk);
        addCheck('OAuth Client Secret', csecOk);
        addCheck('Refresh Token', rtokOk);

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && merchantOk && cidOk && csecOk && rtokOk) {
          try {
            const oauth2 = new google.auth.OAuth2(String(cfg.clientId), String(cfg.clientSecret));
            oauth2.setCredentials({ refresh_token: String(cfg.refreshToken) });
            const content = google.content({ version: 'v2.1', auth: oauth2 });
            const resp = await content.accounts.get({ merchantId: String(cfg.merchantId), accountId: String(cfg.merchantId) });
            const ok = Boolean(resp.data && resp.status === 200);
            addCheck('Live API call', ok, ok ? 'Merchant accessible' : 'Cannot access merchant');
          } catch (e: any) {
            addCheck('Live API call', false, e?.message || 'Failed to query Merchant Center');
          }
        }
        break;
      }
      case 'bigquery': {
        const projectOk = Boolean((cfg.projectId || '').trim());
        addCheck('Project ID', projectOk);
        const raw = String(cfg.serviceAccount || '').trim();
        const saPresent = Boolean(raw);
        addCheck('Service Account present', saPresent, saPresent ? undefined : 'Paste JSON or Base64');
        let creds: any | null = null;
        if (saPresent) {
          try {
            if (raw.startsWith('{')) creds = JSON.parse(raw); else creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
            addCheck('Service Account JSON', true);
          } catch (e) {
            addCheck('Service Account JSON', false, 'Invalid JSON/Base64');
          }
        }
        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && projectOk && creds) {
          try {
            const auth = new google.auth.GoogleAuth({
              credentials: creds,
              scopes: ['https://www.googleapis.com/auth/bigquery'],
            });
            const bigquery = google.bigquery({ version: 'v2', auth });
            // simple datasets list
            await bigquery.datasets.list({ projectId: String(cfg.projectId), maxResults: 1 });
            addCheck('Live API call', true, 'BigQuery reachable');
          } catch (e: any) {
            addCheck('Live API call', false, e?.message || 'Failed to access BigQuery');
          }
        }
        break;
      }
      case 'google_analytics': {
        const propertyOk = /^\d{3,}$/.test(String(cfg.propertyId || ''));
        addCheck('Property ID format', propertyOk, propertyOk ? undefined : 'Numeric Property ID required');
        const rawToken = String(cfg.apiToken || cfg.credentialsBase64 || cfg.serviceAccountJson || '').trim();
        const tokenPresent = Boolean(rawToken);
        addCheck('API token presence', tokenPresent, tokenPresent ? undefined : 'Service Account JSON or Base64 is required');

        let parsed: any | null = null;
        let parseOk = false;
        if (tokenPresent) {
          try {
            if (rawToken.startsWith('{')) {
              parsed = JSON.parse(rawToken);
            } else {
              const decoded = Buffer.from(rawToken, 'base64').toString('utf-8');
              parsed = JSON.parse(decoded);
            }
            parseOk = true;
          } catch (e) {
            parseOk = false;
          }
          addCheck('Token decodes to JSON', parseOk, parseOk ? undefined : 'Provide full service account JSON or Base64-encoded JSON');

          if (parseOk) {
            const emailOk = Boolean(parsed.client_email);
            const keyOk = Boolean(parsed.private_key);
            addCheck('Service account email', emailOk, emailOk ? undefined : 'Missing client_email');
            addCheck('Private key present', keyOk, keyOk ? undefined : 'Missing private_key');
          }
        }

        // Optional live check (only if requested and prelim checks pass)
        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && propertyOk && parseOk && parsed) {
          try {
            const client = new BetaAnalyticsDataClient({ credentials: parsed });
            const [resp] = await client.runReport({
              property: `properties/${String(cfg.propertyId)}`,
              dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
              metrics: [{ name: 'activeUsers' }],
              limit: 1,
            });
            const ok = Boolean(resp && (resp.rowCount ?? 0) >= 0);
            addCheck('Live API call', ok, ok ? 'GA Data API reachable' : 'No rows returned');
          } catch (e: any) {
            addCheck('Live API call', false, e?.message || 'Failed to query GA Data API');
          }
        }
        break;
      }
      case 'google_ads': {
        const customerIdOk = /^\d{3}-\d{3}-\d{4}$/.test(String(cfg.customerId || ''));
        addCheck('Customer ID format', customerIdOk, customerIdOk ? undefined : 'Format must be xxx-xxx-xxxx');

        const developerTokenOk = Boolean((cfg.developerToken || '').trim());
        addCheck('Developer token', developerTokenOk, developerTokenOk ? undefined : 'Developer token is required');

        const clientIdOk = Boolean((cfg.clientId || '').trim());
        addCheck('Client ID', clientIdOk, clientIdOk ? undefined : 'Client ID is required');

        const clientSecretOk = Boolean((cfg.clientSecret || '').trim());
        addCheck('Client secret', clientSecretOk, clientSecretOk ? undefined : 'Client secret is required');

        const refreshTokenOk = Boolean((cfg.refreshToken || '').trim());
        addCheck('Refresh token', refreshTokenOk, refreshTokenOk ? undefined : 'Refresh token is required');

        // Optional live test
        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && customerIdOk && developerTokenOk && clientIdOk && clientSecretOk && refreshTokenOk) {
          try {
            const client = new GoogleAdsApi({
              client_id: String(cfg.clientId),
              client_secret: String(cfg.clientSecret),
              developer_token: String(cfg.developerToken),
            });
            const customer = client.Customer({
              customer_id: String(cfg.customerId).replace(/-/g, ''),
              refresh_token: String(cfg.refreshToken),
              login_customer_id: cfg.loginCustomerId ? String(cfg.loginCustomerId).replace(/-/g, '') : undefined,
            });
            await customer.query('SELECT customer.id FROM customer LIMIT 1');
            addCheck('Live API call', true, 'Google Ads API reachable');
          } catch (e: any) {
            addCheck('Live API call', false, e?.message || 'Failed to query Google Ads API');
          }
        }
        break;
      }
      case 'shopify': {
        const domainOk = /\.myshopify\.com$/.test(String(cfg.shopDomain || ''));
        addCheck('Shop domain format', domainOk, domainOk ? undefined : 'Domain must end with .myshopify.com');
        const tokenOk = Boolean((cfg.accessToken || '').trim());
        addCheck('Access token presence', tokenOk, tokenOk ? undefined : 'Access token is required');

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && domainOk && tokenOk) {
          await new Promise<void>((resolve) => {
            const reqHttps = https.request(
              {
                method: 'GET',
                hostname: String(cfg.shopDomain),
                path: '/admin/api/2023-10/shop.json',
                headers: {
                  'X-Shopify-Access-Token': String(cfg.accessToken),
                  'Accept': 'application/json',
                  'User-Agent': 'ecommerce-dashboard/ga-live-test'
                },
              },
              (resp) => {
                const ok = resp.statusCode && resp.statusCode >= 200 && resp.statusCode < 300;
                addCheck('Live API call', Boolean(ok), ok ? 'Shopify Admin API reachable' : `HTTP ${resp.statusCode}`);
                // Drain
                resp.on('data', () => {});
                resp.on('end', () => resolve());
              }
            );
            reqHttps.on('error', (err) => {
              addCheck('Live API call', false, err.message);
              resolve();
            });
            reqHttps.end();
          });
        }
        break;
      }
      case 'facebook_ads': {
        const accountOk = /^act_\d+/.test(String(cfg.accountId || ''));
        addCheck('Ad Account ID format', accountOk, accountOk ? undefined : 'Must start with act_');
        const tokenOk = Boolean((cfg.accessToken || '').trim());
        addCheck('Access token presence', tokenOk, tokenOk ? undefined : 'Access token is required');

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && accountOk && tokenOk) {
          await new Promise<void>((resolve) => {
            const urlPath = `/v17.0/${String(cfg.accountId)}?fields=name&access_token=${encodeURIComponent(String(cfg.accessToken))}`;
            const reqHttps = https.request(
              {
                method: 'GET',
                hostname: 'graph.facebook.com',
                path: urlPath,
                headers: { 'User-Agent': 'ecommerce-dashboard/live-test' },
              },
              (resp) => {
                const ok = resp.statusCode && resp.statusCode >= 200 && resp.statusCode < 300;
                addCheck('Live API call', Boolean(ok), ok ? 'Facebook Graph API reachable' : `HTTP ${resp.statusCode}`);
                resp.on('data', () => {});
                resp.on('end', () => resolve());
              }
            );
            reqHttps.on('error', (err) => {
              addCheck('Live API call', false, err.message);
              resolve();
            });
            reqHttps.end();
          });
        }
        break;
      }
      case 'database': {
        const hostOk = Boolean((cfg.host || '').trim());
        const portOk = !isNaN(Number(cfg.port));
        const dbOk = Boolean((cfg.database || '').trim());
        const userOk = Boolean((cfg.user || '').trim());
        const passOk = Boolean((cfg.password || '').trim());
        addCheck('Host present', hostOk);
        addCheck('Port numeric', portOk);
        addCheck('Database present', dbOk);
        addCheck('User present', userOk);
        addCheck('Password present', passOk);

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && hostOk && portOk) {
          await new Promise<void>((resolve) => {
            const socket = net.createConnection({ host: String(cfg.host), port: Number(cfg.port), timeout: 3000 }, () => {
              addCheck('TCP connect', true, 'Port reachable');
              socket.end();
              resolve();
            });
            socket.on('error', (err) => {
              addCheck('TCP connect', false, err.message);
              resolve();
            });
            socket.on('timeout', () => {
              addCheck('TCP connect', false, 'Timeout');
              socket.destroy();
              resolve();
            });
          });
        }
        break;
      }
      case 'postgresql': {
        const hostOk = Boolean((cfg.host || '').trim());
        const portOk = !isNaN(Number(cfg.port || '5432'));
        const dbOk = Boolean((cfg.database || '').trim());
        const userOk = Boolean((cfg.user || '').trim());
        const passOk = Boolean((cfg.password || '').trim());
        addCheck('Host present', hostOk);
        addCheck('Port numeric', portOk);
        addCheck('Database present', dbOk);
        addCheck('User present', userOk);
        addCheck('Password present', passOk);

        const wantLive = String((req.query.live ?? req.body?.live) || 'false') === 'true';
        if (wantLive && hostOk && portOk && dbOk && userOk && passOk) {
          const client = new PGClient({
            host: String(cfg.host),
            port: Number(cfg.port || 5432),
            database: String(cfg.database),
            user: String(cfg.user),
            password: String(cfg.password),
            ssl: String(cfg.ssl || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
          });
          try {
            await client.connect();
            const res = await client.query('SELECT 1');
            const ok = Boolean(res && res.rowCount !== undefined);
            addCheck('Live query', ok, ok ? 'SELECT 1 succeeded' : 'Query failed');
          } catch (e: any) {
            addCheck('Live query', false, e?.message || 'Failed to connect/query PostgreSQL');
          } finally {
            try { await client.end(); } catch {}
          }
        }
        break;
      }
      default: {
        addCheck('Unknown provider', false, 'No test implemented for this provider type');
      }
    }

    return res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to test data source' });
  }
});

export default router;
