import { dayKey, parseDay, startOfWeek } from './dates';
import { goalsForWeek, hobbiesForWeek, type WeekGoals } from './goal-history';
import { isSessionDone, type WeekPlan } from './plan';
import { RECOVERY_ID, type Asset, type LogEntry } from './types';

/** One finished week in the history on the Achievements screen. */
export interface WeekRecord {
  weekFrom: string;
  total: number;
  goalsMet: number;
  goalsTotal: number;
  /** Every weekly goal met, and there was at least one. */
  allMet: boolean;
  /** The week with the most time. */
  best: boolean;
}

const weekOf = (day: string): string => dayKey(startOfWeek(parseDay(day)));

function byWeek(logs: LogEntry[]): Map<string, LogEntry[]> {
  const weeks = new Map<string, LogEntry[]>();
  for (const log of logs) {
    if (log.minutes <= 0) continue;
    const key = weekOf(log.day);
    const list = weeks.get(key);
    if (list) list.push(log);
    else weeks.set(key, [log]);
  }
  for (const list of weeks.values()) list.sort((a, b) => a.day.localeCompare(b.day));
  return weeks;
}

/**
 * Finished weeks with something logged, newest first. The current week is left out
 * because it is still being written, and empty weeks are skipped rather than shown as gaps.
 * Each week is judged by the goals it had (`history`); weeks from before snapshots were kept use today's.
 */
export function weekHistory(assets: Asset[], logs: LogEntry[], today: Date, history: WeekGoals[] = []): WeekRecord[] {
  const thisWeek = dayKey(startOfWeek(today));
  const records: WeekRecord[] = [];
  for (const [weekFrom, list] of byWeek(logs)) {
    if (weekFrom >= thisWeek) continue;
    const goals = goalsForWeek(history, assets, weekFrom);
    const total = list.reduce((s, l) => s + l.minutes, 0);
    const goalsMet = goals.filter(({ asset, minutes }) => list.filter((l) => l.assetId === asset.id).reduce((s, l) => s + l.minutes, 0) >= minutes).length;
    records.push({ weekFrom, total, goalsMet, goalsTotal: goals.length, allMet: goals.length > 0 && goalsMet === goals.length, best: false });
  }
  records.sort((a, b) => b.weekFrom.localeCompare(a.weekFrom));
  const max = Math.max(0, ...records.map((r) => r.total));
  const best = records.find((r) => r.total === max);
  if (best) best.best = true;
  return records;
}

export interface HistorySummary {
  weeks: number;
  /** Minutes over all finished weeks. */
  total: number;
  fullWeeks: number;
  /** Minutes in the biggest week; 0 without one. */
  best: number;
}

export function historySummary(history: WeekRecord[]): HistorySummary {
  return {
    weeks: history.length,
    total: history.reduce((s, r) => s + r.total, 0),
    fullWeeks: history.filter((r) => r.allMet).length,
    best: history.find((r) => r.best)?.total ?? 0,
  };
}

/** Badges that do not belong to one asset, in the order the shelf shows them. */
export const FIXED_BADGES = ['firstHour', 'firstFullWeek', 'tenHourWeek', 'restCounts', 'allHobbiesWeek', 'planDone', 'hundredHours', 'twentyHourWeek'] as const;
export type FixedBadgeId = (typeof FIXED_BADGES)[number];

export const BADGE_EMOJI: Record<FixedBadgeId, string> = {
  firstHour: '🌱',
  firstFullWeek: '🏆',
  tenHourWeek: '⏱',
  restCounts: '🌙',
  allHobbiesWeek: '🎪',
  planDone: '📅',
  hundredHours: '💯',
  twentyHourWeek: '🔭',
};

/** Hours of one hobby logged in the app that earn a badge, in order. */
export const HOUR_MARKS = [50, 200, 500, 1000];

export type BadgeDef = { id: FixedBadgeId; kind: 'fixed' } | { id: string; kind: 'asset'; assetId: string; hours: number };

export const assetBadgeId = (assetId: string, hours: number): string => `hours:${assetId}:${hours}`;

export function parseBadge(id: string): BadgeDef | null {
  if ((FIXED_BADGES as readonly string[]).includes(id)) return { id: id as FixedBadgeId, kind: 'fixed' };
  const m = /^hours:(.+):(\d+)$/.exec(id);
  return m ? { id, kind: 'asset', assetId: m[1], hours: Number(m[2]) } : null;
}

/** A badge once earned. It is kept in the store, so later edits to logs never take it away. */
export interface EarnedBadge {
  id: string;
  /** The day it was earned. */
  day: string;
  /** The Monday of the week it belongs to; every badge has one. */
  weekFrom: string;
}

