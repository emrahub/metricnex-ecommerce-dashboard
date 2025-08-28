import axios from 'axios';

// Resolve API base URL with sensible fallbacks
// Priority:
// 1) VITE_API_BASE_URL (e.g. http://localhost:3000/api)
// 2) Same-origin '/api' (if running behind a reverse proxy)
// 3) http://localhost:3000/api (dev default)
const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
const sameOrigin = `${window.location.origin}/api`;
const defaultDev = 'http://localhost:3000/api';
const baseURL = envBase || sameOrigin || defaultDev;

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Re-export common API types for convenience
export type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  Report, 
  ReportCategory 
} from '../types';
