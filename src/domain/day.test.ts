import { checkInTimes, formatClock, restingAsset } from './day';
import type { Asset, LogEntry } from './types';

const log = (assetId: string, day: string, minutes = 30): LogEntry => ({ id: assetId + day, assetId, day, minutes, createdAt: '2026-01-01T00:00:00Z' });
const asset = (id: string, over: Partial<Asset> = {}): Asset => ({
  id,
  catalogId: 'guitar',
  icon: 'guitar',
  color: 'magenta',
  energy: 'creative',
  rhythm: 'fewPerWeek',
  startingMinutes: 0,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('evening check-in', () => {
  const morning = new Date(2026, 8, 29, 9, 0);

  it('comes an hour before bed, every evening for a week', () => {
    const times = checkInTimes(morning, 23 * 60, []);
    expect(times).toHaveLength(7);
    expect(times[0]).toEqual(new Date(2026, 8, 29, 22, 0));
    expect(times[6]).toEqual(new Date(2026, 9, 5, 22, 0));
  });

  it('skips today once something is logged or the time has passed', () => {
    expect(checkInTimes(morning, 23 * 60, [log('g', '2026-09-29')])[0]).toEqual(new Date(2026, 8, 30, 22, 0));
    expect(checkInTimes(new Date(2026, 8, 29, 22, 30), 23 * 60, [])[0]).toEqual(new Date(2026, 8, 30, 22, 0));
    expect(checkInTimes(morning, 23 * 60, [log('g', '2026-09-28')])[0]).toEqual(new Date(2026, 8, 29, 22, 0));
  });

  it('handles a bedtime after midnight', () => {
    expect(checkInTimes(morning, 30, [])[0]).toEqual(new Date(2026, 8, 29, 23, 30));
  });
});

describe('resting asset', () => {
  const today = new Date(2026, 8, 29);

  it('picks the asset that has rested longest, never recovery or "whenever"', () => {
    const assets = [asset('guitar'), asset('run'), asset('recovery', { energy: 'recovery' }), asset('anime', { rhythm: 'whenever' })];
    const logs = [log('guitar', '2026-09-28', 60), log('run', '2026-09-10', 60)];
    expect(restingAsset(assets, logs, today)?.id).toBe('run');
  });

  it('returns null when nothing qualifies', () => {
    expect(restingAsset([asset('recovery')], [], today)).toBeNull();
  });
});

it('formats a time of day in the locale', () => {
  expect(formatClock(23 * 60, 'uk')).toBe('23:00');
  expect(formatClock(7 * 60 + 5, 'en-GB')).toBe('07:05');
});
