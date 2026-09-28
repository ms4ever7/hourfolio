/** Holidays the app dresses up for. Dates are local and the same every year. */

export type SeasonId = 'halloween' | 'winter';

/** Names of the alternate app icons, as set in app.json. */
export type AppIconName = 'Pumpkin' | 'Winter';

export interface Season {
  id: SeasonId;
  /** Replaces the user's accent while the seasonal theme is on. */
  accent: string;
  icon: AppIconName;
  /** Small decoration for the Portfolio header. */
  decor: string;
  /** First and last day, as [month (1–12), day]. The range may wrap past New Year. */
  from: [number, number];
  to: [number, number];
}

export const SEASONS: Season[] = [
  { id: 'halloween', accent: '#E8741C', icon: 'Pumpkin', decor: '🎃', from: [10, 15], to: [11, 2] },
  { id: 'winter', accent: '#1F8A5B', icon: 'Winter', decor: '🎄', from: [12, 1], to: [1, 10] },
];

const ordinal = (month: number, day: number) => month * 100 + day;

export function isInSeason(season: Season, date: Date): boolean {
  const d = ordinal(date.getMonth() + 1, date.getDate());
  const from = ordinal(...season.from);
  const to = ordinal(...season.to);
  return from <= to ? d >= from && d <= to : d >= from || d <= to;
}

export function activeSeason(date: Date): Season | null {
  return SEASONS.find((s) => isInSeason(s, date)) ?? null;
}

export function seasonById(id: SeasonId): Season {
  return SEASONS.find((s) => s.id === id)!;
}