/** The day a running total of `logs` (already sorted by day) reaches `threshold`. */
function dayReaching(logs: LogEntry[], threshold: number): string | null {
  let sum = 0;
  for (const log of logs) {
    sum += log.minutes;
    if (sum >= threshold) return log.day;
  }
  return null;
}

const earned = (id: string, day: string): EarnedBadge => ({ id, day, weekFrom: weekOf(day) });

/**
 * Every badge the data supports right now, with the day it was earned. The store keeps
 * what this finds, so a badge stays even when the logs behind it change.
 */
export function detectBadges(assets: Asset[], logs: LogEntry[], plans: WeekPlan[], history: WeekGoals[] = []): EarnedBadge[] {
  const sorted = logs.filter((l) => l.minutes > 0).sort((a, b) => a.day.localeCompare(b.day));
  const weeks = [...byWeek(sorted).entries()].sort(([a], [b]) => a.localeCompare(b));
  const hobbies = assets.filter((a) => a.id !== RECOVERY_ID);
  const found: EarnedBadge[] = [];

  const firstHour = dayReaching(sorted, 60);
  if (firstHour) found.push(earned('firstHour', firstHour));
  const hundred = dayReaching(sorted, 100 * 60);
  if (hundred) found.push(earned('hundredHours', hundred));

  for (const [mark, id] of [
    [10, 'tenHourWeek'],
    [20, 'twentyHourWeek'],
  ] as const) {
    for (const [, list] of weeks) {
      const day = dayReaching(list, mark * 60);
      if (day) {
        found.push(earned(id, day));
        break;
      }
    }
  }

  for (const [, list] of weeks) {
    const restDays = [...new Set(list.filter((l) => l.assetId === RECOVERY_ID).map((l) => l.day))];
    if (restDays.length >= 3) {
      found.push(earned('restCounts', restDays[2]));
      break;
    }
  }

  // Both week badges are judged by the hobbies and goals the week had, so a hobby added or a goal raised later changes nothing.
  for (const [weekFrom, list] of weeks) {
    const ids = hobbiesForWeek(history, assets, weekFrom);
    if (ids.length < 3) continue;
    const seen = new Set<string>();
    const day = list.find((l) => {
      if (ids.includes(l.assetId)) seen.add(l.assetId);
      return seen.size === ids.length;
    })?.day;
    if (day) {
      found.push(earned('allHobbiesWeek', day));
      break;
    }
  }

  for (const [weekFrom, list] of weeks) {
    const goals = goalsForWeek(history, assets, weekFrom);
    if (goals.length === 0) continue;
    const days = goals.map(({ asset, minutes }) => dayReaching(list.filter((l) => l.assetId === asset.id), minutes));
    if (days.every((d) => d !== null)) {
      found.push(earned('firstFullWeek', days.sort()[days.length - 1]!));
      break;
    }
  }

  const done = [...plans].sort((a, b) => a.weekFrom.localeCompare(b.weekFrom)).find((p) => p.sessions.length > 0 && p.sessions.every((s) => isSessionDone(s, sorted)));
  if (done) found.push({ id: 'planDone', day: done.sessions.map((s) => s.day).sort()[done.sessions.length - 1], weekFrom: done.weekFrom });

  for (const asset of hobbies) {
    const own = sorted.filter((l) => l.assetId === asset.id);
    for (const hours of HOUR_MARKS) {
      const day = dayReaching(own, hours * 60);
      if (!day) break;
      found.push(earned(assetBadgeId(asset.id, hours), day));
    }
  }

  return found;
}

/**
 * Badges still ahead, in shelf order: the fixed ones not yet earned, then for each hobby
 * only its next hour mark, so the shelf never fills up with far-off numbers.
 */
export function badgesAhead(assets: Asset[], earnedIds: Iterable<string>): BadgeDef[] {
  const have = new Set(earnedIds);
  const ahead: BadgeDef[] = FIXED_BADGES.filter((id) => !have.has(id)).map((id) => ({ id, kind: 'fixed' }));
  for (const asset of assets) {
    if (asset.id === RECOVERY_ID) continue;
    const hours = HOUR_MARKS.find((h) => !have.has(assetBadgeId(asset.id, h)));
    if (hours) ahead.push({ id: assetBadgeId(asset.id, hours), kind: 'asset', assetId: asset.id, hours });
  }
  return ahead;
}

/** Minutes logged in the app, for one asset or in all; starting capital is not counted. */
export function loggedMinutes(logs: LogEntry[], assetId?: string): number {
  return logs.reduce((s, l) => (assetId && l.assetId !== assetId ? s : s + l.minutes), 0);
}

/** Earned badges newest first; `badges` are the ones the store keeps. */
export function sortEarned(badges: EarnedBadge[]): EarnedBadge[] {
  return [...badges].sort((a, b) => b.day.localeCompare(a.day));
}
