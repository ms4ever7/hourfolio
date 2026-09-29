import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_AVATAR, type Avatar } from '@/domain/avatars';
import type { BackgroundId } from '@/domain/backgrounds';
import { DEFAULT_BED, DEFAULT_WAKE } from '@/domain/day';
import type { SceneId } from '@/domain/goals';
import { isAppLanguage, type AppLanguage } from '@/i18n/resources';
import { DEFAULT_ACCENT } from '@/theme/theme';
import { mmkvZustandStorage } from './mmkv-storage';

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return isAppLanguage(code) ? code : 'en';
}

export type ThemeMode = 'system' | 'light' | 'dark';

/** Keeps the list of shown congrats from growing forever. */
const MAX_CELEBRATED = 200;
const MAX_RECENT_EMOJI = 24;

interface SettingsState {
  language: AppLanguage;
  onboarded: boolean;
  name: string;
  avatar: Avatar;
  themeMode: ThemeMode;
  accent: string;
  background: BackgroundId;
  /** An exact page color, or null for the theme's own. */
  pageColor: string | null;
  /** One gentle reminder on Sunday evening when a weekly goal is nearly met. */
  nudges: boolean;
  /** Wake-up and bed times, minutes after midnight. Reminders stay inside them. */
  wakeTime: number;
  bedTime: number;
  /** A note an hour before bed on days with nothing logged yet. */
  eveningCheckIn: boolean;
  /** Dress the app up for holidays (accent, header decoration, scene props). */
  seasonal: boolean;
  /** Switch the app icon to the holiday one and back by itself. */
  autoSeasonIcon: boolean;
  goalScene: SceneId;
  /** Emoji picked lately, newest first. */
  recentEmoji: string[];
  /** `celebrationKey`s of weekly goals whose congrats was already shown. */
  celebrated: string[];
  setLanguage: (language: AppLanguage) => void;
  setOnboarded: (onboarded: boolean) => void;
  setName: (name: string) => void;
  setAvatar: (avatar: Avatar) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setBackground: (background: BackgroundId) => void;
  setPageColor: (color: string | null) => void;
  setNudges: (on: boolean) => void;
  setDay: (day: { wakeTime?: number; bedTime?: number }) => void;
  setEveningCheckIn: (on: boolean) => void;
  setSeasonal: (on: boolean) => void;
  setAutoSeasonIcon: (on: boolean) => void;
  setGoalScene: (scene: SceneId) => void;
  addRecentEmoji: (emoji: string) => void;
  markCelebrated: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      onboarded: false,
      name: '',
      avatar: DEFAULT_AVATAR,
      themeMode: 'system',
      accent: DEFAULT_ACCENT,
      background: 'plain',
      pageColor: null,
      nudges: false,
      wakeTime: DEFAULT_WAKE,
      bedTime: DEFAULT_BED,
      eveningCheckIn: false,
      seasonal: true,
      autoSeasonIcon: false,
      goalScene: 'dog',
      recentEmoji: [],
      celebrated: [],
      setLanguage: (language) => set({ language }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setName: (name) => set({ name }),
      setAvatar: (avatar) => set({ avatar }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setAccent: (accent) => set({ accent }),
      setBackground: (background) => set({ background }),
      setPageColor: (pageColor) => set({ pageColor }),
      setNudges: (nudges) => set({ nudges }),
      setDay: (day) => set(day),
      setEveningCheckIn: (eveningCheckIn) => set({ eveningCheckIn }),
      setSeasonal: (seasonal) => set({ seasonal }),
      setAutoSeasonIcon: (autoSeasonIcon) => set({ autoSeasonIcon }),
      setGoalScene: (goalScene) => set({ goalScene }),
      addRecentEmoji: (emoji) => set((s) => ({ recentEmoji: [emoji, ...s.recentEmoji.filter((e) => e !== emoji)].slice(0, MAX_RECENT_EMOJI) })),
      markCelebrated: (key) => set((s) => ({ celebrated: [...s.celebrated.filter((k) => k !== key), key].slice(-MAX_CELEBRATED) })),
    }),
    { name: 'hourfolio.settings', storage: mmkvZustandStorage },
  ),
);
