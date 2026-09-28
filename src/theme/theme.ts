import { createTheme, useTheme } from '@shopify/restyle';
import type { EnergyType, PaletteKey } from '@/domain/types';

/** Asset colors: [stroke/fill, soft tint]. Each keeps white-on-color and color-on-tint readable. */
export const assetPalette: Record<PaletteKey, { main: string; tint: string; soft: string }> = {
  magenta: { main: '#C2388A', tint: '#F8E1EE', soft: '#EDC3DC' },
  violet: { main: '#6246EA', tint: '#ECE8FD', soft: '#CFC5F8' },
  vermilion: { main: '#E4572E', tint: '#FCE6DF', soft: '#F6C2B2' },
  sky: { main: '#1E96C8', tint: '#DDF0F8', soft: '#B3DDEE' },
  olive: { main: '#6F8C10', tint: '#EDF2D9', soft: '#D2DDA8' },
  brown: { main: '#8A6D3B', tint: '#F1EADF', soft: '#DCCDB3' },
  slate: { main: '#4A4F57', tint: '#ECEBE8', soft: '#C9CBCF' },
  grey: { main: '#7C828B', tint: '#EFEFEF', soft: '#D3D5D9' },
};

export const PALETTE_KEYS = Object.keys(assetPalette) as PaletteKey[];

export const energyColor: Record<EnergyType, PaletteKey> = {
  mind: 'violet',
  creative: 'magenta',
  body: 'vermilion',
  recovery: 'sky',
};

/** Heatmap steps, light to dark, in the hours color. */
export const heatSteps = ['#DCE3FB', '#AFBEF3', '#6F87E6', '#2747D6'];

export const theme = createTheme({
  colors: {
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
    // Units of time each have a color: hours are the main currency.
    hours: '#2747D6',
    hoursInk: '#1F3FB8',
    hoursSoft: '#E3E9FF',
    hoursOnDark: '#9DB0FF',
    minutes: '#A15F00',
    minutesOnDark: '#F2B95C',
    days: '#0F7A63',
    daysSoft: '#CDEBE3',
    daysOnDark: '#7FD9C2',
    inverse: '#15171A',
    onInverse: '#FFFFFF',
    onInverseMuted: '#D5D7DB',
    transparent: 'transparent',
  },
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
});

export type Theme = typeof theme;
export type ThemeColor = keyof Theme['colors'];

export const useAppTheme = () => useTheme<Theme>();
