// Shared TypeScript interfaces for both frontend and backend

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  category?: ReportCategory;
  type: 'sales' | 'inventory' | 'customer' | 'financial' | 'marketing' | 'operational';
  format: 'pdf' | 'excel' | 'html' | 'json';
  status: 'draft' | 'published' | 'archived';
  data: Record<string, any>;
  metadata: ReportMetadata;
  filePath?: string;
  fileSize?: number;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportMetadata {
  generatedAt?: string;
  timeRange?: DateRange;
  filters?: Filter[];
  totalRecords?: number;
  executionTime?: number;
  version?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
  value: any;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  type: string;
  templateConfig: Record<string, any>;
  isActive: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  scheduleConfig: {
    cron: string;
    timezone: string;
    enabled: boolean;
  };
  deliveryConfig?: {
    email?: {
      recipients: string[];
      subject?: string;
      message?: string;
    };
    formats: string[];
  };
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'shopify' | 'woocommerce' | 'api' | 'database' | 'csv' | 'json';
  connectionConfig: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: string;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface CreateReportRequest {
  title: string;
  description?: string;
  categoryId?: string;
  type: string;
  format: string;
  templateId?: string;
  filters?: Filter[];
  timeRange?: DateRange;
}

// Dashboard types
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

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}