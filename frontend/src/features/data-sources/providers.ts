import { ProviderDefinition } from '../../types/dataSource';

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    fields: [
      { key: 'propertyId', label: 'Property ID', type: 'text', required: true, placeholder: 'e.g. 123456789', helpText: 'GA4 → Admin → Property Settings → Property ID (numeric)' },
      { key: 'apiToken', label: 'Service Account (JSON/Base64)', type: 'textarea', required: true, placeholder: '{ "type": "service_account", ... } or Base64', helpText: 'Google Cloud → IAM & Admin → Service Accounts → Keys → Create new key (JSON). Paste full JSON or its Base64. Then add the service account email to GA4 (Property Access Management).' },
    ],
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    fields: [
      { key: 'customerId', label: 'Customer ID', type: 'text', required: false, placeholder: 'e.g. 123-456-7890', helpText: 'Your Ads account ID. Remove dashes for API calls; keep format here.' },
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: false, placeholder: 'Google Ads Developer Token', helpText: 'Google Ads MCC → Tools & Settings → API Center → Developer token' },
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: false, placeholder: 'OAuth2 Client ID', helpText: 'Google Cloud Console → Credentials → OAuth 2.0 Client IDs' },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: false, placeholder: 'OAuth2 Client Secret', helpText: 'Google Cloud Console → Credentials → OAuth 2.0 Client IDs' },
      { key: 'refreshToken', label: 'OAuth Refresh Token', type: 'password', required: false, placeholder: 'OAuth2 Refresh Token', helpText: 'Obtain via OAuth consent flow with scope https://www.googleapis.com/auth/adwords and access_type=offline' },
      { key: 'loginCustomerId', label: 'Login Customer ID (optional)', type: 'text', required: false, placeholder: 'e.g. 123-456-7890', helpText: 'Manager account ID used to authenticate (if applicable).' },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify Store',
    fields: [
      { key: 'shopDomain', label: 'Shop Domain', type: 'text', required: true, placeholder: 'your-shop.myshopify.com', helpText: 'Store URL ending with .myshopify.com' },
      { key: 'accessToken', label: 'Admin API Access Token', type: 'password', required: true, placeholder: 'shpat_...', helpText: 'Shopify Admin → Apps → Develop apps → Configure Admin API scopes → Install app → Reveal Admin API access token' },
    ],
  },
  {
    id: 'facebook_ads',
    name: 'Facebook Ads',
    fields: [
      { key: 'accountId', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_123456789', helpText: 'Business Manager → Ad Accounts. Must start with act_.' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'EAAB...', helpText: 'System user long‑lived token with ads_read. Business Settings → System Users.' },
    ],
  },
  {
    id: 'database',
    name: 'MySQL Database',
    fields: [
      { key: 'host', label: 'Host', type: 'text', required: true, placeholder: '127.0.0.1', helpText: 'Database hostname or IP' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '3306', helpText: 'Default MySQL port 3306' },
      { key: 'database', label: 'Database', type: 'text', required: true, placeholder: 'e.g. ecommerce', helpText: 'Database/schema name' },
      { key: 'user', label: 'User', type: 'text', required: true, placeholder: 'db_user', helpText: 'User with read permissions' },
      { key: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••', helpText: 'User password' },
    ],
  },
];

export const providerById = (id: string) => PROVIDERS.find(p => p.id === id);
