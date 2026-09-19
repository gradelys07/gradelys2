export type ElementType = "text" | "image" | "shape" | "chart" | "table";

export interface PresentationTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  properties: {
    content: string;
    fontSize: number;
    fontWeight: 400 | 500 | 600 | 700 | 800;
    color: string;
    alignment: "left" | "center" | "right" | "justify";
    lineHeight: number;
    letterSpacing: number;
    isHeading?: boolean;
  };
}

export interface ImageElement extends BaseElement {
  type: "image";
  properties: {
    src: string;
    url?: string; // legacy support
    alt?: string;
    objectFit: "contain" | "cover" | "fill";
    opacity: number;
    borderRadius: number;
  };
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  properties: {
    shapeType: "rectangle" | "circle" | "rounded-rectangle" | "triangle" | "line";
    fill: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity: number;
  };
}

export interface ChartDataset {
  label: string;
  values: number[];
  color?: string;
}

export interface ChartElement extends BaseElement {
  type: "chart";
  properties: {
    chartType: "bar" | "line" | "area" | "pie" | "doughnut";
    title?: string;
    labels: string[];
    datasets: ChartDataset[];
    showLegend: boolean;
    showAxes: boolean;
  };
}

export interface TableCell {
  value: string;
  isHeader?: boolean;
  align?: "left" | "center" | "right";
}

export interface TableElement extends BaseElement {
  type: "table";
  properties: {
    columns: number;
    rows: number;
    data: TableCell[][];
    headerColor?: string;
    borderColor?: string;
  };
}

export type PresentationElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | ChartElement
  | TableElement;

export interface SlideBackground {
  type: "solid" | "gradient" | "image";
  value: string; // Hex color, CSS gradient, or Image URL
}

export interface Slide {
  id: string;
  layout: string; // e.g., "hero", "twoColumn", "blank"
  background: SlideBackground;
  elements: PresentationElement[];
}

export interface PresentationMetadata {
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationDocument {
  version: 1;
  metadata: PresentationMetadata;
  theme: PresentationTheme;
  slides: Slide[];
}

export interface AIOperation {
  action:
    | "add_element"
    | "update_element"
    | "delete_element"
    | "add_slide"
    | "update_slide"
    | "delete_slide"
    | "change_layout"
    | "change_theme";
  targetId?: string; // slideId or elementId
  changes?: Record<string, any>; // Partial properties to update
}
