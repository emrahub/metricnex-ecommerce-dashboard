import api from './api';

export type QualityItem = {
  id: string;
  name: string;
  type: string;
  status: 'ok' | 'warn' | 'error';
  checks: { name: string; ok: boolean; message?: string }[];
};

export const qualityService = {
  async overview(): Promise<QualityItem[]> {
    const res = await api.get<{ success: boolean; data: QualityItem[] }>('/quality/overview');
    return res.data.data;
  }
};

