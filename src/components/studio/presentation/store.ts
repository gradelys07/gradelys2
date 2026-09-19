import { create } from "zustand";
import { PresentationDocument, Slide, PresentationElement } from "./types";

interface PresentationState {
  document: PresentationDocument | null;
  activeSlideId: string | null;
  selectedElementIds: string[];
  
  // Undo/Redo history
  past: PresentationDocument[];
  future: PresentationDocument[];
  
  // Actions
  setDocument: (doc: PresentationDocument) => void;
  setActiveSlide: (slideId: string) => void;
  setSelectedElements: (elementIds: string[]) => void;
  
  // Modifications
  addSlide: (slide: Slide, index?: number) => void;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  deleteSlide: (slideId: string) => void;
  
  addElement: (slideId: string, element: PresentationElement) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<PresentationElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  
  updateTheme: (updates: Partial<PresentationDocument["theme"]>) => void;
  
  undo: () => void;
  redo: () => void;
}

const saveState = (state: PresentationState, newDoc: PresentationDocument): Partial<PresentationState> => {
  if (!state.document) return { document: newDoc };
  return {
    document: newDoc,
    past: [...state.past, state.document],
    future: [],
  };
};

export const usePresentationStore = create<PresentationState>((set, get) => ({
  document: null,
  activeSlideId: null,
  selectedElementIds: [],
  past: [],
  future: [],

  setDocument: (doc) => set({ document: doc, past: [], future: [], activeSlideId: doc?.slides?.[0]?.id || null, selectedElementIds: [] }),
  
  setActiveSlide: (slideId) => set({ activeSlideId: slideId, selectedElementIds: [] }),
  
  setSelectedElements: (elementIds) => set({ selectedElementIds: elementIds }),

  addSlide: (slide, index) => set((state) => {
    if (!state.document) return state;
    const slides = [...state.document.slides];
    if (index !== undefined) {
      slides.splice(index, 0, slide);
    } else {
      slides.push(slide);
    }
    return saveState(state, { ...state.document, slides });
  }),

  updateSlide: (slideId, updates) => set((state) => {
    if (!state.document) return state;
    const slides = state.document.slides.map(s => s.id === slideId ? { ...s, ...updates } : s);
    return saveState(state, { ...state.document, slides });
  }),

  deleteSlide: (slideId) => set((state) => {
    if (!state.document) return state;
    const slides = state.document.slides.filter(s => s.id !== slideId);
    let nextActive = state.activeSlideId;
    if (nextActive === slideId) {
      nextActive = slides[0]?.id || null;
    }
    return {
      ...saveState(state, { ...state.document, slides }),
      activeSlideId: nextActive,
      selectedElementIds: []
    };
  }),

  addElement: (slideId, element) => set((state) => {
    if (!state.document) return state;
    const slides = state.document.slides.map(s => {
      if (s.id !== slideId) return s;
      return { ...s, elements: [...s.elements, element] };
    });
    return saveState(state, { ...state.document, slides });
  }),

  updateElement: (slideId, elementId, updates) => set((state) => {
    if (!state.document) return state;
    const slides = state.document.slides.map(s => {
      if (s.id !== slideId) return s;
      const elements = s.elements.map(e => {
        if (e.id !== elementId) return e;
        // Merge deeply for properties if they exist in updates
        const mergedProperties = updates.properties 
          ? { ...e.properties, ...updates.properties } 
          : e.properties;
        return { ...e, ...updates, properties: mergedProperties } as PresentationElement;
      });
      return { ...s, elements };
    });
    return saveState(state, { ...state.document, slides });
  }),

  deleteElement: (slideId, elementId) => set((state) => {
    if (!state.document) return state;
    const slides = state.document.slides.map(s => {
      if (s.id !== slideId) return s;
      return { ...s, elements: s.elements.filter(e => e.id !== elementId) };
    });
    return {
      ...saveState(state, { ...state.document, slides }),
      selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
    };
  }),

  updateTheme: (updates) => set((state) => {
    if (!state.document) return state;
    return saveState(state, {
      ...state.document,
      theme: { ...state.document.theme, ...updates }
    });
  }),

  undo: () => set((state) => {
    if (state.past.length === 0 || !state.document) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    return {
      past: newPast,
      document: previous,
      future: [state.document, ...state.future]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0 || !state.document) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      past: [...state.past, state.document],
      document: next,
      future: newFuture
    };
  })
}));
