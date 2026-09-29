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

/** Today's minutes per asset, the most recently logged asset first. */
export function minutesByAsset(sessions: LogEntry[]): { assetId: string; minutes: number }[] {
  const out = new Map<string, number>();
  for (const l of sessions) out.set(l.assetId, (out.get(l.assetId) ?? 0) + l.minutes);
  return [...out].map(([assetId, minutes]) => ({ assetId, minutes }));
}
