import { accentTokens, contrast, ensureContrast, isHex, mix, parseHex, toHex } from './color';

describe('color', () => {
  it('round-trips hex and drops alpha', () => {
    expect(toHex(parseHex('#2747d6'))).toBe('#2747D6');
    expect(toHex(parseHex('#2747D6FF'))).toBe('#2747D6');
    expect(toHex(parseHex('#fff'))).toBe('#FFFFFF');
    expect(isHex('#12ab')).toBe(false);
    expect(isHex('#12AB34')).toBe(true);
  });

  it('mixes linearly', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#2747D6', '#FFFFFF', 0)).toBe('#2747D6');
  });

  it('pushes a color until it contrasts', () => {
    const c = ensureContrast('#FFF59D', '#FFFFFF', 4.5, '#000000');
    expect(contrast(c, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['#FFF59D', '#FFFFFF', '#000000', '#2747D6', '#7FFFD4', '#E8741C'])('keeps %s readable in both modes', (picked) => {
    for (const [mode, card] of [
      ['light', '#FFFFFF'],
      ['dark', '#1A1C20'],
    ] as const) {
      const t = accentTokens(picked, mode, card);
      expect(contrast(t.accentInk, card)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.accent, card)).toBeGreaterThanOrEqual(1.9);
    }
  });
});
