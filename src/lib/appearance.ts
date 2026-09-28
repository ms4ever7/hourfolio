import { getAppIconName, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';
import { useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { activeSeason, type AppIconName, type Season } from '@/domain/seasons';
import { useSettingsStore } from '@/store/settings-store';
import { buildTheme, type Mode } from '@/theme/theme';
import { useToday } from './usePortfolio';

/** The holiday going on today, if the user keeps seasonal themes on. */
export function useSeason(): Season | null {
  const seasonal = useSettingsStore((s) => s.seasonal);
  const today = useToday();
  return useMemo(() => (seasonal ? activeSeason(today) : null), [seasonal, today]);
}

export function useMode(): Mode {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  return themeMode === 'system' ? (system === 'dark' ? 'dark' : 'light') : themeMode;
}

/** The theme for the whole app: mode, the picked accent, or the holiday accent. */
export function useAppearance() {
  const mode = useMode();
  const accent = useSettingsStore((s) => s.accent);
  const page = useSettingsStore((s) => s.pageColor);
  const season = useSeason();
  const theme = useMemo(() => buildTheme({ mode, accent: season?.accent ?? accent, page }), [mode, accent, page, season]);
  // A picked page color can turn the app dark or light regardless of the setting.
  return { theme, mode: theme.mode };
}

export const canChangeIcon = supportsAlternateIcons;

export function currentAppIcon(): AppIconName | null {
  if (!supportsAlternateIcons) return null;
  return getAppIconName() as AppIconName | null;
}

/** iOS shows its own alert after every change; that is the system, not an error. */
export async function changeAppIcon(name: AppIconName | null): Promise<boolean> {
  if (!supportsAlternateIcons || currentAppIcon() === name) return false;
  try {
    await setAlternateAppIcon(name);
    return true;
  } catch {
    return false;
  }
}

/** The current app icon, updated after a change made through it. */
export function useAppIcon() {
  const [icon, setIcon] = useState(currentAppIcon);
  const change = async (name: AppIconName | null) => {
    if (await changeAppIcon(name)) setIcon(name);
  };
  return [icon, change] as const;
}

/**
 * With automatic holiday icons on, the app manages its icon: the holiday one
 * while the holiday lasts, the default one otherwise.
 */
export function useSeasonIconSync() {
  const auto = useSettingsStore((s) => s.autoSeasonIcon);
  const today = useToday();
  useEffect(() => {
    if (!auto || !supportsAlternateIcons) return;
    const season = activeSeason(today);
    const current = currentAppIcon();
    if (season && current !== season.icon) void changeAppIcon(season.icon);
    if (!season && current !== null) void changeAppIcon(null);
  }, [auto, today]);
}
