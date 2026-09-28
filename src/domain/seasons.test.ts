import { activeSeason, isInSeason, seasonById } from './seasons';

describe('seasons', () => {
  it('finds Halloween in late October', () => {
    expect(activeSeason(new Date(2026, 9, 31))?.id).toBe('halloween');
    expect(activeSeason(new Date(2026, 9, 14))).toBeNull();
    expect(activeSeason(new Date(2026, 10, 2))?.id).toBe('halloween');
    expect(activeSeason(new Date(2026, 10, 3))).toBeNull();
  });

  it('wraps the winter season past New Year', () => {
    const winter = seasonById('winter');
    expect(isInSeason(winter, new Date(2026, 11, 24))).toBe(true);
    expect(isInSeason(winter, new Date(2027, 0, 5))).toBe(true);
    expect(isInSeason(winter, new Date(2027, 0, 11))).toBe(false);
    expect(isInSeason(winter, new Date(2026, 10, 30))).toBe(false);
  });
});
