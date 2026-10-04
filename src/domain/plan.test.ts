import { daysBetween, parseDay } from './dates';
import { ALL_DAYS, defaultSessionRange, goalsFromAssets, isSessionDone, keepDone, planGoals, planReminders, planWeek, replanWeek, sessionsOn, type PlanGoal, type WeekPlan } from './plan';
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
    expect(isSessionDone(plan.sessions[0], [log('g', WEEK, 10)])).toBe(true);
    expect(isSessionDone(plan.sessions[0], [log('r', WEEK, 10)])).toBe(false);
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

  it('keeps only the done sessions from before the given day', () => {
    const sessions = [
      { id: 'a', assetId: 'g', day: '2026-09-28', minutes: 30 },
      { id: 'b', assetId: 'g', day: '2026-09-29', minutes: 30 },
      { id: 'c', assetId: 'g', day: '2026-10-01', minutes: 30 },
    ];
    expect(keepDone(sessions, '2026-10-01', [log('g', '2026-09-28')]).map((s) => s.id)).toEqual(['a']);
    expect(keepDone(sessions, undefined, [log('g', '2026-09-28')])).toEqual([]);
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
  const done = (assetId: string, day: string): LogEntry => ({ id: assetId + day, assetId, day, minutes: 10, createdAt: '2026-01-01T00:00:00Z' });
  const morning = new Date(2026, 8, 29, 8, 0);
  const wake = 7 * 60;
  const bed = 23 * 60;

  it('reminds for today and tomorrow only', () => {
    const r = planReminders([plan], [], morning, wake, bed);
    expect(r.map((x) => x.day)).toEqual(['2026-09-29', '2026-09-30']);
    expect(r[0].sessions).toHaveLength(2);
    expect(r[0].at).toEqual(new Date(2026, 8, 29, 17, 30));
  });

  it('leaves out what is already done, and days with nothing left', () => {
    const r = planReminders([plan], [done('g', '2026-09-29'), done('r', '2026-09-29')], morning, wake, bed);
    expect(r.map((x) => x.day)).toEqual(['2026-09-30']);
    expect(planReminders([plan], [done('g', '2026-09-29')], morning, wake, bed)[0].sessions.map((s) => s.id)).toEqual(['b']);
  });

  it('skips a time that has already passed', () => {
    const evening = new Date(2026, 8, 29, 19, 0);
    expect(planReminders([plan], [], evening, wake, bed).map((x) => x.day)).toEqual(['2026-09-30']);
  });

  it('keeps the reminder inside a short waking day', () => {
    const r = planReminders([plan], [], morning, 6 * 60, 18 * 60);
    expect(r[0].at).toEqual(new Date(2026, 8, 29, 16, 30));
  });
});
