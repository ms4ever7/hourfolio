import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EarnedBadge } from '@/domain/achievements';
import { buildDemo } from '@/domain/demo';
import { applyGoalPatch } from '@/domain/goals';
import { dayKey } from '@/domain/dates';
import { newId } from '@/domain/ids';
import { mergeMove, type PlannedSession, type WeekPlan } from '@/domain/plan';
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
  /** Badges earned so far. Once here, a badge stays whatever happens to the logs behind it. */
  badges: EarnedBadge[];
  /** Replaces the portfolio with the onboarding picks. Recovery is always added. */
  setUpPortfolio: (assets: NewAsset[]) => void;
  addAsset: (asset: NewAsset) => string;
  updateAsset: (id: string, patch: Partial<NewAsset>) => void;
  /** Takes an asset out of the portfolio with its sessions and its place in every plan. Recovery stays. */
  removeAsset: (id: string) => void;
  logTime: (entry: Omit<LogEntry, 'id' | 'createdAt'>) => void;
  removeLog: (id: string) => void;
  /** Changes how long a log entry was. */
  updateLog: (id: string, minutes: number) => void;
  /** Saves a week's plan, replacing the one already there. */
  setPlan: (plan: WeekPlan) => void;
  movePlannedSession: (weekFrom: string, id: string, day: string) => void;
  removePlannedSession: (weekFrom: string, id: string) => void;
  resizePlannedSession: (weekFrom: string, id: string, minutes: number) => void;
  /** Adds a session to a week's plan, creating the plan if the week has none. */
  addPlannedSession: (weekFrom: string, session: Omit<PlannedSession, 'id'>) => void;
  /** Keeps the badges the data newly supports; ones already kept are left as they were. */
  recordBadges: (found: EarnedBadge[]) => void;
  loadDemo: () => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      assets: [],
      logs: [],
      plans: [],
      badges: [],
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
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? applyGoalPatch<Asset>(a, patch) : a)) })),
      removeAsset: (id) =>
        set((s) =>
          id === RECOVERY_ID
            ? s
            : {
                assets: s.assets.filter((a) => a.id !== id),
                logs: s.logs.filter((l) => l.assetId !== id),
                plans: s.plans.map((p) => ({ ...p, sessions: p.sessions.filter((x) => x.assetId !== id), short: p.short?.filter((x) => x.assetId !== id) })),
                badges: s.badges.filter((b) => !b.id.startsWith(`hours:${id}:`)),
              },
        ),
      logTime: (entry) =>
        set((s) => ({ logs: [...s.logs, { ...entry, id: newId('l'), createdAt: new Date().toISOString() }] })),
      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      updateLog: (id, minutes) =>
        set((s) => (Number.isFinite(minutes) && minutes > 0 ? { logs: s.logs.map((l) => (l.id === id ? { ...l, minutes: Math.round(minutes) } : l)) } : s)),
      setPlan: (plan) =>
        set((s) => ({ plans: [...s.plans.filter((p) => p.weekFrom !== plan.weekFrom), plan].sort((a, b) => a.weekFrom.localeCompare(b.weekFrom)).slice(-MAX_PLANS) })),
      // A day that is over cannot take a session; the screens only offer today and later, this keeps the store honest too.
      movePlannedSession: (weekFrom, id, day) =>
        set((s) =>
          day < dayKey(new Date()) ? s : ({ plans: s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: mergeMove(p.sessions, id, day) } : p)) })),
      removePlannedSession: (weekFrom, id) =>
        set((s) => ({ plans: s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: p.sessions.filter((x) => x.id !== id) } : p)) })),
      resizePlannedSession: (weekFrom, id, minutes) =>
        set((s) => ({ plans: s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: p.sessions.map((x) => (x.id === id ? { ...x, minutes } : x)) } : p)) })),
      addPlannedSession: (weekFrom, session) =>
        set((s) => {
          const added = { ...session, id: newId('plan') };
          const has = s.plans.some((p) => p.weekFrom === weekFrom);
          return { plans: has ? s.plans.map((p) => (p.weekFrom === weekFrom ? { ...p, sessions: [...p.sessions, added] } : p)) : [...s.plans, { weekFrom, sessions: [added] }].sort((a, b) => a.weekFrom.localeCompare(b.weekFrom)) };
        }),
      recordBadges: (found) =>
        set((s) => {
          const fresh = found.filter((b) => !s.badges.some((x) => x.id === b.id));
          return fresh.length ? { badges: [...s.badges, ...fresh] } : s;
        }),
      loadDemo: () => {
        const today = new Date();
        const demo = buildDemo(today);
        set({ assets: [...demo.assets, recoveryAsset(today.toISOString())], logs: demo.logs, plans: [demo.plan], badges: [] });
      },
      reset: () => set({ assets: [], logs: [], plans: [], badges: [] }),
    }),
    { name: 'hourfolio.portfolio', storage: mmkvZustandStorage, version: 1 },
  ),
);
