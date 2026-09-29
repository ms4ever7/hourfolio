import { addDays, dayKey } from './dates';
import { momentum } from './growth';
import type { Asset, LogEntry } from './types';
import { RECOVERY_ID } from './types';

/** Times of day are minutes after midnight. */
export const DEFAULT_WAKE = 7 * 60;
export const DEFAULT_BED = 23 * 60;

/** The evening check-in comes this long before bedtime. */
export const CHECK_IN_BEFORE_BED = 60;

/** How many evenings ahead to schedule, so it still works if the app isn't opened for a few days. */
export const CHECK_IN_DAYS = 7;

export function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

/**
 * Evenings for the check-in: from tonight, one hour before bed, for a week.
 * Tonight is skipped once something is logged today, or when its time has passed.
 * A check-in after midnight (bed at 01:30 means 00:30) still belongs to the
 * evening before, so it lands on the next calendar day; and between midnight and
 * that time, "today" for logging is still yesterday.
 */
export function checkInTimes(now: Date, bed: number, logs: LogEntry[]): Date[] {
  const at = (bed - CHECK_IN_BEFORE_BED + 24 * 60) % (24 * 60);
  const afterMidnight = at < 12 * 60;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // The evening we are in: yesterday's, if it is past midnight but before its check-in.
  const tonight = afterMidnight && nowMinutes < at ? addDays(today, -1) : today;
  const loggedTonight = logs.some((l) => l.day === dayKey(tonight));
  const out: Date[] = [];
  for (let i = 0; i < CHECK_IN_DAYS; i++) {
    const evening = addDays(tonight, i);
    const when = atMinutes(afterMidnight ? addDays(evening, 1) : evening, at);
    if (i === 0 && (loggedTonight || when <= now)) continue;
    out.push(when);
  }
  return out;
}

/**
 * Something worth suggesting in the evening: the asset whose momentum is lowest,
 * so it has rested the longest for its rhythm. Recovery and "whenever" assets
 * are left out; they are never behind on anything.
 */
export function restingAsset(assets: Asset[], logs: LogEntry[], today: Date): Asset | null {
  let best: { asset: Asset; m: number } | null = null;
  for (const asset of assets) {
    if (asset.id === RECOVERY_ID || asset.rhythm === 'whenever') continue;
    const m = momentum(asset, logs, today);
    if (!best || m < best.m) best = { asset, m };
  }
  return best?.asset ?? null;
}

export function formatClock(minutes: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(atMinutes(new Date(2026, 0, 1), minutes));
}
