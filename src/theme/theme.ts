import { createTheme, useTheme } from '@shopify/restyle';
import { accentTokens, contrast, ensureContrast, mix, type Mode } from '@/domain/color';
import type { EnergyType, PaletteKey } from '@/domain/types';

export type { Mode } from '@/domain/color';

/** The accent before the user picks one: a clear violet. */
export const DEFAULT_ACCENT = '#6558F5';

/** Asset colors, as picked for light mode. Dark mode derives its own from these. */
const PALETTE_LIGHT: Record<PaletteKey, { main: string; tint: string; soft: string }> = {
  magenta: { main: '#C2388A', tint: '#F8E1EE', soft: '#EDC3DC' },
  violet: { main: '#6246EA', tint: '#ECE8FD', soft: '#CFC5F8' },
  vermilion: { main: '#E4572E', tint: '#FCE6DF', soft: '#F6C2B2' },
  sky: { main: '#1E96C8', tint: '#DDF0F8', soft: '#B3DDEE' },
  olive: { main: '#6F8C10', tint: '#EDF2D9', soft: '#D2DDA8' },
  brown: { main: '#8A6D3B', tint: '#F1EADF', soft: '#DCCDB3' },
  slate: { main: '#4A4F57', tint: '#ECEBE8', soft: '#C9CBCF' },
  grey: { main: '#7C828B', tint: '#EFEFEF', soft: '#D3D5D9' },
};

export type AssetColors = { main: string; tint: string; soft: string };
export type Palette = Record<PaletteKey, AssetColors>;

export const PALETTE_KEYS = Object.keys(PALETTE_LIGHT) as PaletteKey[];

export const energyColor: Record<EnergyType, PaletteKey> = {
  mind: 'violet',
  creative: 'magenta',
  body: 'vermilion',
  recovery: 'sky',
};

const LIGHT = {
  ground: '#F3F2F8',
  card: '#FFFFFF',
  ink: '#16151C',
  body: '#4B4A57',
  muted: '#5F5E6B',
  faint: '#6C6B78',
  line: '#EFEEF5',
  border: '#E2E1EB',
  track: '#E8E7F0',
  dashed: '#D4D3E0',
  axis: '#CFCEDC',
  previous: '#A6A5B2',
  // Units of time each have a color: hours are the main currency.
  hours: '#6558F5',
  hoursInk: '#5143E0',
  hoursSoft: '#E9E7FE',
  hoursOnInverse: '#B4ADFF',
  minutes: '#A15F00',
  minutesOnInverse: '#F2B95C',
  days: '#0F7A63',
  daysSoft: '#CDEBE3',
  daysInk: '#0F4D43',
  daysOnInverse: '#7FD9C2',
  inverse: '#16151C',
  onInverse: '#FFFFFF',
  onInverseMuted: '#D6D5DD',
  // Rest on the log sheet, in the recovery sky color.
  restInk: '#0E4A63',
  restSub: '#245F78',
  // Only for destructive actions like "Start over", never for a decline.
  danger: '#B3261E',
  shadow: '#16151C',
  transparent: 'transparent',
};

type Colors = typeof LIGHT;

const DARK: Colors = {
  ground: '#0F0E14',
  card: '#1B1A22',
  ink: '#F2F1F6',
  body: '#C7C6D0',
  muted: '#A4A3AF',
  faint: '#908F9C',
  line: '#26252E',
  border: '#35343F',
  track: '#2C2B36',
  dashed: '#484753',
  axis: '#3B3A46',
  previous: '#7E7D8A',
  hours: '#9C93FF',
  hoursInk: '#B2ABFF',
  hoursSoft: '#2A2750',
  hoursOnInverse: '#5143E0',
  minutes: '#F2B95C',
  minutesOnInverse: '#A15F00',
  days: '#5FCFB3',
  daysSoft: '#16362F',
  daysInk: '#9BE7D4',
  daysOnInverse: '#0F7A63',
  inverse: '#ECEBF2',
  onInverse: '#16151C',
  onInverseMuted: '#4B4A57',
  restInk: '#D8F0FA',
  restSub: '#A9D6EA',
  danger: '#FF8A80',
  shadow: '#000000',
  transparent: 'transparent',
};

function darkPalette(card: string): Palette {
  return Object.fromEntries(
    PALETTE_KEYS.map((k) => {
      const main = ensureContrast(PALETTE_LIGHT[k].main, card, 4, '#FFFFFF');
      return [k, { main, tint: mix(card, main, 0.2), soft: mix(card, main, 0.42) }];
    }),
  ) as Palette;
}

const DARK_PALETTE = darkPalette(DARK.card);

