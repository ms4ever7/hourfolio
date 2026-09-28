import { addDays, dayKey, daysBetween, parseDay } from './dates';
import type { Asset, LogEntry, Rhythm } from './types';

/**
 * Two layers per asset:
 * - capital: every minute ever invested. It never goes down.
 * - momentum: recent activity, 0–100. It fades toward a floor but never hits zero,
 *   so an asset on a break is resting, not dying.
 */

export const MOMENTUM_FLOOR = 20;

interface RhythmModel {
  /** Days for a session's weight in momentum to halve. */
  halfLifeDays: number;
  /** Weekly hours that count as "keeping the rhythm". */
  targetHoursPerWeek: number;
  /** Days without a session before the asset reads as paused. */
  pauseAfterDays: number;
}

export const RHYTHM_MODEL: Record<Rhythm, RhythmModel> = {
  daily: { halfLifeDays: 3, targetHoursPerWeek: 5, pauseAfterDays: 7 },
  fewPerWeek: { halfLifeDays: 5, targetHoursPerWeek: 3, pauseAfterDays: 10 },
  weekly: { halfLifeDays: 10, targetHoursPerWeek: 1.5, pauseAfterDays: 21 },
  whenever: { halfLifeDays: 21, targetHoursPerWeek: 0.5, pauseAfterDays: Infinity },
};

/** Momentum an asset reaches when the user steadily keeps its rhythm. */
const STEADY_MOMENTUM = 70;

export function capitalMinutes(asset: Asset, logs: LogEntry[]): number {
  return logs.reduce((sum, l) => (l.assetId === asset.id ? sum + l.minutes : sum), asset.startingMinutes);
}

export function momentum(asset: Asset, logs: LogEntry[], today: Date): number {
  const model = RHYTHM_MODEL[asset.rhythm];
  const decay = Math.LN2 / model.halfLifeDays;
  let weighted = 0;
  for (const l of logs) {
    if (l.assetId !== asset.id) continue;
    const age = daysBetween(parseDay(l.day), today);
    if (age < 0) continue;
    weighted += (l.minutes / 60) * Math.exp(-decay * age);
  }
  // Weighted hours when logging the target rate forever: rate/day × mean lifetime.
  const steady = (model.targetHoursPerWeek / 7) / decay;
  const k = -Math.log(1 - STEADY_MOMENTUM / 100) / steady;
  const fill = 1 - Math.exp(-k * weighted);
  return Math.round(MOMENTUM_FLOOR + (100 - MOMENTUM_FLOOR) * fill);
}

export type Trend = 'new' | 'growing' | 'steady' | 'paused';

export function trend(asset: Asset, logs: LogEntry[], today: Date): Trend {
  const own = logs.filter((l) => l.assetId === asset.id);
  const last = lastLogDay(asset.id, own);
  if (last === null) return 'new';
  if (daysBetween(parseDay(last), today) >= RHYTHM_MODEL[asset.rhythm].pauseAfterDays) return 'paused';
  const weekAgo = addDays(today, -7);
  const before = momentum(asset, own.filter((l) => l.day <= dayKey(weekAgo)), weekAgo);
  return momentum(asset, own, today) - before >= 5 ? 'growing' : 'steady';
}

export function lastLogDay(assetId: string, logs: LogEntry[]): string | null {
  let last: string | null = null;
  for (const l of logs) if (l.assetId === assetId && (last === null || l.day > last)) last = l.day;
  return last;
}

const MILESTONES_H = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

export interface Milestone {
  /** Next milestone, in hours. */
  next: number;
  /** 0–1 from the previous milestone to the next. */
  progress: number;
  toGoMinutes: number;
}

export function nextMilestone(capital: number): Milestone {
  const next = MILESTONES_H.find((m) => m * 60 > capital) ?? (Math.floor(capital / 60 / 10000) + 1) * 10000;
  const prev = [...MILESTONES_H].reverse().find((m) => m * 60 <= capital && m < next) ?? 0;
  return { next, progress: (capital - prev * 60) / ((next - prev) * 60), toGoMinutes: next * 60 - capital };
}

/** Weeks to the milestone at the given weekly pace; null when there is no pace yet. */
export function weeksTo(toGoMinutes: number, weeklyMinutes: number): number | null {
  return weeklyMinutes > 0 ? Math.ceil(toGoMinutes / weeklyMinutes) : null;
}
