import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isAppLanguage, type AppLanguage } from '@/i18n/resources';
import { mmkvZustandStorage } from './mmkv-storage';

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return isAppLanguage(code) ? code : 'en';
}

interface SettingsState {
  language: AppLanguage;
  onboarded: boolean;
  setLanguage: (language: AppLanguage) => void;
  setOnboarded: (onboarded: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      onboarded: false,
      setLanguage: (language) => set({ language }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    { name: 'hourfolio.settings', storage: mmkvZustandStorage },
  ),
);
