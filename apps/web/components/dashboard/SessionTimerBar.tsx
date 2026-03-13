'use client';

import { useTranslation } from 'react-i18next';
import type { TimerDuration, TimerStatus } from '@/lib/use-session-timer';

interface SessionTimerBarProps {
  duration: TimerDuration;
  status: TimerStatus;
  secondsLeft: number;
  onSelectDuration: (d: TimerDuration) => void;
  onDismissBreak: () => void;
}

const DURATIONS: TimerDuration[] = [15, 20, 25, 30];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimerBar({
  duration,
  status,
  secondsLeft,
  onSelectDuration,
  onDismissBreak,
}: SessionTimerBarProps) {
  const { t } = useTranslation('dashboard');

  // Not running — show duration preset buttons
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <svg
          className="h-5 w-5 flex-shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-600">{t('timer.set_timer')}</span>
        <div className="flex items-center gap-1.5">
          {DURATIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDuration(d)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {t('timer.duration_min', { count: d })}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Expired
  if (status === 'expired') {
    return (
      <div
        role="timer"
        aria-live="assertive"
        className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5"
      >
        <svg
          className="h-5 w-5 flex-shrink-0 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-semibold text-red-700">{t('timer.expired')}</span>
        <span className="text-sm text-red-600">{t('timer.take_a_break')}</span>
      </div>
    );
  }

  // Running / warning states
  const colorClass =
    status === 'warning1'
      ? 'border-red-200 bg-red-50'
      : status === 'warning5'
        ? 'border-amber-200 bg-amber-50'
        : 'border-blue-200 bg-blue-50';

  const textClass =
    status === 'warning1'
      ? 'text-red-700'
      : status === 'warning5'
        ? 'text-amber-700'
        : 'text-blue-700';

  const labelClass =
    status === 'warning1'
      ? 'text-red-500'
      : status === 'warning5'
        ? 'text-amber-500'
        : 'text-blue-500';

  return (
    <div
      role="timer"
      aria-live={status === 'warning1' ? 'assertive' : 'off'}
      aria-label={t('timer.aria_label', { time: formatTime(secondsLeft) })}
      className={`flex items-center gap-3 border-b px-4 py-2.5 ${colorClass}`}
    >
      <svg
        className={`h-5 w-5 flex-shrink-0 ${labelClass}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <span className={`text-lg font-bold tabular-nums ${textClass}`}>
        {formatTime(secondsLeft)}
      </span>

      <span className={`text-sm ${labelClass}`}>
        {status === 'warning1'
          ? t('timer.almost_done')
          : status === 'warning5'
            ? t('timer.winding_down')
            : t('timer.session')}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {/* Switch to a different duration */}
        {DURATIONS.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => onSelectDuration(d)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              d === duration
                ? `${textClass} border-current bg-white`
                : 'border-gray-300 bg-white/50 text-gray-500 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            {t('timer.duration_min', { count: d })}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelectDuration(0)}
          className="rounded-lg border border-gray-300 bg-white/50 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
        >
          {t('timer.stop')}
        </button>
      </div>
    </div>
  );
}
