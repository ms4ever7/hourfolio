import { DEFAULT_ACCENT } from '@/theme/theme';

export const SETTINGS_VERSION = 1;

/** The default accent before the lavender redesign. */
const OLD_DEFAULT_ACCENT = '#2747D6';

/**
 * Brings saved settings up to date. Version 0 had the blue default accent, so anyone still on it
 * moves to the new default (the blue stays one tap away in the color pickers).
 */
export function migrateSettings(persisted: unknown, version: number): unknown {
  const state = (persisted ?? {}) as { accent?: unknown };
  if (version < 1 && typeof state.accent === 'string' && state.accent.toUpperCase() === OLD_DEFAULT_ACCENT) {
    return { ...state, accent: DEFAULT_ACCENT };
  }
  return state;
}
