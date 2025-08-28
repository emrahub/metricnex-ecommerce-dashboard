import api from './api';

export type Schedule = {
  id: string;
  name: string;
  cron: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  task: { type: string; config: Record<string, any> };
  notify?: { slackWebhookUrl?: string; emails?: string[] };
  createdAt: string;
  updatedAt: string;
};

export const schedulingService = {
  async list(): Promise<Schedule[]> {
    const res = await api.get<{ success: boolean; data: Schedule[] }>('/scheduling');
    return res.data.data;
  },
  async create(input: { name: string; cron: string; isActive?: boolean; task: { type: string; config?: Record<string, any> }; notify?: { slackWebhookUrl?: string; emails?: string[] } }): Promise<Schedule> {
    const res = await api.post<{ success: boolean; data: Schedule }>('/scheduling', input);
    return res.data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/scheduling/${id}`);
  },
  async testRun(id: string): Promise<{ runId: string; at: string; slack?: { status: string; message?: string } }> {
    const res = await api.post<{ success: boolean; data: any }>(`/scheduling/${id}/test-run`, {});
    return res.data.data;
  }
};

