"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Brain,
  Layers,
  Clock,
  Network,
  GitBranch,
  PieChart as PieChartIcon,
  GitCompare,
  FileText,
  ScrollText,
  FileStack,
  PenTool,
  Presentation,
  ImageIcon,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/locale-provider";
import { ToolKind } from "./tool-chat-thread";

export type CapabilityCategory = "all" | "practice" | "visuals" | "documents";

export interface StudioCapability {
  id: string;
  category: "practice" | "visuals" | "documents";
  categoryName: string;
  title: string;
  subtitle: string;
  description: string;
  promptExample: string;
  kind: ToolKind;
  subKind?: string;
  visualType?: string;
  difficulty?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STUDIO_CAPABILITIES: StudioCapability[] = [
  // --- ENTRAÎNEMENT ---
  {
    id: "flashcards",
    category: "practice",
    categoryName: "Entraînement",
    title: "Flashcards",
    subtitle: "Cartes mémoires pour révision espacée",
    description: "Fiches questions-réponses pour mémoriser les formules, définitions et concepts clés.",
    promptExample: "Crée un paquet de flashcards sur les notions clés de ce chapitre pour réviser.",
    kind: "practice",
    subKind: "flashcards",
    icon: Layers,
  },
  {
    id: "quiz",
    category: "practice",
    categoryName: "Entraînement",
    title: "Quiz",
    subtitle: "QCM interactif avec explications",
    description: "Questions à choix multiples avec corrections détaillées et justifications immédiates.",
    promptExample: "Génère un quiz de 10 questions avec explications sur ce document.",
    kind: "practice",
    subKind: "quiz",
    icon: Brain,
  },
  {
    id: "exam",
    category: "practice",
    categoryName: "Entraînement",
    title: "Examen blanc",
    subtitle: "Épreuve complète notée par l'IA",
    description: "Simulation d'examen en conditions réelles avec barème et correction approfondie.",
    promptExample: "Prépare un examen blanc complet de niveau standard avec barème et corrigé.",
    kind: "practice",
    subKind: "exam",
    difficulty: "Normal",
    icon: Clock,
  },

  // --- VISUELS ---
  {
    id: "infographic",
    category: "visuals",
    categoryName: "Visuel",
    title: "Infographie",
    subtitle: "Synthèse visuelle grand format",
    description: "Planche graphique ordonnée résumant l'essentiel avec métriques et repères visuels.",
    promptExample: "Crée une infographie claire résumant les thèmes majeurs du document.",
    kind: "visualize",
    visualType: "infographic",
    icon: ImageIcon,
  },
  {
    id: "diagram",
    category: "visuals",
    categoryName: "Visuel",
    title: "Diagramme",
    subtitle: "Flux logiques & processus",
    description: "Schémas étape par étape pour modéliser des cycles, interactions ou mécanismes.",
    promptExample: "Génère un diagramme de flux expliquant les étapes du processus.",
    kind: "visualize",
    visualType: "diagram",
    icon: Network,
  },
  {
    id: "mindmap",
    category: "visuals",
    categoryName: "Visuel",
    title: "Mind map",
    subtitle: "Carte mentale & arborescence",
    description: "Arborescence rayonnante connectant le thème central à tous ses sous-sujets.",
    promptExample: "Construis une carte mentale reliant tous les concepts du cours.",
    kind: "visualize",
    visualType: "mindmap",
    icon: GitBranch,
  },
  {
    id: "chart",
    category: "visuals",
    categoryName: "Visuel",
    title: "Graphique",
    subtitle: "Visualisation de données & chiffres",
    description: "Graphiques comparatifs (barres, camemberts) pour interpréter les statistiques.",
    promptExample: "Génère un graphique comparant les données et proportions clés.",
    kind: "visualize",
    visualType: "chart",
    icon: PieChartIcon,
  },
  {
    id: "timeline",
    category: "visuals",
    categoryName: "Visuel",
    title: "Frise chronologique",
    subtitle: "Ligne du temps & jalons",
    description: "Ordre chronologique des événements historiques ou étapes d'un projet.",
    promptExample: "Crée une frise chronologique détaillée des événements clés dans l'ordre.",
    kind: "visualize",
    visualType: "timeline",
    icon: Clock,
  },
  {
    id: "comparison",
    category: "visuals",
    categoryName: "Visuel",
    title: "Tableau comparatif",
    subtitle: "Comparaison directe côte à côte",
    description: "Matrice synthétique mettant en contraste notions, théories ou approches.",
    promptExample: "Fais un tableau comparatif mettant en regard les points forts et limites.",
    kind: "visualize",
    visualType: "comparison",
    icon: GitCompare,
  },

  // --- DOCUMENTS ---
  {
    id: "notes",
    category: "documents",
    categoryName: "Document",
    title: "Fiche de révision",
    subtitle: "Study note structurée pour examen",
    description: "Synthèse de cours claire avec définitions encadrées, formules et points clés.",
    promptExample: "Rédige une fiche de révision complète et structurée pour préparer l'examen.",
    kind: "studio",
    visualType: "notes",
    icon: FileText,
  },
  {
    id: "summary",
    category: "documents",
    categoryName: "Document",
    title: "Résumé",
    subtitle: "Condensé dense sans superflu",
    description: "Synthèse concise qui extrait l'essentiel de vos sources sans perte d'information.",
    promptExample: "Fais-moi un résumé dense et concis des idées majeures.",
    kind: "studio",
    visualType: "summary",
    icon: ScrollText,
  },
  {
    id: "report",
    category: "documents",
    categoryName: "Document",
    title: "Rapport",
    subtitle: "Dossier formel & structuré",
    description: "Document complet avec introduction, développement thématique et conclusion.",
    promptExample: "Rédige un rapport formel et structuré avec analyse et conclusion.",
    kind: "studio",
    visualType: "report",
    icon: FileStack,
  },
  {
    id: "essay",
    category: "documents",
    categoryName: "Document",
    title: "Dissertation",
    subtitle: "Essai argumenté avec plan académique",
    description: "Réflexion structurée avec problématique, parties argumentées et synthèse critique.",
    promptExample: "Rédige une dissertation argumentée avec problématique et plan rigoureux.",
    kind: "studio",
    visualType: "essay",
    icon: PenTool,
  },
  {
    id: "slides",
    category: "documents",
    categoryName: "Document",
    title: "Présentation",
    subtitle: "Diaporama complet par slides",
    description: "Présentation prête à projeter avec structure claire et points d'impact.",
    promptExample: "Génère un diaporama de présentation avec une slide par concept.",
    kind: "studio",
    visualType: "slides",
    icon: Presentation,
  },
];

interface StudioCapabilitiesModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCapability: (cap: StudioCapability, mode: "fill" | "direct") => void;
  hasSelectedSpace?: boolean;
}

