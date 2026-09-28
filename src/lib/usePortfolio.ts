import { useMemo } from 'react';
import { dayKey, parseDay } from '@/domain/dates';
import { capitalMinutes, lastLogDay, momentum, trend, type Trend } from '@/domain/growth';
import { sumMinutes, weeklyMinutes, type Range } from '@/domain/stats';
import type { Asset, LogEntry } from '@/domain/types';
import { usePortfolioStore } from '@/store/portfolio-store';

export interface Holding {
  asset: Asset;
  minutes: number;
  prevMinutes: number;
  sessions: number;
  capital: number;
  momentum: number;
  trend: Trend;
  lastDay: string | null;
  spark: number[];
}

export function usePortfolio() {
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  return { assets, logs };
}

/** Per-asset numbers for a period, sorted by time invested in it. */
export function useHoldings(assets: Asset[], logs: LogEntry[], current: Range, previous: Range | null, today: Date): Holding[] {
  return useMemo(() => {
    return assets
      .map((asset) => ({
        asset,
        minutes: sumMinutes(logs, current, asset.id),
        prevMinutes: previous ? sumMinutes(logs, previous, asset.id) : 0,
        sessions: logs.filter((l) => l.assetId === asset.id && l.day >= current.from && l.day <= current.to).length,
        capital: capitalMinutes(asset, logs),
        momentum: momentum(asset, logs, today),
        trend: trend(asset, logs, today),
        lastDay: lastLogDay(asset.id, logs),
        spark: weeklyMinutes(logs, asset.id, 8, today),
      }))
      .sort((a, b) => b.minutes - a.minutes || (b.lastDay ?? '').localeCompare(a.lastDay ?? ''));
  }, [assets, logs, current, previous, today]);
}

/** Today at local midnight; the same object until the date changes, so memos hold. */
export function useToday(): Date {
  const key = dayKey(new Date());
  return useMemo(() => parseDay(key), [key]);
}
