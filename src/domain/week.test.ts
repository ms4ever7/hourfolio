import { addDays, dayKey } from './dates';
import { lastWeekFrom, weekCelebrationKey, weekSummary } from './week';
import { RECOVERY_ID, type Asset, type LogEntry } from './types';
import type { WeekPlan } from './plan';

const monday = new Date(2026, 8, 28);
const from = dayKey(monday);
const asset = (id: string, goal?: number): Asset => ({
  id,
  catalogId: id,
  icon: 'guitar',
  color: 'magenta',
  energy: 'creative',
  rhythm: 'fewPerWeek',
  startingMinutes: 0,
  weeklyGoalMinutes: goal,
  createdAt: '2026-01-01T00:00:00Z',
});
const log = (assetId: string, offset: number, minutes: number): LogEntry => ({ id: `${assetId}${offset}${minutes}`, assetId, day: dayKey(addDays(monday, offset)), minutes, createdAt: '2026-01-01T00:00:00Z' });

describe('weekSummary', () => {
  const assets = [asset('a', 120), asset('b', 60), asset(RECOVERY_ID, 60), asset('c')];

  it('counts goals met and finds the top asset, recovery aside', () => {
    const logs = [log('a', 0, 120), log('b', 1, 30), log(RECOVERY_ID, 2, 90), log('c', 3, 45)];
    const s = weekSummary(assets, logs, undefined, from);
    expect(s.total).toBe(285);
    expect(s.goals).toHaveLength(3);
    expect(s.goalsMet).toBe(2);
    expect(s.allMet).toBe(false);
    expect(s.top?.asset.id).toBe('a');
    expect(s.restDays).toBe(1);
    expect(s.light).toBe(false);
  });

  it('is all met only when every goal is, and light when under half', () => {
    expect(weekSummary(assets, [log('a', 0, 120), log('b', 0, 60), log(RECOVERY_ID, 1, 60)], undefined, from).allMet).toBe(true);
    expect(weekSummary(assets, [log('a', 0, 10)], undefined, from).light).toBe(true);
    expect(weekSummary([asset('c')], [log('c', 0, 10)], undefined, from)).toMatchObject({ allMet: false, light: false });
  });

  it('compares with the week before and counts planned sessions', () => {
    const plan: WeekPlan = {
      weekFrom: from,
      sessions: [
        { id: '1', assetId: 'a', day: from, minutes: 60 },
        { id: '2', assetId: 'b', day: from, minutes: 30 },
      ],
    };
    const s = weekSummary(assets, [log('a', -3, 50), log('a', 0, 60)], plan, from);
    expect(s.previousTotal).toBe(50);
    expect(s.sessionsPlanned).toBe(2);
    expect(s.sessionsDone).toBe(1);
    // A plan for another week is not this week's.
    expect(weekSummary(assets, [], plan, dayKey(addDays(monday, 7))).sessionsPlanned).toBe(0);
  });

  it('judges a week by the goals it had then', () => {
    const then = [{ weekFrom: from, goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a', 'b', 'c'] }];
    const s = weekSummary(assets, [log('a', 0, 60)], undefined, from, then);
    expect(s.goals.map((g) => g.asset.id)).toEqual(['a']);
    expect(s.allMet).toBe(true);
    expect(weekSummary(assets, [log('a', 0, 60)], undefined, from).allMet).toBe(false);
  });

  it('names last week and keys a celebration', () => {
    expect(lastWeekFrom(addDays(monday, 2))).toBe(dayKey(addDays(monday, -7)));
    expect(weekCelebrationKey(from)).toBe(`week@${from}`);
  });
});
