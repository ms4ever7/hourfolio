import { CATALOG } from './catalog';
import type { EnergyType, IconKey, PaletteKey, Rhythm } from './types';

export interface Suggestion {
  icon: IconKey;
  color: PaletteKey;
  energy: EnergyType;
  rhythm: Rhythm;
}

const FALLBACK: Suggestion = { icon: 'star', color: 'violet', energy: 'creative', rhythm: 'weekly' };

/**
 * Setup for a custom asset, matched against catalog names and keywords.
 * Rule-based for now; on-device Apple Foundation Models can replace it later
 * behind the same signature.
 */
export function suggestSetup(name: string, catalogNames: Record<string, string>): Suggestion {
  const q = name.trim().toLowerCase();
  if (!q) return FALLBACK;
  const hit = CATALOG.find((c) => {
    const words = [c.id.toLowerCase(), (catalogNames[c.id] ?? '').toLowerCase(), ...c.keywords];
    return words.some((w) => w && (q.includes(w) || w.includes(q)));
  });
  return hit ? { icon: hit.icon, color: hit.color, energy: hit.energy, rhythm: hit.rhythm } : FALLBACK;
}
