// ===========================================
// Otantist Shared Constants
// ===========================================

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export const DEFAULT_LANGUAGE = 'fr';

export const AGE_GROUPS = ['14-17', '18-25', '26-40', '40+'] as const;

export const TONE_PREFERENCES = ['gentle', 'direct', 'enthusiastic', 'formal'] as const;

export const COMMUNICATION_MODES = [
  'text',
  'emoji',
  'voice', // Phase 2
  'pictogram', // Phase 2
] as const;

export const DEFAULT_TIMEZONE = 'America/Montreal';

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const INVITE_CODE_LENGTH = 8;

// Rate limits
export const MAX_MESSAGES_PER_MINUTE = 20;
export const MAX_CONVERSATIONS_PER_DAY = 10;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Time boundaries
export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

// AI Moderation
export const AI_CONFIDENCE_THRESHOLD = 0.7;
export const AI_FLAG_PRIORITY_THRESHOLDS = {
  urgent: 0.95,
  high: 0.85,
  medium: 0.7,
  low: 0.5,
} as const;
