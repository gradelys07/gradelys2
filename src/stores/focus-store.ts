import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FocusState {
  isActive: boolean;
  seconds: number;
  isMinimized: boolean;
  startFocus: () => void;
  pauseFocus: () => void;
  stopFocus: () => void;
  resetFocus: () => void;
  tick: () => void;
  setMinimized: (min: boolean) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      isActive: false,
      seconds: 0,
      isMinimized: false,
      startFocus: () => set({ isActive: true, isMinimized: true }),
      pauseFocus: () => set({ isActive: false }),
      stopFocus: () => set({ isActive: false }),
      resetFocus: () => set({ isActive: false, seconds: 0, isMinimized: false }),
      tick: () => set((state) => ({ seconds: state.seconds + 1 })),
      setMinimized: (min) => set({ isMinimized: min }),
    }),
    {
      name: "focus-timer-storage",
      partialize: (state) => ({ seconds: state.seconds, isActive: state.isActive, isMinimized: state.isMinimized }),
    }
  )
);