/** A page color decides light or dark by itself: whichever text color reads better on it. */
export function pageMode(page: string): Mode {
  return contrast(page, LIGHT.ink) >= contrast(page, DARK.ink) ? 'light' : 'dark';
}

/** The neutral tokens re-derived around a page color the user picked. */
function aroundPage(base: Colors, page: string, mode: Mode): Colors {
  const card = mode === 'light' ? mix(page, '#FFFFFF', 0.75) : mix(page, '#FFFFFF', 0.08);
  // Mid tones can need pure black or white text to reach 4.5:1.
  const ink = ensureContrast(base.ink, page, 4.5, mode === 'light' ? '#000000' : '#FFFFFF');
  const readable = (c: string, ratio: number) => ensureContrast(c, page, ratio, ink);
  return {
    ...base,
    ground: page,
    card,
    ink,
    body: readable(base.body, 7),
    muted: readable(base.muted, 4.5),
    faint: readable(base.faint, 4.5),
    line: mix(card, ink, 0.06),
    border: mix(card, ink, 0.14),
    // In dark themes the track must stay lighter than cards, or selected segments disappear.
    track: mode === 'light' ? mix(page, ink, 0.08) : mix(card, ink, 0.1),
    dashed: mix(page, ink, 0.22),
    axis: mix(page, ink, 0.18),
    previous: readable(base.previous, 2.5),
    hours: readable(base.hours, 3),
    hoursInk: ensureContrast(base.hoursInk, card, 4.5, ink),
    hoursSoft: mix(card, base.hours, mode === 'light' ? 0.14 : 0.22),
    minutes: readable(base.minutes, 3),
    days: readable(base.days, 3),
    daysSoft: mix(card, base.days, mode === 'light' ? 0.2 : 0.25),
  };
}

export interface ThemeOptions {
  mode: Mode;
  accent: string;
  /** An exact page color. When set, it also decides light or dark. */
  page?: string | null;
}

export function buildTheme({ mode: picked, accent, page }: ThemeOptions) {
  const mode = page ? pageMode(page) : picked;
  const base = page ? aroundPage(mode === 'dark' ? DARK : LIGHT, page, mode) : mode === 'dark' ? DARK : LIGHT;
  const tokens = accentTokens(accent, mode, base.card);
  // A hint of the accent in the default page background, the way Telegram tints a chat.
  // A page color the user picked is used exactly as picked.
  const ground = page ? base.ground : mix(base.ground, tokens.accent, mode === 'dark' ? 0.05 : 0.035);
  // Hours are the main currency, so their color is the accent: charts, deltas and the heatmap follow the user's pick.
  const hours = {
    hours: tokens.accent,
    hoursInk: tokens.accentInk,
    hoursSoft: tokens.accentSoft,
    hoursOnInverse: mode === 'dark' ? mix(tokens.accent, '#000000', 0.25) : mix(tokens.accent, '#FFFFFF', 0.5),
  };
  const heat = [0.22, 0.45, 0.72, 1].map((a) => mix(base.card, tokens.accent, a));
  return createTheme({
    colors: { ...base, ...hours, ...tokens, ground },
    spacing: { 0: 0, xs: 4, s: 8, sm: 12, m: 16, ml: 20, l: 24, xl: 32 },
    borderRadii: { s: 10, m: 14, l: 18, xl: 18, pill: 999 },
    breakpoints: {},
    textVariants: {
      defaults: { fontFamily: 'Inter_400Regular', fontSize: 15, color: 'ink' },
      display: { fontFamily: 'Inter_600SemiBold', fontSize: 60, lineHeight: 64, letterSpacing: -2, color: 'ink' },
      title: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: 'ink' },
      heading: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 22, color: 'ink' },
      bodyStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20, color: 'ink' },
      body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: 'body' },
      label: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 19, color: 'ink' },
      caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: 'muted' },
      small: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: 'muted' },
      tiny: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, color: 'muted' },
      mono: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: 'ink', fontVariant: ['tabular-nums'] },
      monoSmall: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'body', fontVariant: ['tabular-nums'] },
    },
    mode,
    palette: mode === 'light' ? PALETTE_LIGHT : page ? darkPalette(base.card) : DARK_PALETTE,
    /** Heatmap steps, light to strong, in the hours color. */
    heatSteps: heat,
  });
}

/** The light theme with the default accent, for places outside the provider. */
export const theme = buildTheme({ mode: 'light', accent: DEFAULT_ACCENT });

export type Theme = ReturnType<typeof buildTheme>;
export type ThemeColor = keyof Theme['colors'];

export const useAppTheme = () => useTheme<Theme>();

/** The light palette, for art that is always drawn on light (the app icon, share cards). */
export const lightPalette = PALETTE_LIGHT;
