export type DataSourceType =
  | 'google_analytics'
  | 'google_ads'
  | 'shopify'
  | 'facebook_ads'
  | 'database'
  | 'postgresql'
  | 'google_search_console'
  | 'google_merchant_center'
  | 'bigquery';

export type DataSourceStatus = 'connected' | 'disconnected' | 'unknown';

export interface DataSourceBase {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  lastSync?: string;
  isActive?: boolean;
}

export type ProviderConfig = Record<string, string>;

export interface DataSource extends DataSourceBase {
  config: ProviderConfig;
}

export interface ProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ProviderDefinition {
  id: DataSourceType;
  name: string;
  fields: ProviderField[];
}
