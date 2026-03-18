import { request } from '../api';

export const feedbackApi = {
  submit: (data: { name: string; message: string; category?: string }) =>
    request<{ sent: boolean }>('/api/feedback', {
      method: 'POST',
      body: data,
    }),
};
