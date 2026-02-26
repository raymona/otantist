'use client';

import { useTranslation } from 'react-i18next';
import type { TimerDuration, TimerStatus } from '@/lib/use-session-timer';

interface SessionTimerBarProps {
  duration: TimerDuration;
  status: TimerStatus;
  secondsLeft: number;
  onChangeDuration: (d: TimerDuration) => void;
  onReset: () => void;
}

const DURATIONS: TimerDuration[] = [0, 15, 20, 25, 30];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimerBar({
  duration,
  status,
  secondsLeft,
  onChangeDuration,
  onReset,
}: SessionTimerBarProps) {
  const { t } = useTranslation('dashboard');

  if (status === 'idle') {
    // Timer not yet started — show duration selector
    return (
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
        <svg
          className="h-3.5 w-3.5 flex-shrink-0"
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
        <span>{duration === 0 ? t('timer.off') : t('timer.session')}</span>
        <TimerSelector duration={duration} onChangeDuration={onChangeDuration} />
      </div>
    );
  }

  const colorClass =
    status === 'expired'
      ? 'bg-red-50 border-red-200 text-red-800'
      : status === 'warning1'
        ? 'bg-red-50 border-red-200 text-red-700'
        : status === 'warning5'
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div
      role="timer"
      aria-live={status === 'warning1' || status === 'expired' ? 'assertive' : 'off'}
      aria-label={t('timer.aria_label', { time: formatTime(secondsLeft) })}
      className={`flex items-center gap-2 border-t px-3 py-1.5 text-xs ${colorClass}`}
    >
      <svg
        className="h-3.5 w-3.5 flex-shrink-0"
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

      {status === 'expired' ? (
        <span className="font-medium">{t('timer.expired')}</span>
      ) : (
        <span className="font-medium tabular-nums">{formatTime(secondsLeft)}</span>
      )}

      <span className="text-gray-500">
        {status === 'expired'
          ? t('timer.take_a_break')
          : status === 'warning1'
            ? t('timer.almost_done')
            : status === 'warning5'
              ? t('timer.winding_down')
              : t('timer.session')}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <TimerSelector duration={duration} onChangeDuration={onChangeDuration} />
        {status !== 'expired' && (
          <button type="button" onClick={onReset} className="text-xs underline hover:no-underline">
            {t('timer.reset')}
          </button>
        )}
        {status === 'expired' && (
          <button
            type="button"
            onClick={onReset}
            className="rounded bg-white px-2 py-0.5 text-xs font-medium shadow-sm hover:bg-gray-50"
          >
            {t('timer.start_new')}
          </button>
        )}
      </div>
    </div>
  );
}

function TimerSelector({
  duration,
  onChangeDuration,
}: {
  duration: TimerDuration;
  onChangeDuration: (d: TimerDuration) => void;
}) {
  const { t } = useTranslation('dashboard');

  return (
    <select
      value={duration}
      onChange={e => onChangeDuration(Number(e.target.value) as TimerDuration)}
      aria-label={t('timer.duration_label')}
      className="rounded border border-current/20 bg-transparent px-1 py-0 text-xs leading-tight focus:outline-none"
    >
      {DURATIONS.map(d => (
        <option key={d} value={d}>
          {d === 0 ? t('timer.duration_off') : t('timer.duration_min', { count: d })}
        </option>
      ))}
    </select>
  );
}
