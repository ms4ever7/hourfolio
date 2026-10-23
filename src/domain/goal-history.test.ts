import { goalsForWeek, hobbiesForWeek, sameSnapshot, snapshotGoals, weeksToFreeze, withoutAsset, withWeekGoals, type WeekGoals } from './goal-history';
import { RECOVERY_ID, type Asset, type LogEntry } from './types';

const asset = (id: string, goal?: number): Asset => ({ id, catalogId: id, icon: 'guitar', color: 'magenta', energy: 'creative', rhythm: 'fewPerWeek', startingMinutes: 0, weeklyGoalMinutes: goal, createdAt: '2026-01-01T00:00:00Z' });
const log = (assetId: string, day: string): LogEntry => ({ id: assetId + day, assetId, day, minutes: 30, createdAt: '2026-01-01T00:00:00Z' });
const WEEK = '2026-09-28';

describe('goal snapshots', () => {
  const assets = [asset('a', 120), asset('b'), asset(RECOVERY_ID, 60)];

  it('takes the goals and the hobbies of the moment', () => {
    expect(snapshotGoals(assets)).toEqual({ goals: [{ assetId: 'a', minutes: 120 }, { assetId: RECOVERY_ID, minutes: 60 }], hobbies: ['a', 'b'] });
    expect(sameSnapshot(snapshotGoals(assets), snapshotGoals([...assets]))).toBe(true);
    expect(sameSnapshot(snapshotGoals(assets), snapshotGoals([asset('a', 300), asset('b'), asset(RECOVERY_ID, 60)]))).toBe(false);
  });

  it('judges a week by its own snapshot, and by today only without one', () => {
    const history: WeekGoals[] = [{ weekFrom: WEEK, goals: [{ assetId: 'a', minutes: 60 }, { assetId: 'gone', minutes: 60 }], hobbies: ['a', 'gone'] }];
    const now = [asset('a', 300), asset('b', 60)];
    expect(goalsForWeek(history, now, WEEK)).toEqual([{ asset: now[0], minutes: 60 }]);
    expect(goalsForWeek(history, now, '2026-10-05').map((g) => g.minutes)).toEqual([300, 60]);
    expect(hobbiesForWeek(history, now, WEEK)).toEqual(['a']);
    expect(hobbiesForWeek(history, now, '2026-10-05')).toEqual(['a', 'b']);
  });

  it('freezes finished weeks with logs that have no snapshot, never the current week', () => {
    const logs = [log('a', '2026-09-15'), log('a', '2026-09-16'), log('a', '2026-09-29'), log('a', '2026-10-06')];
    expect(weeksToFreeze([], logs, new Date(2026, 9, 7))).toEqual(['2026-09-14', WEEK]);
    expect(weeksToFreeze([{ weekFrom: WEEK, goals: [], hobbies: [] }], logs, new Date(2026, 9, 7))).toEqual(['2026-09-14']);
  });

  it('replaces a week in place, keeps the list sorted, and forgets a deleted hobby', () => {
    let history = withWeekGoals([], '2026-10-05', { goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a', 'b'] });
    history = withWeekGoals(history, WEEK, { goals: [{ assetId: 'b', minutes: 30 }], hobbies: ['a', 'b'] });
    history = withWeekGoals(history, WEEK, { goals: [{ assetId: 'b', minutes: 45 }], hobbies: ['a', 'b'] });
    expect(history.map((w) => w.weekFrom)).toEqual([WEEK, '2026-10-05']);
    expect(history[0].goals).toEqual([{ assetId: 'b', minutes: 45 }]);
    expect(withoutAsset(history, 'b')).toEqual([
      { weekFrom: WEEK, goals: [], hobbies: ['a'] },
      { weekFrom: '2026-10-05', goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a'] },
    ]);
  });
});
