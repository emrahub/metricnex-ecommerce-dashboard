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
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  expiresIn: number;
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: string;
  format: string;
  status: string;
  category?: {
    name: string;
    color: string;
  };
  createdAt: string;
  createdBy: string;
  fileSize?: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

export interface GoogleAnalyticsReport {
  dimensionHeaders: { name: string }[];
  metricHeaders: { name: string; type: string }[];
  rows: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  rowCount: number;
  metadata: any;
  kind: string;
}
