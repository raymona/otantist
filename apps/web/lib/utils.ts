import type { TFunction } from 'i18next';

// Accepts a t() function so all strings come from translation files.
// Usage: formatRelativeTime(dateString, t) where t is from useTranslation('common')
export function formatRelativeTime(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return t('common:time.just_now');
  }
  if (diffMin < 60) {
    return t('common:time.minutes_ago', { count: diffMin });
  }
  if (diffHr < 24) {
    return t('common:time.hours_ago', { count: diffHr });
  }
  if (diffDay < 7) {
    return t('common:time.days_ago', { count: diffDay });
  }

  const lang = t('common:locale_code', { defaultValue: 'en-CA' });
  return date.toLocaleDateString(lang);
}
