import { create } from 'zustand';
import type { NewAsset } from './portfolio-store';

/** In-progress onboarding picks. Not persisted: onboarding is short. */
interface OnboardingState {
  drafts: NewAsset[];
  setDrafts: (drafts: NewAsset[]) => void;
  updateDraft: (index: number, patch: Partial<NewAsset>) => void;
  addDraft: (draft: NewAsset) => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  drafts: [],
  setDrafts: (drafts) => set({ drafts }),
  updateDraft: (index, patch) =>
    set((s) => ({ drafts: s.drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)) })),
  addDraft: (draft) => set((s) => ({ drafts: [...s.drafts, draft] })),
}));