export function StudioCapabilitiesModal({
  open,
  onClose,
  onSelectCapability,
}: StudioCapabilitiesModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<CapabilityCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filteredCapabilities = React.useMemo(() => {
    return STUDIO_CAPABILITIES.filter((cap) => {
      const matchesCategory = activeTab === "all" || cap.category === activeTab;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (t(`format.${cap.id}.title`) || cap.title).toLowerCase();
      const subtitle = (t(`format.${cap.id}.sub`) || cap.subtitle).toLowerCase();
      const description = (t(`format.${cap.id}.desc`) || cap.description).toLowerCase();
      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        description.includes(q) ||
        cap.title.toLowerCase().includes(q) ||
        cap.subtitle.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery, t]);

  const handleCopyPrompt = (e: React.MouseEvent, cap: StudioCapability) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cap.promptExample);
    setCopiedId(cap.id);
    toast.success(t("studio.modal.promptCopied"));
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!mounted) return null;

  const categories = [
    { id: "all" as const, label: t("studio.modal.tabAll"), count: STUDIO_CAPABILITIES.length },
    { id: "practice" as const, label: t("studio.modal.tabPractice"), count: 3 },
    { id: "visuals" as const, label: t("studio.modal.tabVisuals"), count: 6 },
    { id: "documents" as const, label: t("studio.modal.tabDocuments"), count: 5 },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Subtle backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Minimalist Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border-default bg-elevated shadow-xl overflow-hidden"
          >
            {/* Minimal Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border-subtle bg-elevated">
              <div>
                <h3 className="text-heading-sm font-semibold text-text-primary">
                  {t("studio.whatCanICreate")}
                </h3>
                <p className="mt-0.5 text-body-xs text-text-muted">
                  {t("studio.capabilitiesDesc")}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter toolbar: Search & clean tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b border-border-subtle bg-surface/50">
              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {categories.map((cat) => {
                  const isActive = activeTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveTab(cat.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-label-xs font-medium transition-colors shrink-0",
                        isActive
                          ? "bg-primary text-white"
                          : "text-text-muted hover:text-text-primary hover:bg-hover"
                      )}
                    >
                      {cat.label}{" "}
                      <span className={cn("text-[10px]", isActive ? "text-white/80" : "text-text-muted")}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Minimal search */}
              <div className="relative sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("studio.modal.filterPlaceholder")}
                  className="w-full rounded-lg border border-border-default bg-elevated pl-8 pr-6 py-1 text-body-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredCapabilities.length === 0 ? (
                <div className="py-12 text-center text-body-sm text-text-muted">
                  {t("studio.modal.noMatch")} &laquo; {searchQuery} &raquo;
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredCapabilities.map((cap) => {
                    const Icon = cap.icon;
                    const capTitle = t(`format.${cap.id}.title`) || cap.title;
                    const capSub = t(`format.${cap.id}.sub`) || cap.subtitle;
                    const capCat = t(`format.cat.${cap.category === "practice" ? "practice" : cap.category === "visuals" ? "visual" : "document"}`) || cap.categoryName;
                    return (
                      <div
                        key={cap.id}
                        onClick={() => onSelectCapability(cap, "direct")}
                        className="group relative flex items-start justify-between gap-3 rounded-xl border border-border-subtle bg-elevated p-3.5 hover:border-primary/40 hover:bg-hover cursor-pointer transition-all duration-150"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary group-hover:text-primary group-hover:border-primary/30 transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-body-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                                {capTitle}
                              </h4>
                              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                                • {capCat}
                              </span>
                            </div>
                            <p className="mt-0.5 text-body-xs text-text-muted line-clamp-1">
                              {capSub}
                            </p>
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyPrompt(e, cap)}
                            title="Copier l'exemple de prompt"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-all"
                          >
                            {copiedId === cap.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="p-1 text-text-muted group-hover:text-primary transition-colors">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Minimal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-surface/50 text-[11px] text-text-muted">
              <span>{STUDIO_CAPABILITIES.length} {t("studio.modal.footerFormats")}</span>
              <span>{t("studio.modal.footerHint")}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
