import { create } from 'zustand';

interface AppStore {
  pendingApprovals: number;
  setPendingApprovals: (count: number) => void;
  decrementApprovals: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  pendingApprovals: 0,
  setPendingApprovals: (count) => set({ pendingApprovals: count }),
  decrementApprovals: () =>
    set((state) => ({
      pendingApprovals: Math.max(0, state.pendingApprovals - 1),
    })),
}));
