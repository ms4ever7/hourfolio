import { addDays, dayKey, daysInMonth, startOfMonth, startOfWeek, weekdayMonFirst } from './dates';
import type { Asset, EnergyType, LogEntry } from './types';
import { ENERGY_TYPES, RECOVERY_ID } from './types';

export type Period = 'week' | 'month' | 'year' | 'all';

export interface Range {
  /** Inclusive day keys. */
  from: string;
  to: string;
}

const inRange = (l: LogEntry, r: Range) => l.day >= r.from && l.day <= r.to;

export function sumMinutes(logs: LogEntry[], range: Range, assetId?: string): number {
  let total = 0;
  for (const l of logs) if (inRange(l, range) && (!assetId || l.assetId === assetId)) total += l.minutes;
  return total;
}

/**
 * The period so far, plus the whole previous period to compare against.
 * Week = Monday to today; month = the 1st to today; year = Jan 1 to today.
 */
export function periodRanges(period: Period, today: Date, logs: LogEntry[]): { current: Range; previous: Range | null } {
  const to = dayKey(today);
  if (period === 'week') {
    const start = startOfWeek(today);
    return {
      current: { from: dayKey(start), to },
      previous: { from: dayKey(addDays(start, -7)), to: dayKey(addDays(start, -1)) },
    };
  }
  if (period === 'month') {
    const start = startOfMonth(today);
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    return {
      current: { from: dayKey(start), to },
      previous: { from: dayKey(prevStart), to: dayKey(addDays(start, -1)) },
    };
  }
  if (period === 'year') {
    const y = today.getFullYear();
    return {
      current: { from: `${y}-01-01`, to },
      previous: { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` },
    };
  }
  const first = logs.reduce((min, l) => (l.day < min ? l.day : min), to);
  return { current: { from: first, to }, previous: null };
}

/** Cumulative hours per day across a range: one point per day. */
export function cumulativeHours(logs: LogEntry[], from: Date, days: number): number[] {
  const perDay = new Map<string, number>();
  for (const l of logs) perDay.set(l.day, (perDay.get(l.day) ?? 0) + l.minutes);
  const out: number[] = [];
  let running = 0;
  for (let i = 0; i < days; i++) {
    running += perDay.get(dayKey(addDays(from, i))) ?? 0;
    out.push(running / 60);
  }
  return out;
}

export interface Slice {
  assetId: string | 'other';
  minutes: number;
  share: number;
}

/** Minutes per asset in a range, largest first; everything past `top` is folded into "other". */
export function allocation(logs: LogEntry[], range: Range, top = 5): Slice[] {
  const per = new Map<string, number>();
  for (const l of logs) if (inRange(l, range)) per.set(l.assetId, (per.get(l.assetId) ?? 0) + l.minutes);
  const total = [...per.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const sorted = [...per.entries()].sort((a, b) => b[1] - a[1]);
  const slices: Slice[] = sorted.slice(0, top).map(([assetId, minutes]) => ({ assetId, minutes, share: minutes / total }));
  const rest = sorted.slice(top).reduce((a, [, m]) => a + m, 0);
  if (rest > 0) slices.push({ assetId: 'other', minutes: rest, share: rest / total });
  return slices;
}

export function energyBalance(assets: Asset[], logs: LogEntry[], range: Range): Record<EnergyType, number> {
  const energyOf = new Map(assets.map((a) => [a.id, a.energy]));
  const out = Object.fromEntries(ENERGY_TYPES.map((e) => [e, 0])) as Record<EnergyType, number>;
  for (const l of logs) {
    const e = energyOf.get(l.assetId);
    if (e && inRange(l, range)) out[e] += l.minutes;
  }
  return out;
}

/** Minutes per week for the last `weeks` weeks, oldest first, ending with the current week. */
export function weeklyMinutes(logs: LogEntry[], assetId: string, weeks: number, today: Date): number[] {
  const thisWeek = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    return sumMinutes(logs, { from: dayKey(start), to: dayKey(addDays(start, 6)) }, assetId);
  });
}

export interface HeatDay {
  day: string;
  date: number;
  minutes: number;
  /** Only recovery was logged: shown as a rest day, not as a gap. */
  restOnly: boolean;
  future: boolean;
  today: boolean;
}

/** Month grid starting on Monday; `null` pads the first and last week. */
export function monthHeatmap(logs: LogEntry[], month: Date, today: Date): (HeatDay | null)[] {
  const start = startOfMonth(month);
  const n = daysInMonth(month);
  const todayKey = dayKey(today);
  const cells: (HeatDay | null)[] = Array.from({ length: weekdayMonFirst(start) }, () => null);
  for (let i = 0; i < n; i++) {
    const key = dayKey(addDays(start, i));
    const dayLogs = logs.filter((l) => l.day === key);
    const minutes = dayLogs.reduce((a, l) => a + (l.assetId === RECOVERY_ID ? 0 : l.minutes), 0);
    cells.push({
      day: key,
      date: i + 1,
      minutes,
      restOnly: minutes === 0 && dayLogs.some((l) => l.assetId === RECOVERY_ID),
      future: key > todayKey,
      today: key === todayKey,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** 0–4 intensity for the heatmap, relative to the busiest day. */
export function heatLevel(minutes: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((minutes / max) * 4))) as 1 | 2 | 3 | 4;
}
