import { dayKey, parseDay, startOfWeek } from './dates';
import type { Asset, LogEntry } from './types';
import { RECOVERY_ID } from './types';

/**
 * The goals in force during one week, kept so a later change never rewrites
 * that week's history: raising a goal from 3 to 5 hours must not turn past
 * "all goals met" weeks into "2 of 3". Badges are kept separately and never lost.
 */
export interface WeekGoals {
  /** The week's Monday, `YYYY-MM-DD`. */
  weekFrom: string;
  goals: { assetId: string; minutes: number }[];
  /** The hobbies (recovery aside) the portfolio had then, for "every hobby in one week". */
  hobbies: string[];
}

export type GoalSnapshot = Pick<WeekGoals, 'goals' | 'hobbies'>;

/** Today's goals and hobbies, as a snapshot for the current week. */
export function snapshotGoals(assets: Asset[]): GoalSnapshot {
  return {
    goals: assets.filter((a) => a.weeklyGoalMinutes).map((a) => ({ assetId: a.id, minutes: a.weeklyGoalMinutes! })),
    hobbies: assets.filter((a) => a.id !== RECOVERY_ID).map((a) => a.id),
  };
}

export const sameSnapshot = (a: GoalSnapshot, b: GoalSnapshot): boolean => JSON.stringify([a.goals, a.hobbies]) === JSON.stringify([b.goals, b.hobbies]);

/**
 * The weekly goals a week is judged by: its own snapshot when there is one, else
 * today's goals (weeks from before snapshots were kept). Only hobbies that still
 * exist count: deleting a hobby erases its history everywhere.
 */
export function goalsForWeek(history: WeekGoals[], assets: Asset[], weekFrom: string): { asset: Asset; minutes: number }[] {
  const week = history.find((w) => w.weekFrom === weekFrom);
  if (!week) return assets.filter((a) => a.weeklyGoalMinutes).map((a) => ({ asset: a, minutes: a.weeklyGoalMinutes! }));
  return week.goals.flatMap((g) => {
    const asset = assets.find((a) => a.id === g.assetId);
    return asset && g.minutes > 0 ? [{ asset, minutes: g.minutes }] : [];
  });
}

/** The hobby ids a week is judged by for "every hobby in one week", same rules as `goalsForWeek`. */
export function hobbiesForWeek(history: WeekGoals[], assets: Asset[], weekFrom: string): string[] {
  const week = history.find((w) => w.weekFrom === weekFrom);
  const current = assets.filter((a) => a.id !== RECOVERY_ID).map((a) => a.id);
  if (!week) return current;
  return week.hobbies.filter((id) => assets.some((a) => a.id === id));
}

/** Finished weeks with something logged and no snapshot yet. They are frozen at the first run after them, with the goals of that moment. */
export function weeksToFreeze(history: WeekGoals[], logs: LogEntry[], today: Date): string[] {
  const thisWeek = dayKey(startOfWeek(today));
  const have = new Set(history.map((w) => w.weekFrom));
  const weeks = new Set<string>();
  for (const l of logs) {
    const week = dayKey(startOfWeek(parseDay(l.day)));
    if (week < thisWeek && !have.has(week)) weeks.add(week);
  }
  return [...weeks].sort();
}

/** `history` with the snapshot for `weekFrom` replaced or added, oldest first. */
export function withWeekGoals(history: WeekGoals[], weekFrom: string, snapshot: GoalSnapshot): WeekGoals[] {
  return [...history.filter((w) => w.weekFrom !== weekFrom), { weekFrom, goals: snapshot.goals, hobbies: snapshot.hobbies }].sort((a, b) => a.weekFrom.localeCompare(b.weekFrom));
}

/** `history` without a deleted hobby. */
export function withoutAsset(history: WeekGoals[], assetId: string): WeekGoals[] {
  return history.map((w) => ({ ...w, goals: w.goals.filter((g) => g.assetId !== assetId), hobbies: w.hobbies.filter((id) => id !== assetId) }));
}
