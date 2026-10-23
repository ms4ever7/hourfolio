import { useEffect } from 'react';
import { dayKey, startOfWeek } from '@/domain/dates';
import { snapshotGoals, weeksToFreeze } from '@/domain/goal-history';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useToday } from './usePortfolio';

/**
 * Keeps the per-week goal snapshots: the current week follows today's goals, and a
 * finished week without one (from before snapshots existed, or a week the app was
 * not opened in) is frozen at the first run after it. Runs in the root layout, like
 * the badge sync; the store ignores a snapshot that has not changed.
 */
export function useGoalHistorySync() {
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  const weekGoals = usePortfolioStore((s) => s.weekGoals);
  const record = usePortfolioStore((s) => s.recordWeekGoals);
  const today = useToday();
  useEffect(() => {
    if (assets.length === 0) return;
    const snapshot = snapshotGoals(assets);
    record(dayKey(startOfWeek(today)), snapshot);
    for (const week of weeksToFreeze(weekGoals, logs, today)) record(week, snapshot);
  }, [assets, logs, weekGoals, today, record]);
}
