import { addDays, dayKey, parseDay, startOfWeek } from './dates';
import type { SeasonId } from './seasons';
import { sumMinutes, type Range } from './stats';
import type { Asset, LogEntry } from './types';

/** How weekly goal progress is drawn. `bar` is the plain progress bar. */
export type SceneId = 'dog' | 'tree' | 'rocket' | 'cat' | 'bar';

export const SCENES: SceneId[] = ['dog', 'tree', 'rocket', 'cat', 'bar'];

export interface SceneArt {
  /** Moves along the track, or grows in place when `grows` is set. */
  runner: string;
  /** Waits at the end of the track. */
  goal: string;
  /** For growing scenes: the stages from seed to done. */
  stages?: string[];
  /** Emoji face left by default; flip them so they run toward the goal. */
  flip?: boolean;
}

const ART: Record<Exclude<SceneId, 'bar'>, SceneArt> = {
  dog: { runner: '🐕', goal: '🦴', flip: true },
  cat: { runner: '🐈', goal: '🐟', flip: true },
  rocket: { runner: '🚀', goal: '🌕' },
  tree: { runner: '🌱', goal: '🍎', stages: ['🌱', '🌿', '🪴', '🌳'] },
};

/** Seasons swap a few props, never the scene itself. */
const SEASON_ART: Partial<Record<SeasonId, Partial<Record<Exclude<SceneId, 'bar'>, Partial<SceneArt>>>>> = {
  halloween: { dog: { goal: '🍬' }, cat: { goal: '🎃' }, rocket: { goal: '🌕' }, tree: { goal: '🎃' } },
  winter: { dog: { goal: '🎁' }, cat: { goal: '🧶' }, rocket: { goal: '⭐' }, tree: { stages: ['🌱', '🌿', '🌲', '🎄'], goal: '🎁' } },
};

export function sceneArt(scene: Exclude<SceneId, 'bar'>, season: SeasonId | null): SceneArt {
  return { ...ART[scene], ...(season ? SEASON_ART[season]?.[scene] : undefined) };
}

/** Which growth stage to show for a progress of 0..1. The last one only when the goal is met. */
export function stageIndex(progress: number, stages: number): number {
  if (progress >= 1) return stages - 1;
  return Math.min(stages - 2, Math.floor(Math.max(0, progress) * (stages - 1)));
}

export function weekRange(day: Date): Range {
  const from = startOfWeek(day);
  return { from: dayKey(from), to: dayKey(addDays(from, 6)) };
}

/** Identifies one goal in one week, so its congrats is shown only once. */
export function celebrationKey(assetId: string, weekFrom: string): string {
  return `${assetId}@${weekFrom}`;
}

/**
 * The asset whose weekly goal a new log entry just completed: under the goal
 * before, at or over it after. Only the week the entry belongs to counts.
 */
export function goalMetBy(entry: Pick<LogEntry, 'assetId' | 'day' | 'minutes'>, assets: Asset[], logsBefore: LogEntry[]): Asset | null {
  const asset = assets.find((a) => a.id === entry.assetId);
  const goal = asset?.weeklyGoalMinutes;
  if (!asset || !goal) return null;
  const before = sumMinutes(logsBefore, weekRange(parseDay(entry.day)), asset.id);
  return before < goal && before + entry.minutes >= goal ? asset : null;
}

/** True when every asset with a weekly goal has met it in that week. */
export function allGoalsMet(assets: Asset[], logs: LogEntry[], week: Range): boolean {
  const withGoals = assets.filter((a) => a.weeklyGoalMinutes);
  return withGoals.length > 0 && withGoals.every((a) => sumMinutes(logs, week, a.id) >= a.weeklyGoalMinutes!);
}

/** When the end-of-week nudge goes out: Sunday at 17:00, local time. */
export function nudgeTime(now: Date): Date {
  const sunday = addDays(startOfWeek(now), 6);
  return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 17, 0);
}

export interface Nudge {
  asset: Asset;
  /** Minutes still missing from the weekly goal. */
  remaining: number;
  at: Date;
}

/**
 * The weekly goal that is nearly met, worth one gentle reminder before the
 * week ends: at most 30% (and at most two hours) left. Goals far from done get
 * no reminder at all, so it never turns into pressure.
 */
export function weekNudge(assets: Asset[], logs: LogEntry[], now: Date): Nudge | null {
  const at = nudgeTime(now);
  if (now >= at) return null;
  const week = weekRange(now);
  let best: Nudge | null = null;
  for (const asset of assets) {
    const goal = asset.weeklyGoalMinutes;
    if (!goal) continue;
    const remaining = goal - sumMinutes(logs, week, asset.id);
    if (remaining <= 0 || remaining > goal * 0.3 || remaining > 120) continue;
    if (!best || remaining < best.remaining) best = { asset, remaining, at };
  }
  return best;
}

export const WEEK_GOAL_STEP = 30;
export const WEEK_GOAL_MAX = 40 * 60;
export const DAY_GOAL_MAX = 8 * 60;

/** Days a per-day goal counts on: the asset's plan days, every day when unset. */
export const goalDays = (a: Pick<Asset, 'planDays'>): number => a.planDays?.length || 7;

/** One step of a per-day goal: 5 minutes while short, 15 from an hour. Never below 0 or above 8 h. */
export function stepDayGoal(minutes: number, dir: 1 | -1): number {
  const step = minutes + (dir < 0 ? -1 : 0) >= 60 ? 15 : 5;
  return Math.min(DAY_GOAL_MAX, Math.max(0, minutes + dir * step));
}

/** The per-day goal a weekly one comes to, in 5-minute steps (at least 5). */
export function dailyFromWeekly(weekly: number, a: Pick<Asset, 'planDays'>): number {
  return Math.min(DAY_GOAL_MAX, Math.max(5, Math.round(weekly / goalDays(a) / 5) * 5));
}

type GoalFields = Pick<Asset, 'weeklyGoalMinutes' | 'dailyGoalMinutes' | 'planDays'>;

/**
 * Applies an edit to an asset (or onboarding draft) and keeps the two goals
 * consistent: a per-day goal always sets the weekly one, and setting the weekly
 * goal alone drops the per-day one.
 */
export function applyGoalPatch<T extends GoalFields>(a: T, patch: Partial<T>): T {
  const next = { ...a, ...patch };
  if ('weeklyGoalMinutes' in patch && !('dailyGoalMinutes' in patch)) next.dailyGoalMinutes = undefined;
  if (next.dailyGoalMinutes) next.weeklyGoalMinutes = next.dailyGoalMinutes * goalDays(next);
  return next;
}
