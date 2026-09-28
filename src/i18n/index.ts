// Hermes has no Intl.PluralRules and i18next requires it; load the polyfill before init.
import 'intl-pluralrules';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '@/store/settings-store';
import { defaultNS, resources } from './resources';

// MMKV hydrates synchronously during create(), so the saved language is readable here.
void i18next.use(initReactI18next).init({
  lng: useSettingsStore.getState().language,
  fallbackLng: 'en',
  defaultNS,
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Keep i18next in step with the stored preference.
useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language) void i18next.changeLanguage(state.language);
});

export { i18next as i18n };
