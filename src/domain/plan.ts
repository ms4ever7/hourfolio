import { addDays, dayKey, parseDay } from './dates';
import { atMinutes } from './day';
import { newId } from './ids';
import { weekRange } from './goals';
import { sumMinutes } from './stats';
import type { Asset, LogEntry } from './types';

/** One block of time planned for an asset on a day. */
export interface PlannedSession {
  id: string;
  assetId: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  day: string;
  minutes: number;
}

/** The plan for the week starting on `weekFrom` (a Monday). */
export interface WeekPlan {
  weekFrom: string;
  sessions: PlannedSession[];
  /** Free minutes per weekday the plan was made with, so it can be re-planned the same way. */
  free?: number[];
}

/** Shortest and longest a single session of an asset should be, in minutes. */
export interface SessionRange {
  min: number;
  max: number;
}

export interface PlanGoal {
  assetId: string;
  /** Minutes still to plan this week. */
  minutes: number;
  session: SessionRange;
  /** Weekdays the asset can happen on, 0 = Monday … 6 = Sunday. */
  days: number[];
}

export interface PlanInput {
  /** The Monday of the week being planned. */
  weekFrom: string;
  goals: PlanGoal[];
  /** Free minutes on each weekday, Monday first. 0 means "not that day". */
  free: number[];
  /** Nothing is planned before this day; for re-planning the rest of a week. */
  fromDay?: string;
}

