import { addDays, dayKey, parseDay, startOfWeek, weekdayMonFirst } from './dates';
import { atMinutes } from './day';
import { newId } from './ids';
import { weekRange } from './goals';
import { sumMinutes } from './stats';
import type { Asset, LogEntry } from './types';
import { RECOVERY_ID } from './types';

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
  /** Minutes of recovery wanted that week, so re-planning keeps them. */
  rest?: number;
  /** Goals that did not fit when the plan was made, with the minutes left over; shown so they do not just vanish. */
  short?: { assetId: string; minutes: number }[];
}

/** From Friday the next week is worth planning. */
const PLAN_AHEAD_FROM = 4;

/**
 * The plans around `today`. `shown` is the one to display: this week's, or on a
 * Sunday with nothing left to show of it, next week's. `next` is next week's plan
 * whether or not it is shown, and `askNext` says when to offer planning it.
 */
export function plansAround(plans: WeekPlan[], today: Date): { shown?: WeekPlan; next?: WeekPlan; askNext: boolean } {
  const withSessions = (from: string) => plans.find((p) => p.weekFrom === from && p.sessions.length > 0);
  const monday = startOfWeek(today);
  const current = withSessions(dayKey(monday));
  const next = withSessions(dayKey(addDays(monday, 7)));
  const day = weekdayMonFirst(today);
  const shown = current ?? (day === 6 ? next : undefined);
  return { shown, next, askNext: day >= PLAN_AHEAD_FROM && shown !== undefined && shown !== next };
}

/** Free minutes per weekday, Monday first, for a first plan: weekdays an hour, weekends off. */
export const DEFAULT_FREE = [60, 60, 60, 60, 60, 0, 0];

/**
 * What a plan for the week starting `weekFrom` starts from: that week's own free
 * time and rest if it has a plan, else the newest plan's, else the defaults. So
 * planning next week begins where this week was left, not back at 60 × 5.
 */
export function previousSetup(plans: WeekPlan[], weekFrom: string): { free: number[]; rest?: number } {
  const own = plans.find((p) => p.weekFrom === weekFrom);
  const latest = [...plans].reverse().find((p) => p.free);
  const from = own?.free ? own : latest;
  return { free: from?.free ?? DEFAULT_FREE, rest: own?.rest ?? latest?.rest };
}

const SESSION_STEP = 15;
const MIN_SESSION = 15;
const MAX_SESSION = 240;

/** A session's length after a step up or down, kept between 15 minutes and 4 hours. */
export function resized(minutes: number, direction: 1 | -1): number {
  return Math.min(MAX_SESSION, Math.max(MIN_SESSION, minutes + direction * SESSION_STEP));
}

/**
 * The day a session lands on when moved one way: the next day in that direction
 * that is inside the week, not before `fromDay`, and not already holding the same
 * asset (it jumps over such a day). Null when there is no such day.
 */
export function moveTarget(sessions: PlannedSession[], weekFrom: string, session: PlannedSession, direction: 1 | -1, fromDay?: string): string | null {
  const last = dayKey(addDays(parseDay(weekFrom), 6));
  for (let by = direction; ; by += direction) {
    const day = dayKey(addDays(parseDay(session.day), by));
    if (day < weekFrom || day > last || (fromDay !== undefined && day < fromDay)) return null;
    if (!sessions.some((s) => s.id !== session.id && s.assetId === session.assetId && s.day === day)) return day;
  }
}

/**
 * Moves a session to another day. When that day already holds the same asset the
 * two become one session with the minutes added up (30 + 30 = 60), rather than
 * two rows of the same hobby.
 */
export function mergeMove(sessions: PlannedSession[], id: string, toDay: string): PlannedSession[] {
  const moved = sessions.find((s) => s.id === id);
  if (!moved || moved.day === toDay) return sessions;
  const twin = sessions.find((s) => s.id !== id && s.assetId === moved.assetId && s.day === toDay);
  if (!twin) return sessions.map((s) => (s.id === id ? { ...s, day: toDay } : s));
  return sessions.filter((s) => s.id !== id).map((s) => (s.id === twin.id ? { ...s, minutes: s.minutes + moved.minutes } : s));
}

/** The days a session can be dropped on: from `editFrom` to the end of the week. */
export function dropDays(weekFrom: string, editFrom: string): string[] {
  const monday = parseDay(weekFrom);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => dayKey(addDays(monday, i))).filter((d) => d >= editFrom);
}

