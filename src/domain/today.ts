import { addDays, dayKey } from './dates';
import type { Asset, LogEntry } from './types';
import { RECOVERY_ID } from './types';

/** How far back "what you usually do" looks for the quick-log chips. */
const RECENT_DAYS = 28;

/**
 * Assets for the one-tap log chips: the ones logged most often lately, then the
 * rest in portfolio order. Recovery has its own chip, so it is left out.
 */
export function quickAssets(assets: Asset[], logs: LogEntry[], today: Date, count: number): Asset[] {
  const since = dayKey(addDays(today, -RECENT_DAYS));
  const sessions = new Map<string, number>();
  for (const l of logs) if (l.day >= since) sessions.set(l.assetId, (sessions.get(l.assetId) ?? 0) + 1);
  return assets
    .filter((a) => a.id !== RECOVERY_ID)
    .map((a, i) => ({ a, i, n: sessions.get(a.id) ?? 0 }))
    .sort((x, y) => y.n - x.n || x.i - y.i)
    .slice(0, count)
    .map((x) => x.a);
}

/** Today's sessions, newest first. */
export function todaysSessions(logs: LogEntry[], today: Date): LogEntry[] {
  const key = dayKey(today);
  return logs.filter((l) => l.day === key).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Today's minutes per asset, the most recently logged asset first, with each entry's minutes oldest first (20 then 10). */
export function minutesByAsset(sessions: LogEntry[]): { assetId: string; minutes: number; parts: number[] }[] {
  const out = new Map<string, number[]>();
  // `sessions` is newest first, so walking it backwards gives each asset's entries oldest first.
  for (const l of [...sessions].reverse()) out.set(l.assetId, [...(out.get(l.assetId) ?? []), l.minutes]);
  return sessions
    .map((l) => l.assetId)
    .filter((id, i, all) => all.indexOf(id) === i)
    .map((assetId) => {
      const parts = out.get(assetId) ?? [];
      return { assetId, minutes: parts.reduce((n, m) => n + m, 0), parts };
    });
}

const LOG_STEP = 15;
const MIN_LOG = 5;
const MAX_LOG = 24 * 60;

/** A log entry's length after a step up or down: quarter-hour steps, never under 5 minutes (a 5 or 10 minute entry can be logged) and never cut short by a cap. */
export function logResized(minutes: number, direction: 1 | -1): number {
  return Math.min(Math.max(MAX_LOG, minutes), Math.max(MIN_LOG, minutes + direction * LOG_STEP));
}
