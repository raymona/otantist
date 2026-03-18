import { request } from '../api';
import type { UserDirectoryResponse } from '../types';
import type { User } from './auth';

export type AgeGroup = 'age_14_17' | 'age_18_25' | 'age_26_40' | 'age_40_plus';
export type ProfileVisibility = 'visible' | 'limited' | 'hidden';

export interface UpdateProfileData {
  displayName?: string;
  ageGroup?: AgeGroup;
  profileVisibility?: ProfileVisibility;
}

export interface OnboardingStatus {
  complete: boolean;
  currentStep?: string | null;
  steps: {
    emailVerified: boolean;
    legalAccepted: boolean;
    basicProfile: boolean;
    communicationPrefs: boolean;
    sensoryPrefs: boolean;
    conversationStarters: boolean;
  };
}

export interface HowToTalkToMe {
  displayName: string | null;
  preferredTone?: string | null;
  commModes: string[];
  slowRepliesOk?: boolean | null;
  oneMessageAtTime?: boolean | null;
  readWithoutReply?: boolean | null;
  goodTopics: string[];
  avoidTopics: string[];
  interactionTips: string[];
}

export const usersApi = {
  getMe: () => request<User>('/api/users/me', { method: 'GET' }),

  updateProfile: (data: UpdateProfileData) =>
    request<User>('/api/users/me', {
      method: 'PATCH',
      body: data,
    }),

  getOnboardingStatus: () =>
    request<OnboardingStatus>('/api/users/me/onboarding-status', {
      method: 'GET',
    }),

  updateLanguage: (language: 'fr' | 'en') =>
    request<{ language: string }>('/api/users/me/language', {
      method: 'PATCH',
      body: { language },
    }),

  getDirectory: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<UserDirectoryResponse>(`/api/users/directory${params}`, {
      method: 'GET',
    });
  },

  getHowToTalkToMe: (userId: string) =>
    request<HowToTalkToMe>(`/api/users/${userId}/how-to-talk-to-me`, {
      method: 'GET',
    }),
};
