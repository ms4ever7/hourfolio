import { daysBetween, parseDay } from './dates';
import { ALL_DAYS, DEFAULT_FREE, autoPlan, dayProgress, dropDays, mergeMove, defaultSessionRange, goalsFromAssets, isSessionDone, keepDone, loggedFor, minutesLeft, moveTarget, overFree, planGoals, planReminders, plansAround, planWeek, previousSetup, replanWeek, resized, sessionsOn, type PlanGoal, type PlannedSession, type WeekPlan } from './plan';
import type { Asset, LogEntry } from './types';

const WEEK = '2026-09-28'; // a Monday
const WEEKDAYS = [0, 1, 2, 3, 4];

const goal = (assetId: string, hours: number, days = ALL_DAYS, min = 30, max = 90): PlanGoal => ({
  assetId,
  minutes: hours * 60,
  session: { min, max },
  days,
});

const total = (r: ReturnType<typeof planWeek>, id: string) => r.sessions.filter((s) => s.assetId === id).reduce((n, s) => n + s.minutes, 0);
const daysOf = (r: ReturnType<typeof planWeek>, id: string) => r.sessions.filter((s) => s.assetId === id).map((s) => s.day);

describe('planWeek', () => {
  const free = [120, 120, 120, 120, 120, 120, 120];

  it('puts a weekday-only workout on every weekday', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('crossfit', 5, WEEKDAYS, 60, 90)], free });
    expect(daysOf(r, 'crossfit')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
    expect(total(r, 'crossfit')).toBe(300);
    expect(r.shortBy).toEqual([]);
  });

  it('splits reading into short sessions', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('reading', 2, ALL_DAYS, 20, 30)], free });
    const sessions = r.sessions.filter((s) => s.assetId === 'reading');
    expect(sessions.length).toBeGreaterThan(3);
    for (const s of sessions) expect(s.minutes).toBeLessThanOrEqual(30);
    expect(total(r, 'reading')).toBe(120);
  });

  it('plans the example week: something every day, nothing twice a day for one asset', () => {
    const r = planWeek({
      weekFrom: WEEK,
      goals: [goal('guitar', 3, ALL_DAYS, 30, 60), goal('crossfit', 5, WEEKDAYS, 60, 90), goal('dj', 2, ALL_DAYS, 45, 90)],
      free: [180, 180, 180, 180, 180, 0, 0],
    });
    expect(r.shortBy).toEqual([]);
    expect(total(r, 'guitar')).toBe(180);
    expect(total(r, 'dj')).toBe(120);
    expect(new Set(r.sessions.map((s) => s.day)).size).toBe(5);
    expect(r.sessions.every((s) => s.day <= '2026-10-02')).toBe(true);
    const keys = r.sessions.map((s) => `${s.assetId}@${s.day}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps flexible assets off back-to-back days when it can', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('guitar', 2, ALL_DAYS, 30, 60)], free });
    const days = daysOf(r, 'guitar');
    expect(days).toHaveLength(4);
    const idx = days.map((d) => daysBetween(parseDay(WEEK), parseDay(d)));
    expect(Math.min(...idx.slice(1).map((d, i) => d - idx[i]))).toBeGreaterThanOrEqual(1);
  });

  it('never exceeds a day\'s free time and reports what did not fit', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('crossfit', 5, WEEKDAYS, 60, 90)], free: [60, 60, 0, 0, 0, 0, 0] });
    expect(total(r, 'crossfit')).toBe(120);
    expect(r.shortBy).toEqual([{ assetId: 'crossfit', minutes: 180 }]);
  });

  it('uses the longer free days for the longer sessions', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('dj', 2.5, [0, 5], 30, 120)], free: [60, 0, 0, 0, 0, 120, 0] });
    expect(r.sessions.find((s) => s.day === '2026-10-03')?.minutes).toBe(100);
    expect(r.sessions.find((s) => s.day === WEEK)?.minutes).toBe(50);
  });

  it('stretches sessions past the usual maximum when the goal needs it', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('coding', 6, WEEKDAYS, 20, 40)], free });
    expect(total(r, 'coding')).toBe(360);
    expect(r.shortBy).toEqual([]);
    expect(daysOf(r, 'coding')).toHaveLength(5);
  });

  it('plans nothing before fromDay', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [goal('guitar', 2)], free, fromDay: '2026-10-01' });
    expect(r.sessions.every((s) => s.day >= '2026-10-01')).toBe(true);
    expect(total(r, 'guitar')).toBeGreaterThan(0);
  });

  it('skips goals with nothing left to plan', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [{ ...goal('guitar', 0) }], free });
    expect(r).toEqual({ sessions: [], shortBy: [] });
  });
});

describe('defaultSessionRange', () => {
  it('gives reading-like assets short sessions and workouts long ones', () => {
    expect(defaultSessionRange({ energy: 'mind' }).max).toBeLessThan(defaultSessionRange({ energy: 'body' }).min + 1);
    expect(defaultSessionRange({ energy: 'body' }).min).toBeGreaterThanOrEqual(60);
  });
});

describe('plans over a week', () => {
  const asset = (id: string, goalHours: number, over: Partial<Asset> = {}): Asset => ({
    id,
    icon: 'guitar',
    color: 'magenta',
    energy: 'creative',
    rhythm: 'fewPerWeek',
    startingMinutes: 0,
    weeklyGoalMinutes: goalHours * 60,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  });
  const log = (assetId: string, day: string, minutes: number): LogEntry => ({ id: `${assetId}${day}`, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });
  const free = [120, 120, 120, 120, 120, 120, 120];

  it('turns goals into planner input, minus what is logged', () => {
    const goals = goalsFromAssets([asset('g', 3), asset('r', 2, { energy: 'mind', planDays: [0, 2] }), { ...asset('x', 0), weeklyGoalMinutes: undefined }], [log('g', '2026-09-29', 60)], parseDay('2026-09-30'));
    expect(goals).toEqual([
      { assetId: 'g', minutes: 120, session: { min: 30, max: 60 }, days: ALL_DAYS },
      { assetId: 'r', minutes: 120, session: { min: 20, max: 40 }, days: [0, 2] },
    ]);
  });

  it('plans a per-day goal as one session of that length per day', () => {
    const a = asset('d', 0, { weeklyGoalMinutes: 140, dailyGoalMinutes: 20 });
    const [goal] = goalsFromAssets([a], [], parseDay('2026-09-30'));
    expect(goal.session).toEqual({ min: 20, max: 20 });
    const { sessions } = planWeek({ weekFrom: '2026-09-28', goals: [goal], free });
    expect(sessions.map((x) => x.minutes)).toEqual([20, 20, 20, 20, 20, 20, 20]);
  });

  it('drops goals that are already met', () => {
    expect(goalsFromAssets([asset('g', 1)], [log('g', '2026-09-29', 60)], parseDay('2026-09-30'))).toEqual([]);
  });

  it('re-plans from today and keeps the days before', () => {
    const assets = [asset('g', 3)];
    const logs = [log('g', '2026-09-28', 60)];
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'old', assetId: 'g', day: '2026-09-28', minutes: 60 }, { id: 'missed', assetId: 'g', day: '2026-09-29', minutes: 60 }] };
    const next = replanWeek(plan, assets, logs, free, parseDay('2026-09-30'));
    expect(next.sessions[0].id).toBe('old');
    expect(next.sessions.some((s) => s.id === 'missed')).toBe(false);
    const later = next.sessions.filter((s) => s.day >= '2026-09-30');
    expect(later.reduce((n, s) => n + s.minutes, 0)).toBe(120);
  });

  it('knows which sessions are done and what is planned on a day', () => {
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'a', assetId: 'g', day: WEEK, minutes: 30 }] };
    expect(isSessionDone(plan.sessions[0], [log('g', WEEK, 30)])).toBe(true);
    expect(isSessionDone(plan.sessions[0], [log('g', WEEK, 10), log('g', WEEK, 20)])).toBe(true);
    expect(isSessionDone(plan.sessions[0], [log('r', WEEK, 30)])).toBe(false);
    expect(sessionsOn(plan, WEEK)).toHaveLength(1);
    expect(sessionsOn(undefined, WEEK)).toEqual([]);
  });
});

describe('recovery, small remainders and keeping done days', () => {
  const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
    id,
    icon: 'guitar',
    color: 'magenta',
    energy: 'creative',
    rhythm: 'fewPerWeek',
    startingMinutes: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  });
  const log = (assetId: string, day: string, minutes = 10): LogEntry => ({ id: assetId + day, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });
  const free = [120, 120, 120, 120, 120, 120, 120];

  it('keeps the recovery sessions when re-planning', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 60 }), asset('recovery', { energy: 'recovery' })];
    const plan: WeekPlan = { weekFrom: WEEK, rest: 120, sessions: [] };
    const next = replanWeek(plan, assets, [], free, parseDay('2026-09-30'));
    expect(next.sessions.filter((s) => s.assetId === 'recovery').reduce((n, s) => n + s.minutes, 0)).toBe(120);
    expect(next.rest).toBe(120);
  });

  it('takes what recovery is already logged off the rest', () => {
    const assets = [asset('recovery', { energy: 'recovery' })];
    const goals = planGoals(assets, [log('recovery', '2026-09-29', 40)], parseDay('2026-09-30'), 120);
    expect(goals).toEqual([{ assetId: 'recovery', minutes: 80, session: { min: 20, max: 60 }, days: ALL_DAYS }]);
  });

  it('keeps only the sessions done up to the given day, that day included', () => {
    const sessions = [
      { id: 'a', assetId: 'g', day: '2026-09-28', minutes: 30 },
      { id: 'b', assetId: 'g', day: '2026-09-29', minutes: 30 },
      { id: 'c', assetId: 'g', day: '2026-10-01', minutes: 30 },
    ];
    expect(keepDone(sessions, '2026-10-01', [log('g', '2026-09-28', 30)]).map((s) => s.id)).toEqual(['a']);
    expect(keepDone(sessions, undefined, [log('g', '2026-09-28', 30)])).toEqual([]);
  });

  it('plans a short remainder as it is instead of rounding it up to a full session', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [{ assetId: 'g', minutes: 15, session: { min: 30, max: 60 }, days: ALL_DAYS }], free });
    expect(r.sessions.map((s) => s.minutes)).toEqual([15]);
    expect(r.shortBy).toEqual([]);
  });

  it('copes with a minimum that is not a multiple of 5', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [{ assetId: 'g', minutes: 90, session: { min: 22, max: 45 }, days: ALL_DAYS }], free: [45, 45, 45, 0, 0, 0, 0] });
    expect(r.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(90);
    expect(r.shortBy).toEqual([]);
  });
});

describe('planReminders', () => {
  const plan: WeekPlan = {
    weekFrom: WEEK,
    sessions: [
      { id: 'a', assetId: 'g', day: '2026-09-29', minutes: 30 },
      { id: 'b', assetId: 'r', day: '2026-09-29', minutes: 20 },
      { id: 'c', assetId: 'g', day: '2026-09-30', minutes: 30 },
      { id: 'd', assetId: 'g', day: '2026-10-01', minutes: 30 },
    ],
  };
  const done = (assetId: string, day: string): LogEntry => ({ id: assetId + day, assetId, day, minutes: 60, createdAt: '2026-01-01T00:00:00Z' });
  const morning = new Date(2026, 8, 29, 8, 0);
  const wake = 7 * 60;
  const bed = 23 * 60;

  it('reminds for today and the next three days', () => {
    const r = planReminders([plan], [], morning, wake, bed);
    expect(r.map((x) => x.day)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
    expect(r[0].sessions).toHaveLength(2);
    expect(r[0].at).toEqual(new Date(2026, 8, 29, 17, 30));
  });

  it('leaves out what is already done, and days with nothing left', () => {
    const r = planReminders([plan], [done('g', '2026-09-29'), done('r', '2026-09-29')], morning, wake, bed);
    expect(r.map((x) => x.day)).toEqual(['2026-09-30', '2026-10-01']);
    expect(planReminders([plan], [done('g', '2026-09-29')], morning, wake, bed)[0].sessions.map((s) => s.id)).toEqual(['b']);
  });

  it('skips a time that has already passed', () => {
    const evening = new Date(2026, 8, 29, 19, 0);
    expect(planReminders([plan], [], evening, wake, bed).map((x) => x.day)).toEqual(['2026-09-30', '2026-10-01']);
  });

  it('keeps the reminder inside a short waking day', () => {
    const r = planReminders([plan], [], morning, 6 * 60, 18 * 60);
    expect(r[0].at).toEqual(new Date(2026, 8, 29, 16, 30));
  });

  it('keeps the afternoon time when bedtime is at or after midnight', () => {
    expect(planReminders([plan], [], morning, wake, 0)[0].at).toEqual(new Date(2026, 8, 29, 17, 30));
    expect(planReminders([plan], [], morning, wake, 30)[0].at).toEqual(new Date(2026, 8, 29, 17, 30));
    expect(planReminders([plan], [], morning, wake, 2 * 60)[0].at).toEqual(new Date(2026, 8, 29, 17, 30));
  });
});

describe('plansAround', () => {
  const session = (day: string) => ({ id: day, assetId: 'a', day, minutes: 30 });
  const thisWeek: WeekPlan = { weekFrom: WEEK, sessions: [session('2026-09-30')] };
  const nextWeek: WeekPlan = { weekFrom: '2026-10-05', sessions: [session('2026-10-06')] };
  const at = (day: string) => parseDay(day);

  it('shows this week and offers the next one from Friday', () => {
    expect(plansAround([thisWeek], at('2026-10-01')).askNext).toBe(false);
    expect(plansAround([thisWeek], at('2026-10-02'))).toMatchObject({ shown: thisWeek, next: undefined, askNext: true });
    expect(plansAround([thisWeek], at('2026-10-04')).askNext).toBe(true);
  });

  it('keeps showing what is left of this week on a Sunday, next to a plan for the next one', () => {
    const r = plansAround([thisWeek, nextWeek], at('2026-10-04'));
    expect(r).toMatchObject({ shown: thisWeek, next: nextWeek, askNext: true });
  });

  it('falls back to next week on a Sunday when this week has no plan, and then asks nothing', () => {
    expect(plansAround([nextWeek], at('2026-10-04'))).toMatchObject({ shown: nextWeek, next: nextWeek, askNext: false });
    expect(plansAround([nextWeek], at('2026-10-02')).shown).toBeUndefined();
  });

  it('offers nothing when there is no plan to sit beside', () => {
    expect(plansAround([], at('2026-10-03')).askNext).toBe(false);
  });
});

describe('how far a session got', () => {
  const session: PlannedSession = { id: 's', assetId: 'g', day: WEEK, minutes: 60 };
  const log = (assetId: string, day: string, minutes: number): LogEntry => ({ id: assetId + day + minutes, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });

  it('is not done by a few minutes, and says what is left', () => {
    expect(isSessionDone(session, [log('g', WEEK, 5)])).toBe(false);
    expect(loggedFor(session, [log('g', WEEK, 5), log('g', WEEK, 25), log('g', '2026-09-29', 40), log('r', WEEK, 40)])).toBe(30);
    expect(minutesLeft(session, [log('g', WEEK, 45)])).toBe(15);
  });

  it('is done at the planned time or more, and nothing is left', () => {
    expect(isSessionDone(session, [log('g', WEEK, 60)])).toBe(true);
    expect(isSessionDone(session, [log('g', WEEK, 90)])).toBe(true);
    expect(minutesLeft(session, [log('g', WEEK, 90)])).toBe(0);
  });

  it('only counts time on the session\'s own day', () => {
    expect(isSessionDone(session, [log('g', '2026-09-29', 120)])).toBe(false);
  });
});

describe('re-planning with today already partly done', () => {
  const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
    id,
    icon: 'guitar',
    color: 'magenta',
    energy: 'creative',
    rhythm: 'fewPerWeek',
    startingMinutes: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  });
  const log = (assetId: string, day: string, minutes: number): LogEntry => ({ id: assetId + day, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });
  const free = [120, 120, 120, 120, 120, 120, 120];
  const today = parseDay('2026-09-30');

  it('keeps today\'s done session and does not plan the same asset on that day again', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 180 })];
    const logs = [log('g', '2026-09-30', 60)];
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'today', assetId: 'g', day: '2026-09-30', minutes: 60 }] };
    const next = replanWeek(plan, assets, logs, free, today);
    expect(next.sessions[0].id).toBe('today');
    expect(next.sessions.filter((s) => s.day === '2026-09-30')).toHaveLength(1);
    expect(next.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(180);
  });

  it('counts what a kept session used of the day\'s free time', () => {
    const goals = [goal('a', 2, ALL_DAYS, 30, 120)];
    const kept: PlannedSession[] = [{ id: 'k', assetId: 'other', day: WEEK, minutes: 90 }];
    const r = planWeek({ weekFrom: WEEK, goals, free: [100, 0, 0, 0, 0, 0, 0], kept });
    // 100 free minus 90 kept leaves 10: not enough for a 30-minute session.
    expect(r.sessions).toEqual([]);
    expect(r.shortBy).toEqual([{ assetId: 'a', minutes: 120 }]);
  });

  it('re-planned midday, a part-logged session is not kept and only what is missing is planned again', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 180 })];
    const logs = [log('g', '2026-09-30', 30)];
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'today', assetId: 'g', day: '2026-09-30', minutes: 60 }] };
    const next = replanWeek(plan, assets, logs, free, today);
    expect(next.sessions.some((s) => s.id === 'today')).toBe(false);
    expect(next.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(150);
  });

  it('re-planned midday, a done session uses up its day\'s free time for other assets', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 60 }), asset('h', { weeklyGoalMinutes: 60 })];
    const logs = [log('g', '2026-09-30', 60)];
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'today', assetId: 'g', day: '2026-09-30', minutes: 60 }] };
    const next = replanWeek(plan, assets, logs, [0, 0, 60, 60, 0, 0, 0], today);
    expect(next.sessions.find((s) => s.assetId === 'h')?.day).toBe('2026-10-01');
  });

  it('a done session does not reappear once re-planned from a later day', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 180 })];
    const logs = [log('g', '2026-09-29', 60)];
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: 'tue', assetId: 'g', day: '2026-09-29', minutes: 60 }] };
    const next = replanWeek(plan, assets, logs, free, today);
    expect(next.sessions.filter((s) => s.id === 'tue')).toHaveLength(1);
    expect(next.sessions.filter((s) => s.day < '2026-09-30')).toHaveLength(1);
  });

  it('plans a week that has not started whole, without this week\'s logged time counting against it', () => {
    const assets = [asset('g', { weeklyGoalMinutes: 120 })];
    // 120 minutes logged this week must not shrink next week's 120-minute goal.
    const logs = [log('g', '2026-09-29', 120)];
    const plan: WeekPlan = { weekFrom: '2026-10-05', sessions: [] };
    const next = replanWeek(plan, assets, logs, free, parseDay('2026-10-04'));
    expect(next.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(120);
    expect(next.sessions.every((s) => s.day >= '2026-10-05' && s.day <= '2026-10-11')).toBe(true);
  });
});

describe('moving and resizing planned sessions', () => {
  const s = (id: string, assetId: string, day: string, minutes = 30): PlannedSession => ({ id, assetId, day, minutes });
  const wed = s('w', 'g', '2026-09-30');

  it('moves a day either way inside the week', () => {
    expect(moveTarget([wed], WEEK, wed, 1)).toBe('2026-10-01');
    expect(moveTarget([wed], WEEK, wed, -1)).toBe('2026-09-29');
  });

  it('stays inside the week', () => {
    expect(moveTarget([s('m', 'g', WEEK)], WEEK, s('m', 'g', WEEK), -1)).toBeNull();
    expect(moveTarget([s('u', 'g', '2026-10-04')], WEEK, s('u', 'g', '2026-10-04'), 1)).toBeNull();
  });

  it('does not go before the first day that can still change', () => {
    expect(moveTarget([wed], WEEK, wed, -1, '2026-09-30')).toBeNull();
    expect(moveTarget([wed], WEEK, wed, -1, '2026-09-29')).toBe('2026-09-29');
  });

  it('jumps over a day that already has the same asset, but not over other assets', () => {
    const thu = s('t', 'g', '2026-10-01');
    expect(moveTarget([wed, thu], WEEK, wed, 1)).toBe('2026-10-02');
    expect(moveTarget([wed, s('t', 'other', '2026-10-01')], WEEK, wed, 1)).toBe('2026-10-01');
  });

  it('gives up when every day that way is taken or out of the week', () => {
    const rest = [s('a', 'g', '2026-10-01'), s('b', 'g', '2026-10-02'), s('c', 'g', '2026-10-03'), s('d', 'g', '2026-10-04')];
    expect(moveTarget([wed, ...rest], WEEK, wed, 1)).toBeNull();
  });

  it('steps a session by a quarter of an hour, between 15 minutes and 4 hours', () => {
    expect(resized(30, 1)).toBe(45);
    expect(resized(30, -1)).toBe(15);
    expect(resized(15, -1)).toBe(15);
    expect(resized(240, 1)).toBe(240);
  });

  it('says how far past the free time a day goes', () => {
    const sessions = [s('a', 'g', WEEK, 60), s('b', 'r', WEEK, 45)];
    expect(overFree(sessions, WEEK, [90, 0, 0, 0, 0, 0, 0])).toBe(15);
    expect(overFree(sessions, WEEK, [120, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(overFree(sessions, WEEK, [0, 0, 0, 0, 0, 0, 0])).toBe(105);
    expect(overFree(sessions, WEEK, undefined)).toBe(0);
  });
});

describe('where a plan starts from', () => {
  const plan = (weekFrom: string, free?: number[], rest?: number): WeekPlan => ({ weekFrom, sessions: [], free, rest });

  it('uses the defaults when there are no plans', () => {
    expect(previousSetup([], WEEK)).toEqual({ free: DEFAULT_FREE, rest: undefined });
  });

  it('starts next week from the newest plan\'s free time and rest', () => {
    const plans = [plan('2026-09-21', [30, 30, 30, 30, 30, 0, 0], 60), plan(WEEK, [90, 90, 90, 90, 90, 120, 120], 120)];
    expect(previousSetup(plans, '2026-10-05')).toEqual({ free: [90, 90, 90, 90, 90, 120, 120], rest: 120 });
  });

  it('prefers the week\'s own plan', () => {
    const plans = [plan(WEEK, [30, 30, 30, 30, 30, 0, 0], 0), plan('2026-10-05', [60, 60, 60, 60, 60, 60, 60], 30)];
    expect(previousSetup(plans, WEEK)).toEqual({ free: [30, 30, 30, 30, 30, 0, 0], rest: 0 });
  });

  it('skips plans made before free time was saved', () => {
    expect(previousSetup([plan('2026-09-21', [45, 45, 45, 45, 45, 0, 0]), plan(WEEK)], '2026-10-05').free).toEqual([45, 45, 45, 45, 45, 0, 0]);
  });

  it('carries the rest of an automatic plan, which saves no free time, into the next week', () => {
    expect(previousSetup([plan('2026-09-21', [45, 45, 45, 45, 45, 0, 0], 60), plan(WEEK, undefined, 120)], '2026-10-05')).toEqual({ free: [45, 45, 45, 45, 45, 0, 0], rest: 120 });
  });
});

describe('the order of sessions in a day', () => {
  it('follows the order the goals were given in, not the asset ids', () => {
    const goals = [goal('zumba', 1, [0], 60, 60), goal('arts', 1, [0], 60, 60)];
    const r = planWeek({ weekFrom: WEEK, goals, free: [240, 0, 0, 0, 0, 0, 0] });
    expect(r.sessions.map((x) => x.assetId)).toEqual(['zumba', 'arts']);
  });

  it('sorts a day by the portfolio order when given one', () => {
    const plan: WeekPlan = { weekFrom: WEEK, sessions: [{ id: '1', assetId: 'b', day: WEEK, minutes: 30 }, { id: '2', assetId: 'a', day: WEEK, minutes: 30 }, { id: '3', assetId: 'x', day: WEEK, minutes: 30 }] };
    expect(sessionsOn(plan, WEEK, ['a', 'b']).map((x) => x.id)).toEqual(['2', '1', '3']);
    expect(sessionsOn(plan, WEEK).map((x) => x.id)).toEqual(['1', '2', '3']);
  });
});

describe('mergeMove', () => {
  const s = (id: string, assetId: string, day: string, minutes: number): PlannedSession => ({ id, assetId, day, minutes });

  it('moves a session to an empty day', () => {
    const out = mergeMove([s('a', 'guitar', '2026-09-28', 30)], 'a', '2026-09-29');
    expect(out).toEqual([s('a', 'guitar', '2026-09-29', 30)]);
  });

  it('adds the minutes when the day already holds the same asset', () => {
    const out = mergeMove([s('a', 'guitar', '2026-09-28', 30), s('b', 'guitar', '2026-09-29', 30), s('c', 'reading', '2026-09-29', 20)], 'a', '2026-09-29');
    expect(out).toHaveLength(2);
    expect(out.find((x) => x.id === 'b')?.minutes).toBe(60);
    expect(out.find((x) => x.id === 'c')?.minutes).toBe(20);
  });

  it('leaves everything alone when dropped on its own day', () => {
    const list = [s('a', 'guitar', '2026-09-28', 30)];
    expect(mergeMove(list, 'a', '2026-09-28')).toBe(list);
  });
});

describe('dropDays', () => {
  it('lists the days from the first editable one to Sunday', () => {
    expect(dropDays(WEEK, '2026-10-01')).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  });
});

describe('odd remainders', () => {
  const free = [120, 120, 120, 120, 120, 120, 120];

  it('rounds a remainder that is not a whole number of steps instead of looping forever', () => {
    const r = planWeek({ weekFrom: WEEK, goals: [{ assetId: 'rest', minutes: 127, session: { min: 20, max: 60 }, days: ALL_DAYS }], free });
    expect(r.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(125);
    expect(r.shortBy).toEqual([]);
    expect(planWeek({ weekFrom: WEEK, goals: [{ assetId: 'g', minutes: 2, session: { min: 20, max: 60 }, days: ALL_DAYS }], free })).toEqual({ sessions: [], shortBy: [] });
  });

  it('plans what sample rest logs leave over (their minutes are not multiples of five)', () => {
    const recovery: Asset = { id: 'recovery', icon: 'moon', color: 'sky', energy: 'recovery', rhythm: 'fewPerWeek', startingMinutes: 0, createdAt: '' };
    const goals = planGoals([recovery], [{ id: 'l', assetId: 'recovery', day: WEEK, minutes: 173, createdAt: '' }], parseDay('2026-09-29'), 300);
    expect(goals[0].minutes).toBe(127);
    const r = autoPlan({ weekFrom: WEEK, goals, fromDay: '2026-09-29' });
    expect(r.sessions.reduce((n, s) => n + s.minutes, 0)).toBe(125);
  });
});

describe('autoPlan', () => {
  it('never puts more than the daily maximum on a day, even when planned at the weekend', () => {
    const goals = [goal('a', 8, ALL_DAYS, 30, 120), goal('b', 6, ALL_DAYS, 30, 120), goal('c', 6, ALL_DAYS, 30, 120)];
    const r = autoPlan({ weekFrom: WEEK, goals, fromDay: '2026-10-03' });
    const perDay = new Map<string, number>();
    for (const s of r.sessions) perDay.set(s.day, (perDay.get(s.day) ?? 0) + s.minutes);
    expect(perDay.size).toBe(2);
    for (const m of perDay.values()) expect(m).toBeLessThanOrEqual(240);
    expect(r.shortBy.length).toBeGreaterThan(0);
  });

  it('fits goals the default free time would drop', () => {
    const goals = [goal('a', 3), goal('b', 3), goal('c', 3), goal('d', 3), goal('e', 3), goal('f', 3)];
    const r = autoPlan({ weekFrom: WEEK, goals });
    expect(r.shortBy).toEqual([]);
    for (const g of goals) expect(total(r, g.assetId)).toBe(g.minutes);
  });

  it('plans only the days left when starting midweek', () => {
    const r = autoPlan({ weekFrom: WEEK, goals: [goal('a', 2)], fromDay: '2026-10-01' });
    expect(r.sessions.every((x) => x.day >= '2026-10-01')).toBe(true);
    expect(r.shortBy).toEqual([]);
  });
});

describe('dayProgress', () => {
  const plan: WeekPlan = {
    weekFrom: WEEK,
    sessions: [
      { id: 'a', assetId: 'guitar', day: '2026-09-28', minutes: 30 },
      { id: 'b', assetId: 'reading', day: '2026-09-28', minutes: 20 },
    ],
  };
  const log = (assetId: string, minutes: number): LogEntry => ({ id: assetId, assetId, day: '2026-09-28', minutes, createdAt: '2026-09-28T10:00:00Z' });

  it('lets time beyond a session grow the plan, so the bar matches the totals', () => {
    expect(dayProgress(plan, '2026-09-28', [log('guitar', 45), log('reading', 5)])).toEqual({ planned: 65, done: 50 });
  });

  it('counts an asset that was not planned that day on both sides', () => {
    expect(dayProgress(plan, '2026-09-28', [log('anime', 60)])).toEqual({ planned: 110, done: 60 });
  });

  it('is empty for a day without a plan', () => {
    expect(dayProgress(plan, '2026-09-29', [])).toEqual({ planned: 0, done: 0 });
    expect(dayProgress(undefined, '2026-09-28', [])).toEqual({ planned: 0, done: 0 });
  });
});
