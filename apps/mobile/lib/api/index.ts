export { authApi } from './auth';
export type { RegisterData, LoginData, AuthResponse, User } from './auth';

export { usersApi } from './users';
export type {
  AgeGroup,
  ProfileVisibility,
  UpdateProfileData,
  OnboardingStatus,
  HowToTalkToMe,
} from './users';

export { preferencesApi } from './preferences';
export type {
  TonePreference,
  ColorIntensity,
  CommunicationPrefs,
  UpdateCommunicationPrefs,
  SensoryPrefs,
  UpdateSensoryPrefs,
  ConversationStarters,
  UpdateConversationStarters,
  TimeBoundary,
  TimeBoundariesResponse,
} from './preferences';

export { messagingApi } from './messaging';
export { stateApi } from './state';
export { safetyApi } from './safety';
export { parentApi } from './parent';
export type {
  ManagedMember,
  MemberIndicator,
  ParentAlert,
  GenerateCodeResponse,
  LinkToParentResponse,
} from './parent';

export { moderationApi } from './moderation';
export type { ModerationQueueItem, ModerationStats, ResolveData } from './moderation';

export { adminApi } from './admin';
export type { AdminUser, InviteCode } from './admin';

export { feedbackApi } from './feedback';
