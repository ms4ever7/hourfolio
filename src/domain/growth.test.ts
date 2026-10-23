import { addDays, dayKey } from './dates';
import { capitalMinutes, momentum, MOMENTUM_FLOOR, trend } from './growth';
import type { Asset, LogEntry } from './types';

const today = new Date(2026, 8, 28);

const asset = (over: Partial<Asset> = {}): Asset => ({
  id: 'g',
  catalogId: 'guitar',
  icon: 'guitar',
  color: 'magenta',
  energy: 'creative',
  rhythm: 'fewPerWeek',
  startingMinutes: 0,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

const log = (daysAgo: number, minutes: number, assetId = 'g'): LogEntry => ({
  id: `${assetId}${daysAgo}${minutes}`,
  assetId,
  day: dayKey(addDays(today, -daysAgo)),
  minutes,
  createdAt: '2026-01-01T00:00:00Z',
});

/** Sessions every `every` days for `days` days. */
const steady = (every: number, minutes: number, days = 120) =>
  Array.from({ length: Math.floor(days / every) }, (_, i) => log(i * every, minutes));

describe('capital', () => {
  it('adds starting hours to every logged minute of this asset only', () => {
    const a = asset({ startingMinutes: 600 });
    expect(capitalMinutes(a, [log(1, 30), log(2, 45), log(1, 90, 'other')])).toBe(675);
  });
});

describe('momentum', () => {
  it('rests at the floor with no activity, never below it', () => {
    expect(momentum(asset(), [], today)).toBe(MOMENTUM_FLOOR);
    expect(momentum(asset(), [log(400, 60)], today)).toBe(MOMENTUM_FLOOR);
  });

  it('lands around 70 when the rhythm is kept', () => {
    // A few times a week ≈ 3 h/week: 1 h every 2⅓ days. Today's session puts it a bit above the average.
    const m = momentum(asset(), steady(7 / 3, 60), today);
    expect(m).toBeGreaterThanOrEqual(62);
    expect(m).toBeLessThanOrEqual(82);
  });

  it('decays toward the floor after a break', () => {
    const fresh = momentum(asset(), steady(2, 60), today);
    // The same routine, but it stopped 30 days ago.
    const after = momentum(asset(), Array.from({ length: 45 }, (_, i) => log(30 + i * 2, 60)), today);
    expect(after).toBeLessThan(fresh);
    expect(after).toBeGreaterThanOrEqual(MOMENTUM_FLOOR);
  });

  it('forgives slower rhythms more: the same break costs a weekly asset less', () => {
    const lastMonthOnly = [log(20, 60), log(25, 60), log(30, 60)];
    expect(momentum(asset({ rhythm: 'weekly' }), lastMonthOnly, today)).toBeGreaterThan(momentum(asset({ rhythm: 'daily' }), lastMonthOnly, today));
  });

  it('never exceeds 100', () => {
    expect(momentum(asset(), steady(1, 600), today)).toBeLessThanOrEqual(100);
  });
});

describe('trend', () => {
  it('is new before the first session', () => {
    expect(trend(asset(), [], today)).toBe('new');
  });

  it('is paused after the rhythm allows, but never for "whenever" assets', () => {
    expect(trend(asset(), [log(15, 60)], today)).toBe('paused');
    expect(trend(asset({ rhythm: 'whenever' }), [log(60, 60)], today)).not.toBe('paused');
  });

  it('is growing when this week lifted momentum', () => {
    expect(trend(asset(), [log(1, 90), log(3, 90), log(5, 60)], today)).toBe('growing');
  });
});
