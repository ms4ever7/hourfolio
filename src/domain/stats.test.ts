import { allocation, cumulativeHours, energyBalance, heatLevel, monthHeatmap, periodRanges, sumMinutes, weeklyMinutes } from './stats';
import { durationParts, formatHours, formatHoursDelta } from './format';
import type { Asset, LogEntry } from './types';

const today = new Date(2026, 8, 28); // Monday, Sep 28 2026

const l = (assetId: string, day: string, minutes: number): LogEntry => ({ id: `${assetId}${day}${minutes}`, assetId, day, minutes, createdAt: '' });

const a = (id: string, energy: Asset['energy']): Asset => ({ id, energy, icon: 'star', color: 'grey', rhythm: 'weekly', startingMinutes: 0, createdAt: '' });

describe('periodRanges', () => {
  it('month runs from the 1st to today and compares with the whole previous month', () => {
    const r = periodRanges('month', today, []);
    expect(r.current).toEqual({ from: '2026-09-01', to: '2026-09-28' });
    expect(r.previous).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('week starts on Monday', () => {
    expect(periodRanges('week', today, []).current.from).toBe('2026-09-28');
    expect(periodRanges('week', new Date(2026, 8, 27), []).current.from).toBe('2026-09-21');
  });

  it('all time starts at the first log and has nothing to compare with', () => {
    const r = periodRanges('all', today, [l('x', '2025-03-02', 10)]);
    expect(r.current.from).toBe('2025-03-02');
    expect(r.previous).toBeNull();
  });
});

describe('sums and series', () => {
  const logs = [l('g', '2026-09-01', 60), l('g', '2026-09-03', 30), l('c', '2026-09-03', 90), l('g', '2026-08-31', 45)];

  it('sums inside the range, optionally per asset', () => {
    const r = { from: '2026-09-01', to: '2026-09-30' };
    expect(sumMinutes(logs, r)).toBe(180);
    expect(sumMinutes(logs, r, 'g')).toBe(90);
  });

  it('builds a running total in hours, one point per day', () => {
    expect(cumulativeHours(logs, new Date(2026, 8, 1), 3)).toEqual([1, 1, 3]);
  });

  it('allocates by share and folds the tail into "other"', () => {
    const r = { from: '2026-09-01', to: '2026-09-30' };
    const slices = allocation([...logs, l('c', '2026-09-04', 30)], r, 1);
    expect(slices).toEqual([
      { assetId: 'c', minutes: 120, share: 120 / 210 },
      { assetId: 'other', minutes: 90, share: 90 / 210 },
    ]);
  });

  it('balances energy by each asset type', () => {
    const b = energyBalance([a('g', 'creative'), a('c', 'body')], logs, { from: '2026-09-01', to: '2026-09-30' });
    expect(b).toEqual({ body: 90, creative: 90, mind: 0, recovery: 0 });
  });

  it('counts weeks oldest first, ending with this week', () => {
    // Sep 20 is the Sunday of the week before last.
    const w = weeklyMinutes([l('g', '2026-09-28', 30), l('g', '2026-09-20', 60)], 'g', 3, today);
    expect(w).toEqual([60, 0, 30]);
  });
});

describe('monthHeatmap', () => {
  it('pads to whole Monday-first weeks and marks rest-only days', () => {
    const cells = monthHeatmap([l('recovery', '2026-09-05', 120), l('g', '2026-09-06', 60)], today, today);
    expect(cells.length % 7).toBe(0);
    expect(cells[0]).toBeNull(); // Sep 1 2026 is a Tuesday
    const sep5 = cells.find((c) => c?.day === '2026-09-05');
    expect(sep5).toMatchObject({ restOnly: true, minutes: 0 });
    expect(cells.find((c) => c?.day === '2026-09-28')?.today).toBe(true);
    expect(cells.find((c) => c?.day === '2026-09-30')?.future).toBe(true);
  });

  it('scales intensity to the busiest day', () => {
    expect(heatLevel(0, 100)).toBe(0);
    expect(heatLevel(10, 100)).toBe(1);
    expect(heatLevel(100, 100)).toBe(4);
  });
});

describe('format', () => {
  it('uses the locale decimal separator', () => {
    expect(formatHours(6870, 'en')).toBe('114.5');
    expect(formatHours(6870, 'uk')).toBe('114,5');
    expect(formatHours(6870, 'pl')).toBe('114,5');
  });

  it('signs deltas with a real minus', () => {
    expect(formatHoursDelta(90, 'en')).toBe('+1.5');
    expect(formatHoursDelta(-90, 'en')).toBe('−1.5');
    expect(formatHoursDelta(0, 'en')).toBe('0');
  });

  it('splits durations into hours and minutes', () => {
    expect(durationParts(95)).toEqual([{ value: 1, unit: 'h' }, { value: 35, unit: 'm' }]);
    expect(durationParts(120)).toEqual([{ value: 2, unit: 'h' }]);
    expect(durationParts(45)).toEqual([{ value: 45, unit: 'm' }]);
  });
});
