import { assetBadgeId, badgesAhead, detectBadges, historySummary, loggedMinutes, parseBadge, sortEarned, weekHistory } from './achievements';
import { addDays, dayKey } from './dates';
import type { WeekGoals } from './goal-history';
import type { WeekPlan } from './plan';
import { RECOVERY_ID, type Asset, type LogEntry } from './types';

const monday = new Date(2026, 8, 28);
const day = (offset: number) => dayKey(addDays(monday, offset));
const asset = (id: string, goal?: number): Asset => ({
  id,
  catalogId: id,
  icon: 'guitar',
  color: 'magenta',
  energy: 'creative',
  rhythm: 'fewPerWeek',
  startingMinutes: 600,
  weeklyGoalMinutes: goal,
  createdAt: '2026-01-01T00:00:00Z',
});
const log = (assetId: string, offset: number, minutes: number): LogEntry => ({ id: `${assetId}@${offset}:${minutes}`, assetId, day: day(offset), minutes, createdAt: '2026-01-01T00:00:00Z' });

describe('weekHistory', () => {
  const assets = [asset('a', 120), asset('b', 60), asset(RECOVERY_ID), asset('c')];

  it('lists finished weeks with logs, newest first, and leaves out the current and empty weeks', () => {
    const logs = [log('a', -14, 30), log('a', 0, 120), log('b', 3, 60), log('c', 7, 45)];
    const history = weekHistory(assets, logs, addDays(monday, 9));
    expect(history.map((r) => r.weekFrom)).toEqual([day(0), day(-14)]);
    expect(history[0]).toMatchObject({ total: 180, goalsMet: 2, goalsTotal: 2, allMet: true, best: true });
    expect(history[1]).toMatchObject({ total: 30, goalsMet: 0, allMet: false, best: false });
  });

  it('keeps a finished week as it was judged then, whatever the goals are now', () => {
    const then: WeekGoals[] = [{ weekFrom: day(-7), goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a'] }];
    const now = [asset('a', 600)];
    expect(weekHistory(now, [log('a', -7, 60)], addDays(monday, 1), then)[0]).toMatchObject({ goalsMet: 1, goalsTotal: 1, allMet: true });
    expect(weekHistory(now, [log('a', -7, 60)], addDays(monday, 1))[0]).toMatchObject({ goalsMet: 0, goalsTotal: 1, allMet: false });
  });

  it('is never all met without a goal, and sums up', () => {
    const history = weekHistory([asset('c')], [log('c', 0, 50), log('c', -7, 70)], addDays(monday, 7));
    expect(history.every((r) => !r.allMet && r.goalsTotal === 0)).toBe(true);
    expect(historySummary(history)).toEqual({ weeks: 2, total: 120, fullWeeks: 0, best: 70 });
    expect(historySummary([])).toEqual({ weeks: 0, total: 0, fullWeeks: 0, best: 0 });
  });
});

describe('detectBadges', () => {
  const ids = (assets: Asset[], logs: LogEntry[], plans: WeekPlan[] = [], history: WeekGoals[] = []) => Object.fromEntries(detectBadges(assets, logs, plans, history).map((b) => [b.id, b]));

  it('judges the week badges by the goals and hobbies the week had, not by today’s', () => {
    const assets = [asset('a', 300), asset('b', 60)];
    const logs = [log('a', 0, 60), log('b', 0, 60)];
    const then: WeekGoals[] = [{ weekFrom: day(0), goals: [{ assetId: 'a', minutes: 60 }, { assetId: 'b', minutes: 60 }], hobbies: ['a', 'b'] }];
    expect(ids(assets, logs, [], then).firstFullWeek).toMatchObject({ day: day(0) });
    expect(ids(assets, logs).firstFullWeek).toBeUndefined();
    const three = [asset('a'), asset('b'), asset('c')];
    const twoThen: WeekGoals[] = [{ weekFrom: day(0), goals: [], hobbies: ['a', 'b'] }];
    expect(ids(three, [log('a', 0, 30), log('b', 1, 30)], [], twoThen).allHobbiesWeek).toBeUndefined();
    expect(ids(three, [log('a', 0, 30), log('b', 1, 30), log('c', 2, 30)], [], twoThen).allHobbiesWeek).toBeUndefined();
    expect(ids(three, [log('a', 0, 30), log('b', 1, 30), log('c', 2, 30)]).allHobbiesWeek).toMatchObject({ day: day(2) });
  });

  it('dates the first hour and the hundredth to the day the total got there', () => {
    const logs = [log('a', 0, 30), log('a', 1, 30), ...Array.from({ length: 20 }, (_, i) => log('a', 2 + i, 300))];
    const found = ids([asset('a')], logs);
    expect(found.firstHour).toEqual({ id: 'firstHour', day: day(1), weekFrom: day(0) });
    expect(found.hundredHours.day).toBe(day(21));
    expect(ids([asset('a')], [log('a', 0, 59)]).firstHour).toBeUndefined();
  });

  it('finds the first ten- and twenty-hour weeks on the day they tipped over', () => {
    const logs = [log('a', 0, 300), log('a', 1, 300), log('a', 2, 60), log('a', 7, 600), log('a', 8, 600)];
    const found = ids([asset('a')], logs);
    expect(found.tenHourWeek.day).toBe(day(1));
    expect(found.twentyHourWeek.day).toBe(day(8));
  });

  it('counts rest on three days of one week', () => {
    const logs = [log(RECOVERY_ID, 0, 30), log(RECOVERY_ID, 0, 30), log(RECOVERY_ID, 2, 30), log(RECOVERY_ID, 7, 30), log(RECOVERY_ID, 9, 30), log(RECOVERY_ID, 10, 30)];
    expect(ids([asset(RECOVERY_ID)], logs).restCounts).toMatchObject({ day: day(10), weekFrom: day(7) });
  });

  it('needs three hobbies all getting time in one week; recovery does not count', () => {
    const three = [asset('a'), asset('b'), asset('c'), asset(RECOVERY_ID)];
    const logs = [log('a', 0, 30), log(RECOVERY_ID, 1, 30), log('b', 2, 30), log('c', 4, 30)];
    expect(ids(three, logs).allHobbiesWeek).toMatchObject({ day: day(4) });
    expect(ids([asset('a'), asset('b')], logs).allHobbiesWeek).toBeUndefined();
    expect(ids(three, [log('a', 0, 30), log('b', 2, 30), log('c', 7, 30)]).allHobbiesWeek).toBeUndefined();
  });

  it('dates the first full week to the day the last goal was met', () => {
    const assets = [asset('a', 60), asset('b', 60)];
    const logs = [log('a', 0, 60), log('b', 3, 30), log('b', 5, 30), log('a', 7, 60), log('b', 7, 60)];
    expect(ids(assets, logs).firstFullWeek).toMatchObject({ day: day(5), weekFrom: day(0) });
    expect(ids([asset('a')], logs).firstFullWeek).toBeUndefined();
  });

  it('awards a plan done once every session is, and hour marks per hobby from the logs alone', () => {
    const plan: WeekPlan = { weekFrom: day(0), sessions: [{ id: '1', assetId: 'a', day: day(0), minutes: 60 }, { id: '2', assetId: 'a', day: day(3), minutes: 30 }] };
    const logs = [log('a', 0, 60), log('a', 3, 30), ...Array.from({ length: 10 }, (_, i) => log('a', 10 + i, 300)), log(RECOVERY_ID, 1, 6000)];
    const found = ids([asset('a'), asset(RECOVERY_ID)], logs, [plan]);
    expect(found.planDone).toMatchObject({ day: day(3), weekFrom: day(0) });
    expect(found[assetBadgeId('a', 50)].day).toBe(day(19));
    expect(found[assetBadgeId('a', 200)]).toBeUndefined();
    expect(found[assetBadgeId(RECOVERY_ID, 50)]).toBeUndefined();
    expect(ids([asset('a')], [log('a', 0, 60), log('a', 3, 20)], [plan]).planDone).toBeUndefined();
  });
});

describe('badges ahead', () => {
  it('lists fixed badges not earned, then each hobby’s next hour mark', () => {
    const assets = [asset('a'), asset('b'), asset(RECOVERY_ID)];
    const ahead = badgesAhead(assets, ['firstHour', assetBadgeId('a', 50)]);
    expect(ahead.map((b) => b.id)).toEqual(['firstFullWeek', 'tenHourWeek', 'restCounts', 'allHobbiesWeek', 'planDone', 'hundredHours', 'twentyHourWeek', assetBadgeId('a', 200), assetBadgeId('b', 50)]);
    expect(ahead.at(-1)).toMatchObject({ kind: 'asset', assetId: 'b', hours: 50 });
  });

  it('parses ids both ways and keeps asset ids with colons apart from the hours', () => {
    expect(parseBadge('tenHourWeek')).toEqual({ id: 'tenHourWeek', kind: 'fixed' });
    expect(parseBadge(assetBadgeId('a:1', 200))).toEqual({ id: 'hours:a:1:200', kind: 'asset', assetId: 'a:1', hours: 200 });
    expect(parseBadge('nope')).toBeNull();
  });

  it('counts logged minutes without starting capital and sorts earned badges newest first', () => {
    const logs = [log('a', 0, 30), log('b', 1, 40)];
    expect(loggedMinutes(logs)).toBe(70);
    expect(loggedMinutes(logs, 'a')).toBe(30);
    expect(sortEarned([{ id: 'x', day: day(0), weekFrom: day(0) }, { id: 'y', day: day(3), weekFrom: day(0) }]).map((b) => b.id)).toEqual(['y', 'x']);
  });
});
