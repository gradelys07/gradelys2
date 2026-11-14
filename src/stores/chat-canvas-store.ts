import { create } from "zustand";

export interface CanvasMediaItem {
  url: string;
  candidates?: string[];
  caption: string;
  title?: string;
  source?: string;
  pageUrl?: string;
}

export interface CanvasYouTubeVideo {
  videoId: string;
  title: string;
  channel?: string;
  duration?: string;
}

export interface ChatCanvasArtifact {
  id: string;
  conversationId?: string;
  type: "python" | "chart" | "mermaid" | "images" | "youtube";
  title: string;
  code?: string;
  images?: string[];
  stdout?: string;
  chartData?: any;
  mediaItems?: CanvasMediaItem[];
  youtubeVideos?: CanvasYouTubeVideo[];
  createdAt: number;
}

interface ChatCanvasState {
  isOpen: boolean;
  activeArtifactId: string | null;
  artifacts: ChatCanvasArtifact[];
  upsertArtifact: (artifact: Omit<ChatCanvasArtifact, "createdAt">, autoOpen?: boolean) => void;
  openArtifact: (id: string) => void;
  setOpen: (open: boolean) => void;
}

export const useChatCanvasStore = create<ChatCanvasState>((set) => ({
  isOpen: false,
  activeArtifactId: null,
  artifacts: [],

  upsertArtifact: (artifact, autoOpen = false) =>
    set((state) => {
      const existingIndex = state.artifacts.findIndex((a) => a.id === artifact.id);
      const nextItem: ChatCanvasArtifact = {
        ...artifact,
        createdAt: existingIndex >= 0 ? state.artifacts[existingIndex].createdAt : Date.now(),
      };

      const nextArtifacts =
        existingIndex >= 0
          ? state.artifacts.map((a, idx) => (idx === existingIndex ? { ...a, ...nextItem } : a))
          : [...state.artifacts, nextItem];

      return {
        artifacts: nextArtifacts,
        activeArtifactId: autoOpen ? artifact.id : state.activeArtifactId ?? artifact.id,
        isOpen: autoOpen ? true : state.isOpen,
      };
    }),

  openArtifact: (id) =>
    set({
      activeArtifactId: id,
      isOpen: true,
    }),

  setOpen: (open) => set({ isOpen: open }),
}));

