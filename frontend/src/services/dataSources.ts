import { DataSource, DataSourceStatus, DataSourceType } from '../types/dataSource';
import api from './api';

type ApiList<T> = { success: boolean; data: T };
type ApiItem<T> = { success: boolean; data: T };

export const dataSourceService = {
  async list(): Promise<DataSource[]> {
    const res = await api.get<ApiList<DataSource[]>>('/data-sources');
    return res.data.data;
  },
  async get(id: string, opts?: { includeSecrets?: boolean }): Promise<DataSource> {
    const includeSecrets = opts?.includeSecrets ? '?includeSecrets=true' : '';
    const res = await api.get<ApiItem<DataSource>>(`/data-sources/${id}${includeSecrets}`);
    return res.data.data;
  },
  async create(input: { name: string; type: DataSourceType; config: Record<string, string> }): Promise<DataSource> {
    const res = await api.post<ApiItem<DataSource>>('/data-sources', input);
    return res.data.data;
  },
  async update(id: string, patch: Partial<Pick<DataSource, 'name' | 'status' | 'config'>>): Promise<DataSource> {
    const res = await api.put<ApiItem<DataSource>>(`/data-sources/${id}`, patch);
    return res.data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/data-sources/${id}`);
  },
  async setStatus(id: string, status: DataSourceStatus): Promise<DataSource> {
    return this.update(id, { status });
  },
  async test(id: string, opts?: { live?: boolean }): Promise<{ status: 'success' | 'failed'; provider: string; checks: { name: string; ok: boolean; message?: string }[] }> {
    const live = opts?.live ? '?live=true' : '';
    const res = await api.post<{ success: boolean; data: any }>(`/data-sources/${id}/test${live}`, {});
    return res.data.data;
  }
}; 

export type { DataSource };
