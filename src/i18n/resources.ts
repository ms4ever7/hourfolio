import { en } from './locales/en';
import { pl } from './locales/pl';
import { uk } from './locales/uk';

export const APP_LANGUAGES = ['en', 'uk', 'pl'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const isAppLanguage = (code: string): code is AppLanguage =>
  (APP_LANGUAGES as readonly string[]).includes(code);

/** Short code shown on the language button. */
export const LANGUAGE_BADGE: Record<AppLanguage, string> = { en: 'EN', uk: 'UA', pl: 'PL' };

export const defaultNS = 'translation';

export const resources = {
  en: { translation: en },
  uk: { translation: uk },
  pl: { translation: pl },
} as const;
