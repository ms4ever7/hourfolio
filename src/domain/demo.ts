import { findCatalogItem } from './catalog';
import { addDays, dayKey } from './dates';
import type { Asset, LogEntry } from './types';
import { RECOVERY_ID } from './types';

/** Deterministic PRNG so demo data looks the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weekly goals (hours) for a few demo assets, so the Goals screen has something to show. */
const GOALS: Record<string, number> = { coding: 6, crossfit: 4, guitar: 3 };

/** [catalog id, chance of a session on any day, typical minutes, starting hours] */
const PROFILE: [string, number, number, number][] = [
  ['coding', 0.5, 75, 400],
  ['crossfit', 0.4, 60, 120],
  ['guitar', 0.4, 50, 190],
  ['djing', 0.2, 70, 60],
  ['musicProduction', 0.15, 80, 40],
  ['cryptoStrategies', 0.2, 40, 30],
  ['cardCollecting', 0.08, 45, 10],
  ['anime', 0.15, 40, 0],
];

/** A few months of plausible history, for trying the app before real data exists. */
export function buildDemo(today: Date, days = 120): { assets: Asset[]; logs: LogEntry[] } {
  const rand = mulberry32(7);
  const createdAt = addDays(today, -days).toISOString();
  const assets: Asset[] = PROFILE.map(([id, , , startHours]) => {
    const c = findCatalogItem(id)!;
    return { id: `demo_${id}`, catalogId: id, icon: c.icon, color: c.color, energy: c.energy, rhythm: c.rhythm, startingMinutes: startHours * 60, weeklyGoalMinutes: GOALS[id] ? GOALS[id] * 60 : undefined, createdAt };
  });
  const logs: LogEntry[] = [];
  for (let d = days; d >= 0; d--) {
    const day = dayKey(addDays(today, -d));
    const restDay = rand() < 0.18;
    if (restDay) {
      logs.push({ id: `demo_l${logs.length}`, assetId: RECOVERY_ID, day, minutes: 120 + Math.round(rand() * 120), createdAt });
      continue;
    }
    PROFILE.forEach(([id, chance, typical], i) => {
      // One Piece cards go quiet for the last couple of weeks, to show a paused asset.
      if (id === 'cardCollecting' && d < 12) return;
      if (rand() < chance) {
        const minutes = Math.max(15, Math.round((typical * (0.6 + rand() * 0.8)) / 5) * 5);
        logs.push({ id: `demo_l${logs.length}`, assetId: assets[i].id, day, minutes, createdAt });
      }
    });
  }
  return { assets, logs };
}
