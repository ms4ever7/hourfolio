export const MAX_STARTING_HOURS = 100000;

/** Hours typed by the user ("12", "12,5", "12.5") as minutes, or null when it isn't a number. Capped, never negative. */
export function parseStartingMinutes(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === '' || normalized === '.') return null;
  const hours = Math.min(Number(normalized), MAX_STARTING_HOURS);
  return Math.round(hours * 60);
}
