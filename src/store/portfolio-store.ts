import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDemo } from '@/domain/demo';
import { newId } from '@/domain/ids';
import type { WeekPlan } from '@/domain/plan';
import type { Asset, LogEntry } from '@/domain/types';
import { RECOVERY_ID } from '@/domain/types';
import { mmkvZustandStorage } from './mmkv-storage';

export const recoveryAsset = (createdAt: string): Asset => ({
  id: RECOVERY_ID,
  catalogId: RECOVERY_ID,
  icon: 'moon',
  color: 'sky',
  energy: 'recovery',
  rhythm: 'fewPerWeek',
  startingMinutes: 0,
  createdAt,
});

/** Old weeks are of no use; keeps the list from growing forever. */
const MAX_PLANS = 8;

export type NewAsset = Omit<Asset, 'id' | 'createdAt'>;

interface PortfolioState {
  assets: Asset[];
  logs: LogEntry[];
  /** One plan per week, newest last. */
  plans: WeekPlan[];
  /** Replaces the portfolio with the onboarding picks. Recovery is always added. */
  setUpPortfolio: (assets: NewAsset[]) => void;
  addAsset: (asset: NewAsset) => string;
  updateAsset: (id: string, patch: Partial<NewAsset>) => void;
  logTime: (entry: Omit<LogEntry, 'id' | 'createdAt'>) => void;
  removeLog: (id: string) => void;
  /** Saves a week's plan, replacing the one already there. */
  setPlan: (plan: WeekPlan) => void;
  movePlannedSession: (weekFrom: string, id: string, day: string) => void;
  removePlannedSession: (weekFrom: string, id: string) => void;
  loadDemo: () => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      assets: [],
      logs: [],
      plans: [],
      setUpPortfolio: (picks) => {
        const now = new Date().toISOString();
        set({
          assets: [...picks.map((a) => ({ ...a, id: newId('a'), createdAt: now })), recoveryAsset(now)],
        });
      },
      addAsset: (asset) => {
        const id = newId('a');
        set((s) => ({ assets: [...s.assets, { ...asset, id, createdAt: new Date().toISOString() }] }));
        return id;
      },
      updateAsset: (id, patch) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      logTime: (entry) =>
        set((s) => ({ logs: [...s.logs, { ...entry, id: newId('l'), createdAt: new Date().toISOString() }] })),
      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      setPlan: (plan) =>
        set((s) => ({ plans: [...s.plans.filter((p) => p.weekFrom !== plan.weekFrom), plan].sort((a, b) => a.weekFrom.localeCompare(b.weekFrom)).slice(-MAX_PLANS) })),
      movePlannedSession: (weekFrom, id, day) =>
        set((s) => ({ plans: s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: p.sessions.map((x) => (x.id === id ? { ...x, day } : x)) } : p)) })),
      removePlannedSession: (weekFrom, id) =>
        set((s) => ({ plans: s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: p.sessions.filter((x) => x.id !== id) } : p)) })),
      loadDemo: () => {
        const today = new Date();
        const demo = buildDemo(today);
        set({ assets: [...demo.assets, recoveryAsset(today.toISOString())], logs: demo.logs, plans: [demo.plan] });
      },
      reset: () => set({ assets: [], logs: [], plans: [] }),
    }),
    { name: 'hourfolio.portfolio', storage: mmkvZustandStorage, version: 1 },
  ),
);
