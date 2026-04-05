import { create } from 'zustand';

const NEVER_SHOW_KEY = 'csa_tutorial_never_show';

interface TutorialStore {
  isActive: boolean;
  step: number;
  neverShowAgain: boolean;

  startTutorial: () => void;
  advanceStep: () => void;
  setStep: (step: number) => void;
  skipTutorial: () => void;
  setNeverShowAgain: (val: boolean) => void;
}

export const useTutorial = create<TutorialStore>((set) => ({
  isActive: false,
  step: 0,
  neverShowAgain:
    typeof window !== 'undefined' &&
    localStorage.getItem(NEVER_SHOW_KEY) === 'true',

  startTutorial: () => set({ isActive: true, step: 0 }),

  advanceStep: () =>
    set((s) => ({ step: Math.min(s.step + 1, 7) })),

  setStep: (step) => set({ step }),

  skipTutorial: () => set({ isActive: false }),

  setNeverShowAgain: (val) => {
    try {
      if (val) localStorage.setItem(NEVER_SHOW_KEY, 'true');
      else localStorage.removeItem(NEVER_SHOW_KEY);
    } catch (_) {}
    set({ neverShowAgain: val });
  },
}));
