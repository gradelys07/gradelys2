import { create } from "zustand";
import type { Subscription, User } from "@/types";

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  initialized: boolean;
  showAuthModal: boolean;
  setSession: (user: User | null, subscription: Subscription | null) => void;
  setLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
  setShowAuthModal: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  subscription: null,
  loading: true,
  initialized: false,
  showAuthModal: false,
  setSession: (user, subscription) => set({ user, subscription, loading: false }),
  setLoading: (v) => set({ loading: v }),
  setInitialized: (v) => set({ initialized: v }),
  setShowAuthModal: (v) => set({ showAuthModal: v }),
  clear: () => set({ user: null, subscription: null, loading: false, showAuthModal: false }),
}));
