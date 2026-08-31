export const SPACE_TEMPLATES = [
  { id: "subject", label: "📘 Subject", color: "#0EA5E9" },
  { id: "exam-prep", label: "🎯 Exam prep", color: "#EF4444" },
  { id: "work", label: "💼 Work", color: "#3B82F6" },
  { id: "language", label: "🗣️ Language", color: "#10B981" },
  { id: "research", label: "🔬 Research", color: "#8B5CF6" },
  { id: "blank", label: "📄 Blank", color: "#64748B" },
] as const;

export type SpaceTemplateOption = (typeof SPACE_TEMPLATES)[number];
