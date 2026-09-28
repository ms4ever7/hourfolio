import { createTheme, useTheme } from '@shopify/restyle';
import { accentTokens, contrast, ensureContrast, mix, type Mode } from '@/domain/color';
import type { EnergyType, PaletteKey } from '@/domain/types';

export type { Mode } from '@/domain/color';

/** The accent before the user picks one: the hours blue. */
export const DEFAULT_ACCENT = '#2747D6';

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
  ground: '#F4F2ED',
  card: '#FFFFFF',
  ink: '#15171A',
  body: '#4A4F57',
  muted: '#5E636B',
  faint: '#6B7078',
  line: '#F0EDE7',
  border: '#E1DDD5',
  track: '#E9E6DF',
  dashed: '#D6D2CA',
  axis: '#CFCAC0',
  previous: '#A3A7AE',
  // Units of time each have a color: hours are the main currency.
  hours: '#2747D6',
  hoursInk: '#1F3FB8',
  hoursSoft: '#E3E9FF',
  hoursOnInverse: '#9DB0FF',
  minutes: '#A15F00',
  minutesOnInverse: '#F2B95C',
  days: '#0F7A63',
  daysSoft: '#CDEBE3',
  daysInk: '#0F4D43',
  daysOnInverse: '#7FD9C2',
  inverse: '#15171A',
  onInverse: '#FFFFFF',
  onInverseMuted: '#D5D7DB',
  // Rest on the log sheet, in the recovery sky color.
  restInk: '#0E4A63',
  restSub: '#245F78',
  // Only for destructive actions like "Start over", never for a decline.
  danger: '#B3261E',
  shadow: '#15171A',
  transparent: 'transparent',
};

type Colors = typeof LIGHT;

const DARK: Colors = {
  ground: '#0E0F11',
  card: '#1A1C20',
  ink: '#F1F0EC',
  body: '#C5C8CD',
  muted: '#A2A6AD',
  faint: '#8E939A',
  line: '#25282D',
  border: '#34373D',
  track: '#2A2D33',
  dashed: '#474B52',
  axis: '#3A3D43',
  previous: '#7C818A',
  hours: '#8FA3FF',
  hoursInk: '#A8B7FF',
  hoursSoft: '#222A4A',
  hoursOnInverse: '#2747D6',
  minutes: '#F2B95C',
  minutesOnInverse: '#A15F00',
  days: '#5FCFB3',
  daysSoft: '#16362F',
  daysInk: '#9BE7D4',
  daysOnInverse: '#0F7A63',
  inverse: '#ECEBE7',
  onInverse: '#15171A',
  onInverseMuted: '#4A4F57',
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
    track: mix(page, ink, 0.08),
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
  const heat = mode === 'dark' ? [0.28, 0.5, 0.75, 1].map((a) => mix(base.card, base.hours, a)) : ['#DCE3FB', '#AFBEF3', '#6F87E6', '#2747D6'];
  return createTheme({
    colors: { ...base, ...tokens, ground },
    spacing: { 0: 0, xs: 4, s: 8, sm: 12, m: 16, ml: 20, l: 24, xl: 32 },
    borderRadii: { s: 10, m: 14, l: 18, xl: 20, pill: 999 },
    breakpoints: {},
    textVariants: {
      defaults: { fontFamily: 'Onest_400Regular', fontSize: 15, color: 'ink' },
      display: { fontFamily: 'Onest_600SemiBold', fontSize: 60, lineHeight: 64, letterSpacing: -2, color: 'ink' },
      title: { fontFamily: 'Onest_700Bold', fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: 'ink' },
      heading: { fontFamily: 'Onest_600SemiBold', fontSize: 17, lineHeight: 22, color: 'ink' },
      bodyStrong: { fontFamily: 'Onest_600SemiBold', fontSize: 15, lineHeight: 20, color: 'ink' },
      body: { fontFamily: 'Onest_400Regular', fontSize: 15, lineHeight: 22, color: 'body' },
      label: { fontFamily: 'Onest_500Medium', fontSize: 14, lineHeight: 19, color: 'ink' },
      caption: { fontFamily: 'Onest_400Regular', fontSize: 13, lineHeight: 18, color: 'muted' },
      small: { fontFamily: 'Onest_400Regular', fontSize: 12, lineHeight: 16, color: 'muted' },
      tiny: { fontFamily: 'Onest_500Medium', fontSize: 11, lineHeight: 14, color: 'muted' },
      mono: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 15, color: 'ink' },
      monoSmall: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'body' },
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
