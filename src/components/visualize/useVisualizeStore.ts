import { create } from 'zustand';

export type ToolType = 'select' | 'pan' | 'pen' | 'eraser' | 'shape' | 'text' | 'image';
export type ShapeKind = 'rectangle' | 'ellipse' | 'arrow' | 'thought';

export type Point = { x: number; y: number };

export interface CanvasElement {
  id: string;
  type: 'freehand' | 'text' | 'shape' | 'image' | 'ai_visual';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
  content?: string;
  color?: string;
  strokeWidth?: number;
  shapeKind?: ShapeKind;
  imageUrl?: string;
  fontSize?: number;
  isEditing?: boolean;
  zIndex: number;
}

interface VisualizeState {
  camera: { x: number; y: number; zoom: number };
  activeTool: ToolType;
  activeShapeKind: ShapeKind;
  elements: CanvasElement[];
  selectedElementIds: string[];
  currentColor: string;
  penSize: number;
  textSize: number;
  past: CanvasElement[][];
  future: CanvasElement[][];
  isPanning: boolean;
  isDrawing: boolean;
  currentStrokeId: string | null;
  dragStart: { x: number; y: number; camX: number; camY: number } | null;
  elementDrag: { id: string; startX: number; startY: number; elX: number; elY: number } | null;

  setCamera: (camera: { x: number; y: number; zoom: number }) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveShapeKind: (kind: ShapeKind) => void;
  setCurrentColor: (color: string) => void;
  setPenSize: (size: number) => void;
  setTextSize: (size: number) => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  setIsPanning: (v: boolean) => void;
  setIsDrawing: (v: boolean) => void;
  setCurrentStrokeId: (id: string | null) => void;
  setDragStart: (d: { x: number; y: number; camX: number; camY: number } | null) => void;
  setElementDrag: (d: { id: string; startX: number; startY: number; elX: number; elY: number } | null) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useVisualizeStore = create<VisualizeState>((set, get) => ({
  camera: { x: 0, y: 0, zoom: 1 },
  activeTool: 'pan',
  activeShapeKind: 'rectangle',
  elements: [],
  selectedElementIds: [],
  currentColor: '#0EA5E9',
  penSize: 3,
  textSize: 20,
  past: [],
  future: [],
  isPanning: false,
  isDrawing: false,
  currentStrokeId: null,
  dragStart: null,
  elementDrag: null,

  setCamera: (camera) => set({ camera }),
  setActiveTool: (activeTool) => set({ activeTool, selectedElementIds: [] }),
  setActiveShapeKind: (activeShapeKind) => set({ activeShapeKind }),
  setCurrentColor: (currentColor) => set({ currentColor }),
  setPenSize: (penSize) => set({ penSize }),
  setTextSize: (textSize) => set({ textSize }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setCurrentStrokeId: (currentStrokeId) => set({ currentStrokeId }),
  setDragStart: (dragStart) => set({ dragStart }),
  setElementDrag: (elementDrag) => set({ elementDrag }),

  pushHistory: () => {
    const { elements, past } = get();
    set({ past: [...past.slice(-30), JSON.parse(JSON.stringify(elements))], future: [] });
  },

  addElement: (el) => { get().pushHistory(); set((s) => ({ elements: [...s.elements, el] })); },

  updateElement: (id, updates) => {
    set((s) => ({ elements: s.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)) }));
  },

  deleteElement: (id) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedElementIds: s.selectedElementIds.filter((sid) => sid !== id),
    }));
  },

  deleteSelected: () => {
    const { selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    get().pushHistory();
    set((s) => ({
      elements: s.elements.filter((el) => !selectedElementIds.includes(el.id)),
      selectedElementIds: [],
    }));
  },

  selectElement: (id) => set({ selectedElementIds: [id] }),
  clearSelection: () => set({ selectedElementIds: [] }),

  undo: () => {
    const { past, elements, future } = get();
    if (past.length === 0) return;
    set({ past: past.slice(0, -1), future: [JSON.parse(JSON.stringify(elements)), ...future], elements: past[past.length - 1], selectedElementIds: [] });
  },

  redo: () => {
    const { past, elements, future } = get();
    if (future.length === 0) return;
    set({ past: [...past, JSON.parse(JSON.stringify(elements))], future: future.slice(1), elements: future[0], selectedElementIds: [] });
  },
}));
