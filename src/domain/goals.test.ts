import { addDays, dayKey } from './dates';
import { allGoalsMet, goalMetBy, nudgeTime, sceneArt, stageIndex, weekNudge, weekRange } from './goals';
import type { Asset, LogEntry } from './types';

describe('weekly goals', () => {
  const monday = new Date(2026, 8, 28);
  const asset = (over: Partial<Asset> = {}): Asset => ({
    id: 'g',
    catalogId: 'guitar',
    icon: 'guitar',
    color: 'magenta',
    energy: 'creative',
    rhythm: 'fewPerWeek',
    startingMinutes: 0,
    weeklyGoalMinutes: 120,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  });
  const log = (offset: number, minutes: number, assetId = 'g'): LogEntry => ({
    id: `${assetId}${offset}${minutes}`,
    assetId,
    day: dayKey(addDays(monday, offset)),
    minutes,
    createdAt: '2026-01-01T00:00:00Z',
  });

  it('reports the entry that crosses the goal, once', () => {
    const a = asset();
    const before = [log(0, 60)];
    expect(goalMetBy(log(1, 60), [a], before)?.id).toBe('g');
    expect(goalMetBy(log(1, 30), [a], before)).toBeNull();
    // Already met: logging more is not a new congrats.
    expect(goalMetBy(log(2, 30), [a], [...before, log(1, 60)])).toBeNull();
  });

  it('only counts the week the entry is in', () => {
    const lastWeek = [log(-3, 110)];
    expect(goalMetBy(log(0, 30), [asset()], lastWeek)).toBeNull();
  });

  it('ignores assets without a goal', () => {
    expect(goalMetBy(log(0, 500), [asset({ weeklyGoalMinutes: undefined })], [])).toBeNull();
  });

  it('knows when every goal is met', () => {
    const assets = [asset(), asset({ id: 'r', weeklyGoalMinutes: 60 }), asset({ id: 'x', weeklyGoalMinutes: undefined })];
    const week = weekRange(monday);
    expect(week).toEqual({ from: '2026-09-28', to: '2026-10-04' });
    expect(allGoalsMet(assets, [log(0, 120), log(1, 30, 'r')], week)).toBe(false);
    expect(allGoalsMet(assets, [log(0, 120), log(1, 60, 'r')], week)).toBe(true);
    expect(allGoalsMet([asset({ weeklyGoalMinutes: undefined })], [], week)).toBe(false);
  });

  it('shows the last growth stage only when the goal is met', () => {
    expect(stageIndex(0, 4)).toBe(0);
    expect(stageIndex(0.5, 4)).toBe(1);
    expect(stageIndex(0.99, 4)).toBe(2);
    expect(stageIndex(1, 4)).toBe(3);
    expect(stageIndex(2, 4)).toBe(3);
  });

  it('dresses scenes up for the season', () => {
    expect(sceneArt('dog', null).goal).toBe('🦴');
    expect(sceneArt('dog', 'halloween').goal).toBe('🍬');
    expect(sceneArt('tree', 'winter').stages?.at(-1)).toBe('🎄');
  });
});

describe('end-of-week nudge', () => {
  const asset = (id: string, goal: number | undefined): Asset => ({
    id,
    catalogId: 'guitar',
    icon: 'guitar',
    color: 'magenta',
    energy: 'creative',
    rhythm: 'fewPerWeek',
    startingMinutes: 0,
    weeklyGoalMinutes: goal,
    createdAt: '2026-01-01T00:00:00Z',
  });
  const log = (assetId: string, day: string, minutes: number): LogEntry => ({ id: assetId + day + minutes, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });
  const thursday = new Date(2026, 9, 1, 12);

  it('goes out on Sunday at 17:00', () => {
    expect(nudgeTime(thursday)).toEqual(new Date(2026, 9, 4, 17, 0));
  });

  it('picks the goal that is closest to done', () => {
    const assets = [asset('a', 180), asset('b', 240), asset('c', 60)];
    const logs = [log('a', '2026-09-29', 150), log('b', '2026-09-30', 200), log('c', '2026-09-30', 10)];
    const n = weekNudge(assets, logs, thursday);
    expect(n?.asset.id).toBe('a');
    expect(n?.remaining).toBe(30);
  });

  it('stays quiet when nothing is nearly done, already met, or the time has passed', () => {
    expect(weekNudge([asset('a', 180)], [log('a', '2026-09-29', 60)], thursday)).toBeNull();
    expect(weekNudge([asset('a', 180)], [log('a', '2026-09-29', 200)], thursday)).toBeNull();
    expect(weekNudge([asset('a', 180)], [log('a', '2026-09-29', 170)], new Date(2026, 9, 4, 18))).toBeNull();
    expect(weekNudge([asset('a', undefined)], [], thursday)).toBeNull();
  });

  it('never nudges for more than two hours', () => {
    expect(weekNudge([asset('a', 1200)], [log('a', '2026-09-29', 1000)], thursday)).toBeNull();
  });
});
