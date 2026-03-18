import { request } from '../api';

export type TonePreference = 'gentle' | 'direct' | 'enthusiastic' | 'formal';
export type ColorIntensity = 'standard' | 'reduced' | 'minimal';

export interface CommunicationPrefs {
  commModes: string[];
  preferredTone?: TonePreference | null;
  slowRepliesOk?: boolean | null;
  oneMessageAtTime?: boolean | null;
  readWithoutReply?: boolean | null;
  sectionComplete: boolean;
}

export interface UpdateCommunicationPrefs {
  commModes?: string[];
  preferredTone?: TonePreference;
  slowRepliesOk?: boolean;
  oneMessageAtTime?: boolean;
  readWithoutReply?: boolean;
  sectionComplete?: boolean;
}

export interface SensoryPrefs {
  enableAnimations: boolean;
  colorIntensity?: ColorIntensity | null;
  soundEnabled: boolean;
  notificationLimit?: number | null;
  notificationGrouped: boolean;
  sectionComplete: boolean;
}

export interface UpdateSensoryPrefs {
  enableAnimations?: boolean;
  colorIntensity?: ColorIntensity;
  soundEnabled?: boolean;
  notificationLimit?: number;
  notificationGrouped?: boolean;
  sectionComplete?: boolean;
}

export interface ConversationStarters {
  goodTopics: string[];
  avoidTopics: string[];
  interactionTips: string[];
  sectionComplete: boolean;
}

export interface UpdateConversationStarters {
  goodTopics?: string[];
  avoidTopics?: string[];
  interactionTips?: string[];
  sectionComplete?: boolean;
}

export interface TimeBoundary {
  dayOfWeek: number;
  availableStart: string;
  availableEnd: string;
  isActive: boolean;
  timezone?: string;
}

export interface TimeBoundariesResponse {
  boundaries: TimeBoundary[];
}

export const preferencesApi = {
  getCommunication: () =>
    request<CommunicationPrefs>('/api/preferences/communication', {
      method: 'GET',
    }),

  updateCommunication: (data: UpdateCommunicationPrefs) =>
    request<CommunicationPrefs>('/api/preferences/communication', {
      method: 'PATCH',
      body: data,
    }),

  getSensory: () =>
    request<SensoryPrefs>('/api/preferences/sensory', {
      method: 'GET',
    }),

  updateSensory: (data: UpdateSensoryPrefs) =>
    request<SensoryPrefs>('/api/preferences/sensory', {
      method: 'PATCH',
      body: data,
    }),

  getConversationStarters: () =>
    request<ConversationStarters>('/api/preferences/conversation-starters', {
      method: 'GET',
    }),

  updateConversationStarters: (data: UpdateConversationStarters) =>
    request<ConversationStarters>('/api/preferences/conversation-starters', {
      method: 'PATCH',
      body: data,
    }),

  getTimeBoundaries: () =>
    request<TimeBoundariesResponse>('/api/preferences/time-boundaries', {
      method: 'GET',
    }),

  updateTimeBoundaries: (boundaries: TimeBoundary[]) =>
    request<TimeBoundariesResponse>('/api/preferences/time-boundaries', {
      method: 'PUT',
      body: {
        boundaries: boundaries.filter(b => b.isActive).map(({ isActive: _, ...rest }) => rest),
      },
    }),
};
