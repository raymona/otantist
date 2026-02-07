import { request } from './api';
import type { UserState, CalmModeResponse, SocialEnergyLevel } from './types';

export const stateApi = {
  getCurrent: () => request<UserState>('/api/state/current', { method: 'GET' }),

  updateSocialEnergy: (level: SocialEnergyLevel) =>
    request<UserState>('/api/state/social-energy', {
      method: 'PATCH',
      body: { level },
    }),

  activateCalmMode: () =>
    request<CalmModeResponse>('/api/state/calm-mode/activate', {
      method: 'POST',
    }),

  deactivateCalmMode: () =>
    request<CalmModeResponse>('/api/state/calm-mode/deactivate', {
      method: 'POST',
    }),
};
