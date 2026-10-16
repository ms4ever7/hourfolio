import { logResized, minutesByAsset, quickAssets, todaysSessions } from './today';
import type { Asset, LogEntry } from './types';

const asset = (id: string): Asset => ({ id, catalogId: id, icon: 'guitar', color: 'magenta', energy: 'creative', rhythm: 'fewPerWeek', startingMinutes: 0, createdAt: '2026-01-01T00:00:00Z' });
const log = (assetId: string, day: string, createdAt = `${day}T10:00:00Z`): LogEntry => ({ id: assetId + createdAt, assetId, day, minutes: 30, createdAt });
const today = new Date(2026, 8, 29);

describe('quick-log assets', () => {
  const assets = [asset('guitar'), asset('run'), asset('code'), asset('recovery')];

  it('puts the most logged lately first and leaves recovery out', () => {
    const logs = [log('code', '2026-09-28'), log('code', '2026-09-27'), log('run', '2026-09-20'), log('recovery', '2026-09-28'), log('recovery', '2026-09-27')];
    expect(quickAssets(assets, logs, today, 3).map((a) => a.id)).toEqual(['code', 'run', 'guitar']);
  });

  it('ignores sessions older than four weeks and falls back to portfolio order', () => {
    expect(quickAssets(assets, [log('code', '2026-08-01')], today, 2).map((a) => a.id)).toEqual(['guitar', 'run']);
  });
});

it("lists today's sessions, newest first", () => {
  const logs = [log('guitar', '2026-09-29', '2026-09-29T08:00:00Z'), log('run', '2026-09-28'), log('code', '2026-09-29', '2026-09-29T12:00:00Z')];
  expect(todaysSessions(logs, today).map((l) => l.assetId)).toEqual(['code', 'guitar']);
});

it('sums today by asset, keeping the newest first', () => {
  const sessions = todaysSessions([log('guitar', '2026-09-29', '2026-09-29T12:00:00Z'), log('code', '2026-09-29', '2026-09-29T10:00:00Z'), log('guitar', '2026-09-29', '2026-09-29T08:00:00Z')], today);
  expect(minutesByAsset(sessions)).toEqual([
    { assetId: 'guitar', minutes: 60, parts: [30, 30] },
    { assetId: 'code', minutes: 30, parts: [30] },
  ]);
});

it('lists the entries of an asset oldest first, so 20 then 10 reads in order', () => {
  const entry = (minutes: number, createdAt: string): LogEntry => ({ id: createdAt, assetId: 'yoga', day: '2026-09-29', minutes, createdAt });
  const sessions = todaysSessions([entry(10, '2026-09-29T12:00:00Z'), entry(20, '2026-09-29T08:00:00Z')], today);
  expect(minutesByAsset(sessions)).toEqual([{ assetId: 'yoga', minutes: 30, parts: [20, 10] }]);
});

describe('logResized', () => {
  it('steps a quarter hour and keeps small entries from jumping up', () => {
    expect(logResized(45, 1)).toBe(60);
    expect(logResized(45, -1)).toBe(30);
    expect(logResized(10, -1)).toBe(5);
    expect(logResized(5, -1)).toBe(5);
  });

  it('does not cut a long entry short', () => {
    expect(logResized(300, 1)).toBe(315);
    expect(logResized(300, -1)).toBe(285);
  });
});
