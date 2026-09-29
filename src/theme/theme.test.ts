import { contrast } from '@/domain/color';
import { buildTheme, DEFAULT_ACCENT, pageMode } from './theme';

describe('page color', () => {
  it('turns dark pages into a dark theme and light pages into a light one', () => {
    expect(pageMode('#10231C')).toBe('dark');
    expect(pageMode('#FFF1E6')).toBe('light');
    expect(buildTheme({ mode: 'light', accent: DEFAULT_ACCENT, page: '#000000' }).mode).toBe('dark');
    expect(buildTheme({ mode: 'dark', accent: DEFAULT_ACCENT, page: '#FFFFFF' }).mode).toBe('light');
  });

  it.each(['#FFFFFF', '#FFF8D6', '#EEF7EE', '#8FB3FF', '#FF6FA8', '#7A7A7A', '#1B2233', '#000000', '#3A0CA3', '#0FA3B1'])('keeps text readable on %s', (page) => {
    const { colors } = buildTheme({ mode: 'light', accent: DEFAULT_ACCENT, page });
    expect(colors.ground).toBe(page);
    expect(contrast(colors.ink, colors.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.muted, colors.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.ink, colors.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.accentInk, colors.card)).toBeGreaterThanOrEqual(4.5);
  });
});

it('keeps selected segments visible on a black page', () => {
  const { colors } = buildTheme({ mode: 'dark', accent: DEFAULT_ACCENT, page: '#000000' });
  expect(contrast(colors.track, colors.card)).toBeGreaterThan(1.2);
});
