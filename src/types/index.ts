// ═══════════════════════════════════════════════════════════════
// GRADELYS v2.0 — SHARED TYPES
// Mirrors the Supabase schema in /supabase/schema.sql so the demo
// data layer and the real database stay interchangeable.
// ═══════════════════════════════════════════════════════════════

export type Plan = "free" | "plus" | "pro";
export type UserStatus = "active" | "pending" | "banned" | "deleted";
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  level: string;
  avatarUrl?: string;
  lang: string;
  educationSystem: string;
  role: UserRole;
  status: UserStatus;
  banReason?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface Subscription {
  userId: string;
  plan: Plan;
  status: "active" | "cancelled" | "expired";
  creditsRemaining: number;
  creditsMax: number;
  resetDate: string;
  currentPeriodEnd?: string;
  whopSubscriptionId?: string;
}

export type ModelId = "auto" | "flash" | "pro";

export interface Attachment {
  id: string;
  type: "pdf" | "image" | "youtube" | "url" | "docx" | "txt" | "csv";
  name: string;
  meta?: string;
}

export interface Source {
  id: string;
  title: string;
  snippet: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  attachments?: Attachment[];
  structured?: any;
  createdAt: string;
  feedback?: "up" | "down" | null;
}

export interface Conversation {
  id: string;
  userId: string;
  spaceId?: string | null;
  kind: "chat" | "visualize" | "studio" | "practice";
  title: string;
  model: ModelId;
  webSearchEnabled: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  spaceId?: string | null;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  hint?: string;
  tags: string[];
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt?: string;
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  spaceId?: string | null;
  name: string;
  subject: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface QuizQuestion {
  id: string;
  question: string;
  type: "mcq" | "open";
  options?: string[];
  correct: string;
  explanation: string;
  difficulty: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  spaceId?: string | null;
  mode: "quiz" | "exam" | "flashcards";
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds: number;
  completedAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  spaceId?: string | null;
  subject: string;
  format: string;
  difficulty: string;
  duration: string;
  totalPoints: number;
  contentJson: any; // Contains exercises, questions, instructions
  createdAt: string;
}

export type SpaceTemplate =
  | "subject"
  | "exam-prep"
  | "work"
  | "language"
  | "research"
  | "blank";

export interface Space {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  template: SpaceTemplate;
  createdAt: string;
  updatedAt: string;
}

export type SourceType = "pdf" | "url" | "youtube" | "text" | "spreadsheet" | "image";

export interface SpaceSource {
  id: string;
  spaceId: string;
  type: SourceType;
  name: string;
  url?: string;
  contentPreview: string;
  status: "processing" | "ready" | "error";
  createdAt: string;
}

export type VisualType =
  | "auto"
  | "diagram"
  | "mindmap"
  | "chart"
  | "infographic"
  | "flowchart"
  | "timeline"
  | "concept-map"
  | "comparison";

export interface VisualizeOutput {
  id: string;
  userId: string;
  spaceId?: string | null;
  type: VisualType;
  prompt: string;
  title: string;
  description: string;
  outputData: any;
  createdAt: string;
}

export type StudioDocType = "notes" | "report" | "summary" | "essay" | "slides";

export interface StudioDocument {
  id: string;
  userId: string;
  spaceId?: string | null;
  type: StudioDocType;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanError {
  id: string;
  title: string;
  description: string;
  type: "error" | "weak" | "correct";
}

export interface Scan {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  createdAt: string;
  status: "processing" | "ready" | "error";
  diagnostic?: Diagnostic;
}

export interface Diagnostic {
  currentGrade: number;
  potentialGrade: number;
  errors: ScanError[];
  flashcards: { id: string; question: string; answer: string }[];
  globalFeedback: string;
}

export type BadgeType =
  | "first-steps"
  | "bookworm"
  | "quiz-master"
  | "on-fire"
  | "streak-legend"
  | "card-shark"
  | "memory-pro"
  | "scanner-pro"
  | "visualizer"
  | "author"
  | "multilingual"
  | "power-user"
  | "night-owl"
  | "milestone";

export interface Badge {
  type: BadgeType;
  earnedAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalStudyDays: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  action: string;
  targetUser?: string;
  details: string;
  ip: string;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  details: string;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: Plan;
  credits: number;
  status: UserStatus;
  createdAt: string;
  lastActiveAt: string;
}
