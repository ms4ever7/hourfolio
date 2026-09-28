import { useTranslation } from 'react-i18next';
import type { Asset } from '@/domain/types';

type Named = Pick<Asset, 'catalogId' | 'customName'>;

/** Catalog assets follow the app language; custom ones keep the name the user typed. */
export function useAssetName() {
  const { t } = useTranslation();
  return (a: Named) => a.customName ?? t(`catalog.${a.catalogId}`);
}

export function monthName(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}

/**
 * The month in the form used after "vs"/"до"/"względem": genitive in Ukrainian
 * and Polish ("серпня", "sierpnia"). ICU gives that form when a day is present.
 */
export function monthGenitive(locale: string, date: Date): string {
  const withDay = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
  return withDay.replace(/[\d.,\s]+/g, ' ').trim();
}

export function shortDate(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}

export function longDate(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function sessionDate(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' }).format(date);
}

export function monthYear(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

export function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}
