import { DEFAULT_ACCENT } from '@/theme/theme';

export const SETTINGS_VERSION = 2;

/** The default accent before the lavender redesign. */
const OLD_DEFAULT_ACCENT = '#2747D6';

/**
 * Brings saved settings up to date. Version 0 had the blue default accent, so anyone still on it
 * moves to the new default (the blue stays one tap away in the color pickers). Version 1 turned
 * the holiday theme on for everyone; it is opt-in, so version 2 switches it off.
 */
export function migrateSettings(persisted: unknown, version: number): unknown {
  let state = (persisted ?? {}) as { accent?: unknown; seasonal?: unknown };
  if (version < 1 && typeof state.accent === 'string' && state.accent.toUpperCase() === OLD_DEFAULT_ACCENT) {
    state = { ...state, accent: DEFAULT_ACCENT };
  }
  if (version < 2) state = { ...state, seasonal: false };
  return state;
}
