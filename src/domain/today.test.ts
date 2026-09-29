import { minutesByAsset, quickAssets, todaysSessions } from './today';
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
    { assetId: 'guitar', minutes: 60 },
    { assetId: 'code', minutes: 30 },
  ]);
});
