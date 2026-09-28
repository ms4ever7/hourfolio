/** Hours with at most one decimal, in the locale's style ("114.5" / "114,5"). */
export function formatHours(minutes: number, locale: string): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(hours);
}

/** Signed hours for deltas. Uses a real minus sign so it lines up with "+". */
export function formatHoursDelta(minutes: number, locale: string): string {
  const abs = formatHours(Math.abs(minutes), locale);
  if (Math.round(minutes / 6) === 0) return abs;
  return (minutes > 0 ? '+' : '−') + abs;
}

export type TimeUnit = 'h' | 'm';

export interface DurationPart {
  value: number;
  unit: TimeUnit;
}

/** 95 → [1 h, 35 m]; 45 → [45 m]; 120 → [2 h]. */
export function durationParts(minutes: number): DurationPart[] {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const parts: DurationPart[] = [];
  if (h > 0) parts.push({ value: h, unit: 'h' });
  if (m > 0 || h === 0) parts.push({ value: m, unit: 'm' });
  return parts;
}

export function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
