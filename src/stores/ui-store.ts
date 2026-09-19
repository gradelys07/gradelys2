import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  toolsMode: boolean;
  newSpaceOpen: boolean;
  historySidebarOpen: boolean;
  activeSpaceId: string | null;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setToolsMode: (open: boolean) => void;
  setNewSpaceOpen: (open: boolean) => void;
  setHistorySidebarOpen: (open: boolean) => void;
  setActiveSpaceId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileNavOpen: false,
  toolsMode: false,
  newSpaceOpen: false,
  historySidebarOpen: false,
  activeSpaceId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setToolsMode: (open) => set({ toolsMode: open }),
  setNewSpaceOpen: (open) => set({ newSpaceOpen: open }),
  setHistorySidebarOpen: (open) => set({ historySidebarOpen: open }),
  setActiveSpaceId: (id) => set({ activeSpaceId: id }),
}));
