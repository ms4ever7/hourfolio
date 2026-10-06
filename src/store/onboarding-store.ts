import { create } from 'zustand';
import { deletePhoto } from '@/lib/photos';
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
  setDrafts: (drafts) =>
    set((s) => {
      // Going back to the pick screen rebuilds the drafts: drop photos nobody references any more.
      const kept = new Set(drafts.flatMap((d) => (d.face?.kind === 'photo' ? [d.face.file] : [])));
      for (const d of s.drafts) if (d.face?.kind === 'photo' && !kept.has(d.face.file)) deletePhoto(d.face.file);
      return { drafts };
    }),
  updateDraft: (index, patch) =>
    set((s) => ({ drafts: s.drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)) })),
  addDraft: (draft) => set((s) => ({ drafts: [...s.drafts, draft] })),
}));
