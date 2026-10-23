import { addDays, dayKey, daysBetween, parseDay, startOfWeek, weekdayMonFirst } from './dates';

// Tests run in Europe/Kyiv (see the test script), where the clocks go back on 2026-10-25.
describe('dates around the autumn clock change', () => {
  it('adds whole days across the 25-hour Sunday', () => {
    expect(dayKey(addDays(parseDay('2026-10-24'), 1))).toBe('2026-10-25');
    expect(dayKey(addDays(parseDay('2026-10-24'), 2))).toBe('2026-10-26');
    expect(dayKey(addDays(parseDay('2026-10-26'), -2))).toBe('2026-10-24');
    expect(dayKey(addDays(parseDay('2026-10-25'), 7))).toBe('2026-11-01');
  });

  it('counts days and finds the Monday the same way on both sides of it', () => {
    expect(daysBetween(parseDay('2026-10-19'), parseDay('2026-10-26'))).toBe(7);
    expect(daysBetween(parseDay('2026-10-25'), parseDay('2026-10-26'))).toBe(1);
    expect(dayKey(startOfWeek(parseDay('2026-10-25')))).toBe('2026-10-19');
    expect(dayKey(startOfWeek(parseDay('2026-10-26')))).toBe('2026-10-26');
    expect(weekdayMonFirst(parseDay('2026-10-25'))).toBe(6);
  });

  it('keeps a late evening on its own day and round-trips every key', () => {
    expect(dayKey(new Date(2026, 9, 25, 23, 30))).toBe('2026-10-25');
    for (const key of ['2026-03-29', '2026-10-25', '2026-12-31', '2027-01-01']) expect(dayKey(parseDay(key))).toBe(key);
  });
});
