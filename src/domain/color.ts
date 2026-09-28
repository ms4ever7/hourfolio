/** Small color helpers for theming. Colors are `#RRGGBB` strings. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  // The native picker can return #RRGGBBAA; the alpha is dropped.
  h = h.slice(0, 6);
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) throw new Error(`Not a hex color: ${hex}`);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function isHex(value: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
}

/** `amount` of `b` mixed into `a`: 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, amount: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex({ r: x.r + (y.r - x.r) * amount, g: x.g + (y.g - x.g) * amount, b: x.b + (y.b - x.b) * amount });
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const { r, g, b } = parseHex(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Moves `color` toward `target` (black or white, say) in small steps until it
 * reaches `ratio` against `background`. Returns `target` if nothing closer works.
 */
export function ensureContrast(color: string, background: string, ratio: number, target: string): string {
  for (let i = 0; i <= 20; i++) {
    const c = mix(color, target, i / 20);
    if (contrast(c, background) >= ratio) return c;
  }
  return target;
}

export type Mode = 'light' | 'dark';

export interface AccentTokens {
  /** Fills: primary buttons, the invest button, selection rings. */
  accent: string;
  /** Text and icons on `accent`. */
  onAccent: string;
  /** Accent as text or a thin line on cards and the page. */
  accentInk: string;
  /** A soft background tint. */
  accentSoft: string;
}

/**
 * Turns any color the user picks into tokens that stay readable. Very light
 * picks are darkened in light mode (and very dark ones lightened in dark mode)
 * so a button never disappears into the page.
 */
export function accentTokens(picked: string, mode: Mode, card: string): AccentTokens {
  const base = toHex(parseHex(picked));
  const accent = ensureContrast(base, card, 1.9, mode === 'light' ? '#000000' : '#FFFFFF');
  const onAccent = contrast('#FFFFFF', accent) >= 3 ? '#FFFFFF' : '#15171A';
  const accentInk = ensureContrast(base, card, 4.5, mode === 'light' ? '#000000' : '#FFFFFF');
  const accentSoft = mix(card, base, mode === 'light' ? 0.14 : 0.24);
  return { accent, onAccent, accentInk, accentSoft };
}
