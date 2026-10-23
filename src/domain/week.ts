import { addDays, dayKey, parseDay } from './dates';
import { goalsForWeek, type WeekGoals } from './goal-history';
import { weekRange } from './goals';
import { isSessionDone, type WeekPlan } from './plan';
import { sumMinutes } from './stats';
import { RECOVERY_ID, type Asset, type LogEntry } from './types';

export interface WeekGoal {
  asset: Asset;
  done: number;
  goal: number;
  met: boolean;
}

export interface WeekSummary {
  weekFrom: string;
  total: number;
  /** The whole week before, to say how this one compares. */
  previousTotal: number;
  goals: WeekGoal[];
  goalsMet: number;
  /** Every weekly goal met, and there was at least one. */
  allMet: boolean;
  /** Planned sessions done and planned in all; both 0 without a plan. */
  sessionsDone: number;
  sessionsPlanned: number;
  /** The asset with the most time that week, recovery aside. */
  top: { asset: Asset; minutes: number } | null;
  /** Days with some recovery logged. */
  restDays: number;
  /** Fewer than half the goals met: the recap then speaks about what was added, not what was met. */
  light: boolean;
}

/** One week in numbers, for the recap sheet. `weekFrom` is its Monday; `history` holds the goals each week had. */
export function weekSummary(assets: Asset[], logs: LogEntry[], plan: WeekPlan | undefined, weekFrom: string, history: WeekGoals[] = []): WeekSummary {
  const range = weekRange(parseDay(weekFrom));
  const previous = weekRange(addDays(parseDay(weekFrom), -7));
  const goals = goalsForWeek(history, assets, weekFrom).map(({ asset, minutes }) => {
    const done = sumMinutes(logs, range, asset.id);
    return { asset, done, goal: minutes, met: done >= minutes };
  });
  const goalsMet = goals.filter((g) => g.met).length;
  const sessions = plan && plan.weekFrom === weekFrom ? plan.sessions : [];
  const top = assets
    .filter((a) => a.id !== RECOVERY_ID)
    .map((asset) => ({ asset, minutes: sumMinutes(logs, range, asset.id) }))
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)[0];
  const restDays = new Set(logs.filter((l) => l.assetId === RECOVERY_ID && l.day >= range.from && l.day <= range.to && l.minutes > 0).map((l) => l.day)).size;
  return {
    weekFrom,
    total: sumMinutes(logs, range),
    previousTotal: sumMinutes(logs, previous),
    goals,
    goalsMet,
    allMet: goals.length > 0 && goalsMet === goals.length,
    sessionsDone: sessions.filter((s) => isSessionDone(s, logs)).length,
    sessionsPlanned: sessions.length,
    top: top ?? null,
    restDays,
    light: goals.length > 0 && goalsMet * 2 < goals.length,
  };
}

/** The Monday of the week before `today`'s. */
export const lastWeekFrom = (today: Date): string => dayKey(addDays(parseDay(weekRange(today).from), -7));

/** Identifies a whole week completed, so its celebration shows once. Shares the key list with goal congrats. */
export const weekCelebrationKey = (weekFrom: string): string => `week@${weekFrom}`;
