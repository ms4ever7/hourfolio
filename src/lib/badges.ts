import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { badgesAhead, detectBadges, sortEarned, type BadgeDef, type EarnedBadge } from '@/domain/achievements';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAssetName } from './labels';

/**
 * Keeps the badge list up to date: whatever the data newly supports is recorded, and
 * nothing is ever taken away. Runs in the root layout so it does not depend on which
 * screen is open; the store ignores badges it already has.
 */
export function useBadgeSync() {
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  const plans = usePortfolioStore((s) => s.plans);
  const weekGoals = usePortfolioStore((s) => s.weekGoals);
  const recordBadges = usePortfolioStore((s) => s.recordBadges);
  useEffect(() => {
    const found = detectBadges(assets, logs, plans, weekGoals);
    if (found.length > 0) recordBadges(found);
  }, [assets, logs, plans, weekGoals, recordBadges]);
}

/** Earned badges newest first, and the ones still ahead in shelf order. */
export function useBadges(): { earned: EarnedBadge[]; ahead: BadgeDef[] } {
  const assets = usePortfolioStore((s) => s.assets);
  const badges = usePortfolioStore((s) => s.badges);
  return useMemo(() => ({ earned: sortEarned(badges), ahead: badgesAhead(assets, badges.map((b) => b.id)) }), [assets, badges]);
}

/** A badge's name in the app language; hour badges carry their hobby's name. */
export function useBadgeName() {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const assets = usePortfolioStore((s) => s.assets);
  return (def: BadgeDef): string => {
    if (def.kind === 'fixed') return t(`badges.${def.id}.name`);
    const asset = assets.find((a) => a.id === def.assetId);
    return t('badges.hours.name', { hours: def.hours, name: asset ? assetName(asset) : '' });
  };
}