export interface PlanResult {
  sessions: PlannedSession[];
  /** Goals that did not fit into the free time, with the minutes left over. */
  shortBy: { assetId: string; minutes: number }[];
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const STEP = 5;

/** Session lengths by kind of asset: reading is a short habit, a workout a longer block. */
const RANGES: Record<Asset['energy'], SessionRange> = {
  body: { min: 60, max: 90 },
  creative: { min: 30, max: 60 },
  mind: { min: 20, max: 40 },
  recovery: { min: 20, max: 60 },
};

export function defaultSessionRange(asset: Pick<Asset, 'energy'>): SessionRange {
  return RANGES[asset.energy];
}

/**
 * Splits `total` over days in steps of 5 minutes, in proportion to how much
 * room each day has (`caps`, already limited to the maximum session), so a day
 * with more free time gets the longer session. Nothing goes under `min` or over its cap.
 */
function split(total: number, caps: number[], min: number): number[] {
  const room = caps.reduce((n, c) => n + c, 0);
  const sizes = caps.map((c) => Math.min(c, Math.max(min, Math.floor((total * c) / room / STEP) * STEP)));
  let diff = total - sizes.reduce((n, s) => n + s, 0);
  while (diff !== 0) {
    const step = diff > 0 ? STEP : -STEP;
    let pick = -1;
    for (let i = 0; i < sizes.length; i++) {
      const head = step > 0 ? caps[i] - sizes[i] : sizes[i] - min;
      if (head >= STEP && (pick < 0 || head > (step > 0 ? caps[pick] - sizes[pick] : sizes[pick] - min))) pick = i;
    }
    if (pick < 0) break;
    sizes[pick] += step;
    diff -= step;
  }
  return sizes;
}

/**
 * Lays the week's goals out over the free days. Assets with the fewest possible
 * days go first, so a workout that only works on weekdays gets them before
 * anything flexible does. Each asset then gets as many sessions as its length
 * range and its days allow (never two on one day), spread so the same asset
 * is not on back-to-back days when it can be avoided, with longer sessions on
 * the days that have more free time.
 */
export function planWeek({ weekFrom, goals, free, fromDay }: PlanInput): PlanResult {
  const monday = parseDay(weekFrom);
  const dayOf = (i: number) => dayKey(addDays(monday, i));
  const left = free.map((m, i) => (fromDay && dayOf(i) < fromDay ? 0 : Math.max(0, m)));
  const load = Array<number>(7).fill(0);
  const sessions: PlannedSession[] = [];
  const shortBy: PlanResult['shortBy'] = [];

  const openDays = (g: PlanGoal) => g.days.filter((d) => left[d] >= g.session.min);
  const ordered = [...goals]
    .filter((g) => g.minutes > 0)
    .sort((a, b) => openDays(a).length - openDays(b).length || b.minutes - a.minutes);

  for (const goal of ordered) {
    const { min, max } = goal.session;
    const open = openDays(goal);
    // As many sessions as the shortest length and the open days allow. Anything
    // that would push a session past the maximum is reported as short.
    const n = Math.min(open.length, Math.max(1, Math.floor(goal.minutes / min)));
    if (n === 0) {
      shortBy.push({ assetId: goal.assetId, minutes: goal.minutes });
      continue;
    }

    const chosen: number[] = [];
    while (chosen.length < n) {
      let best = -1;
      let bestScore = -Infinity;
      for (const d of open) {
        if (chosen.includes(d)) continue;
        const gap = chosen.length ? Math.min(3, ...chosen.map((c) => Math.abs(c - d))) : 3;
        // Room only breaks ties, so spreading and load matter more.
        const score = gap * 2 - load[d] + left[d] / 10_000;
        if (score > bestScore) {
          best = d;
          bestScore = score;
        }
      }
      chosen.push(best);
    }

    const days = [...chosen].sort((a, b) => a - b);
    const caps = days.map((d) => Math.min(max, Math.floor(left[d] / STEP) * STEP));
    const sizes = split(goal.minutes, caps, min);
    let planned = 0;
    days.forEach((day, i) => {
      const minutes = sizes[i];
      if (minutes < min) return;
      left[day] -= minutes;
      load[day] += 1;
      planned += minutes;
      sessions.push({ id: newId('plan'), assetId: goal.assetId, day: dayOf(day), minutes });
    });
    if (planned < goal.minutes) shortBy.push({ assetId: goal.assetId, minutes: goal.minutes - planned });
  }

  sessions.sort((a, b) => a.day.localeCompare(b.day) || a.assetId.localeCompare(b.assetId));
  return { sessions, shortBy };
}

/** The weekly goals of the portfolio as planner input, minus what is already logged this week. */
export function goalsFromAssets(assets: Asset[], logs: LogEntry[], today: Date): PlanGoal[] {
  const week = weekRange(today);
  const goals: PlanGoal[] = [];
  for (const a of assets) {
    if (!a.weeklyGoalMinutes) continue;
    const minutes = a.weeklyGoalMinutes - sumMinutes(logs, week, a.id);
    if (minutes > 0) goals.push({ assetId: a.id, minutes, session: a.sessionMinutes ?? defaultSessionRange(a), days: a.planDays ?? ALL_DAYS });
  }
  return goals;
}

/**
 * Re-plans the rest of the week from `today` on: sessions already done stay, a
 * missed one just moves on, and what is still missing from each goal is laid out
 * again over the days left.
 */
export function replanWeek(plan: WeekPlan, assets: Asset[], logs: LogEntry[], free: number[], today: Date): WeekPlan {
  const from = dayKey(today);
  const kept = plan.sessions.filter((s) => s.day < from && isSessionDone(s, logs));
  const { sessions } = planWeek({ weekFrom: plan.weekFrom, goals: goalsFromAssets(assets, logs, today), free, fromDay: from });
  return { weekFrom: plan.weekFrom, sessions: [...kept, ...sessions] };
}

/** A planned session is done once its asset has any time logged on that day. */
export function isSessionDone(session: PlannedSession, logs: LogEntry[]): boolean {
  return logs.some((l) => l.assetId === session.assetId && l.day === session.day);
}

export function sessionsOn(plan: WeekPlan | undefined, day: string): PlannedSession[] {
  return plan?.sessions.filter((s) => s.day === day) ?? [];
}

/** When the planned-session reminder goes out: late afternoon, kept inside the user's waking day. */
const REMINDER_AT = 17 * 60 + 30;

export interface PlanReminder {
  day: string;
  at: Date;
  /** The sessions of that day still to do. */
  sessions: PlannedSession[];
}

/**
 * One reminder per day for today and tomorrow, listing what is planned and not
 * done yet. Days with nothing left, and times already past, get none. Only two
 * days are scheduled, well inside the phone's limit on pending notifications.
 */
export function planReminders(plans: WeekPlan[], logs: LogEntry[], now: Date, wake: number, bed: number): PlanReminder[] {
  const time = Math.min(Math.max(REMINDER_AT, wake + 60), Math.max(wake + 60, bed - 90));
  const out: PlanReminder[] = [];
  for (const offset of [0, 1]) {
    const date = addDays(now, offset);
    const day = dayKey(date);
    const sessions = plans.flatMap((p) => p.sessions).filter((s) => s.day === day && !isSessionDone(s, logs));
    const at = atMinutes(date, time);
    if (sessions.length > 0 && at > now) out.push({ day, at, sessions });
  }
  return out;
}