/** Minutes planned on `day` beyond the free time set for that weekday; 0 when it fits or no free time is known. */
export function overFree(sessions: PlannedSession[], day: string, free?: number[]): number {
  if (!free) return 0;
  const planned = sessions.filter((s) => s.day === day).reduce((n, s) => n + s.minutes, 0);
  return Math.max(0, planned - (free[weekdayMonFirst(parseDay(day))] ?? 0));
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
  /** Sessions the week already holds (the done ones): they use up their day's free time and keep their asset off that day. */
  kept?: PlannedSession[];
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
export function planWeek({ weekFrom, goals, free, fromDay, kept = [] }: PlanInput): PlanResult {
  const monday = parseDay(weekFrom);
  const dayOf = (i: number) => dayKey(addDays(monday, i));
  const left = free.map((m, i) => {
    if (fromDay && dayOf(i) < fromDay) return 0;
    const used = kept.filter((k) => k.day === dayOf(i)).reduce((n, k) => n + k.minutes, 0);
    return Math.max(0, m - used);
  });
  const load = Array<number>(7).fill(0);
  const sessions: PlannedSession[] = [];
  const shortBy: PlanResult['shortBy'] = [];

  // A session is never shorter than the goal still needs (15 minutes left plans
  // 15, not the usual 30), and always a whole number of steps.
  const minOf = (g: PlanGoal) => Math.max(STEP, Math.floor(Math.min(g.session.min, g.minutes) / STEP) * STEP);
  const openDays = (g: PlanGoal) => g.days.filter((d) => left[d] >= minOf(g) && !kept.some((k) => k.assetId === g.assetId && k.day === dayOf(d)));
  const ordered = [...goals]
    .filter((g) => g.minutes > 0)
    .sort((a, b) => openDays(a).length - openDays(b).length || b.minutes - a.minutes);

  for (const goal of ordered) {
    const min = minOf(goal);
    const open = openDays(goal);
    // As many sessions as the shortest length and the open days allow.
    const n = Math.min(open.length, Math.max(1, Math.floor(goal.minutes / min)));
    if (n === 0) {
      shortBy.push({ assetId: goal.assetId, minutes: goal.minutes });
      continue;
    }
    // The maximum is what a session usually is. A goal too big for that (6 hours
    // of coding in 40-minute sessions) stretches them rather than leaving time unplanned.
    const max = Math.max(goal.session.max, Math.ceil(goal.minutes / n / STEP) * STEP);

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

  // Within a day, in the order the goals were given (the portfolio's order).
  const rank = (id: string) => goals.findIndex((g) => g.assetId === id);
  sessions.sort((a, b) => a.day.localeCompare(b.day) || rank(a.assetId) - rank(b.assetId));
  return { sessions, shortBy };
}

const AUTO_STEP = 30;
const AUTO_MAX = 8 * 60;

/**
 * A plan for goals without asking when the user is free: every open day gets the
 * same room (weekends half of it) and the room grows until everything fits, so
 * nothing silently drops out. Returns the plan and the `free` it used.
 */
export function autoPlan({ weekFrom, goals, fromDay, kept = [] }: Omit<PlanInput, 'free'>): PlanResult & { free: number[] } {
  const monday = parseDay(weekFrom);
  const open: number[] = ALL_DAYS.map((i) => (fromDay && dayKey(addDays(monday, i)) < fromDay ? 0 : i >= 5 ? 0.5 : 1));
  const weight = open.reduce((n, w) => n + w, 0);
  // Goals already have the logged (kept) time taken off, so only what is left to plan counts.
  const needed = goals.reduce((n, g) => n + g.minutes, 0);
  let room = Math.max(AUTO_STEP * 2, Math.ceil(needed / Math.max(weight, 1) / AUTO_STEP) * AUTO_STEP);
  for (;;) {
    const free = open.map((w) => Math.round((room * w) / AUTO_STEP) * AUTO_STEP);
    const result = planWeek({ weekFrom, goals, free, fromDay, kept });
    if (result.shortBy.length === 0 || room >= AUTO_MAX) return { ...result, free };
    room += AUTO_STEP;
  }
}

/** The weekly goals of the portfolio as planner input, minus what is already logged this week. A per-day goal plans one session of that length on each day. */
export function goalsFromAssets(assets: Asset[], logs: LogEntry[], today: Date): PlanGoal[] {
  const week = weekRange(today);
  const goals: PlanGoal[] = [];
  for (const a of assets) {
    if (!a.weeklyGoalMinutes) continue;
    const minutes = a.weeklyGoalMinutes - sumMinutes(logs, week, a.id);
    if (minutes > 0) goals.push({ assetId: a.id, minutes, session: a.dailyGoalMinutes ? { min: a.dailyGoalMinutes, max: a.dailyGoalMinutes } : (a.sessionMinutes ?? defaultSessionRange(a)), days: a.planDays ?? ALL_DAYS });
  }
  return goals;
}

/**
 * The goals to plan for the week `base` is in: every asset's weekly goal, plus
 * `rest` minutes of recovery, each minus what is already logged that week.
 * Recovery is planned from `rest`, not from its own goal, so the two never double up.
 */
export function planGoals(assets: Asset[], logs: LogEntry[], base: Date, rest: number): PlanGoal[] {
  const goals = goalsFromAssets(
    assets.filter((a) => a.id !== RECOVERY_ID),
    logs,
    base,
  );
  const recovery = assets.find((a) => a.id === RECOVERY_ID);
  const minutes = rest - sumMinutes(logs, weekRange(base), RECOVERY_ID);
  if (recovery && minutes > 0) goals.push({ assetId: RECOVERY_ID, minutes, session: recovery.sessionMinutes ?? defaultSessionRange(recovery), days: recovery.planDays ?? ALL_DAYS });
  return goals;
}

/** What the plan keeps when planning from `from` on: the sessions already done, today's included. A missed one just moves on. */
export function keepDone(sessions: PlannedSession[], from: string | undefined, logs: LogEntry[]): PlannedSession[] {
  return from ? sessions.filter((s) => s.day <= from && isSessionDone(s, logs)) : [];
}

/**
 * Re-plans the rest of the week from `today` on: sessions already done stay
 * (today's too, and they use up that day's free time), a missed one just moves
 * on, and what is still missing from each goal (recovery included) is laid out
 * again over the days left. A week that has not started is planned whole, from
 * its own Monday, so this week's logged time never counts against it.
 */
export function replanWeek(plan: WeekPlan, assets: Asset[], logs: LogEntry[], free: number[] | undefined, today: Date): WeekPlan {
  const ahead = dayKey(today) < plan.weekFrom;
  const from = ahead ? undefined : dayKey(today);
  const rest = plan.rest ?? assets.find((a) => a.id === RECOVERY_ID)?.weeklyGoalMinutes ?? 0;
  const kept = keepDone(plan.sessions, from, logs);
  const goals = planGoals(assets, logs, ahead ? parseDay(plan.weekFrom) : today, rest);
  // Without free time of its own (an automatic plan) the room is worked out again for the days left.
  const made = free ? planWeek({ weekFrom: plan.weekFrom, goals, free, fromDay: from, kept }) : autoPlan({ weekFrom: plan.weekFrom, goals, fromDay: from, kept });
  return { weekFrom: plan.weekFrom, free, rest, short: made.shortBy, sessions: [...kept, ...made.sessions] };
}

/** Minutes logged for the session's asset on the session's day. */
export function loggedFor(session: PlannedSession, logs: LogEntry[]): number {
  return logs.filter((l) => l.assetId === session.assetId && l.day === session.day).reduce((n, l) => n + l.minutes, 0);
}

/** A planned session is done once its asset has at least the planned time logged on that day. */
export function isSessionDone(session: PlannedSession, logs: LogEntry[]): boolean {
  return loggedFor(session, logs) >= session.minutes;
}

/** What is still to log of a session; 0 once it is done. */
export function minutesLeft(session: PlannedSession, logs: LogEntry[]): number {
  return Math.max(0, session.minutes - loggedFor(session, logs));
}

/** The sessions on a day; with `order` (asset ids in portfolio order) they are sorted that way. */
export function sessionsOn(plan: WeekPlan | undefined, day: string, order?: string[]): PlannedSession[] {
  const list = plan?.sessions.filter((s) => s.day === day) ?? [];
  if (!order) return list;
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  return [...list].sort((a, b) => rank(a.assetId) - rank(b.assetId));
}

/**
 * What a day's plan asks for and how much of the day is logged. Time logged for
 * an asset beyond its plan, or for one that was not planned that day, counts on
 * both sides, so the plan grows to cover it and the bar always matches the totals
 * shown next to it. A day without a plan has nothing to measure against: 0 and 0.
 */
export function dayProgress(plan: WeekPlan | undefined, day: string, logs: LogEntry[]): { planned: number; done: number } {
  const sessions = sessionsOn(plan, day);
  if (sessions.length === 0) return { planned: 0, done: 0 };
  const planned = new Map<string, number>();
  for (const s of sessions) planned.set(s.assetId, (planned.get(s.assetId) ?? 0) + s.minutes);
  const logged = new Map<string, number>();
  for (const l of logs) if (l.day === day) logged.set(l.assetId, (logged.get(l.assetId) ?? 0) + l.minutes);
  let total = 0;
  let done = 0;
  for (const id of new Set([...planned.keys(), ...logged.keys()])) {
    const p = planned.get(id) ?? 0;
    const l = logged.get(id) ?? 0;
    total += Math.max(p, l);
    done += l;
  }
  return { planned: total, done };
}

/** When the planned-session reminder goes out: late afternoon, kept inside the user's waking day. */
const REMINDER_AT = 17 * 60 + 30;

/** Today and the next few days, so a few days away from the app do not leave a planned day without a reminder. */
const REMIND_DAYS = 4;

export interface PlanReminder {
  day: string;
  at: Date;
  /** The sessions of that day still to do. */
  sessions: PlannedSession[];
}

/**
 * One reminder per day for today and the next three, listing what is planned and
 * not done yet. Days with nothing left, and times already past, get none. Four
 * days is well inside the phone's limit on pending notifications.
 */
export function planReminders(plans: WeekPlan[], logs: LogEntry[], now: Date, wake: number, bed: number): PlanReminder[] {
  const time = Math.min(Math.max(REMINDER_AT, wake + 60), Math.max(wake + 60, bed - 90));
  const out: PlanReminder[] = [];
  for (let offset = 0; offset < REMIND_DAYS; offset++) {
    const date = addDays(now, offset);
    const day = dayKey(date);
    const sessions = plans.flatMap((p) => p.sessions).filter((s) => s.day === day && !isSessionDone(s, logs));
    const at = atMinutes(date, time);
    if (sessions.length > 0 && at > now) out.push({ day, at, sessions });
  }
  return out;
}
