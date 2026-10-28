"use client";

import * as React from "react";
import { Plus, Check, Trash2, Eye, Play, Sparkles, Loader2, CheckSquare, Square } from "lucide-react";
import { useTranslation } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { SpaceSource } from "@/types";
import { SourceViewerModal, getSourceIcon } from "./source-viewer-modal";

interface SpaceSourcesBarProps {
  spaceId: string;
  sources?: SpaceSource[];
  isLoading?: boolean;
  activeSourceIds: string[];
  onToggleSource: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddClick: () => void;
  onDeleteSource: (id: string) => void;
  className?: string;
}

export function SpaceSourcesBar({
  spaceId,
  sources,
  isLoading,
  activeSourceIds,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onAddClick,
  onDeleteSource,
  className,
}: SpaceSourcesBarProps) {
  const { t } = useTranslation();
  const [selectedSourceForViewer, setSelectedSourceForViewer] = React.useState<SpaceSource | null>(null);

  const totalCount = sources?.length || 0;
  const activeCount = sources?.filter((s) => activeSourceIds.includes(s.id)).length || 0;
  const allActive = totalCount > 0 && activeCount === totalCount;

  return (
    <div className={cn("flex flex-col gap-1.5 sm:gap-2 rounded-2xl border border-border-subtle bg-base/80 p-2 sm:p-3 backdrop-blur-md shadow-xs touch-manipulation", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-label-sm sm:text-label-md font-semibold text-text-primary whitespace-nowrap">
            {t("sources.title")}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] sm:text-label-xs font-medium border transition-colors whitespace-nowrap",
              activeCount > 0
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-surface-subtle text-text-muted border-border-subtle"
            )}
          >
            {t("sources.activeCount")
              .replace("{active}", String(activeCount))
              .replace("{total}", String(totalCount))}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {totalCount > 1 && (
            <button
              type="button"
              onClick={allActive ? onDeselectAll : onSelectAll}
              className="inline-flex items-center gap-1 text-[11px] sm:text-label-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer px-1.5 py-1 rounded touch-manipulation active:scale-95"
            >
              <span>{allActive ? t("sources.deselectAll") : t("sources.selectAll")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex items-center gap-1 rounded-full border border-border-default bg-elevated px-2 sm:px-2.5 py-1 text-[11px] sm:text-label-xs font-medium text-text-primary hover:border-primary/50 hover:bg-hover transition-all shadow-2xs touch-manipulation active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span className="hidden xs:inline">{t("sources.addSource")}</span>
            <span className="inline xs:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Sources list container */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        {isLoading && (
          <div className="flex h-11 sm:h-12 items-center gap-2 rounded-xl border border-border bg-surface px-3 sm:px-4 text-label-xs sm:text-label-sm text-text-muted shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Chargement des sources...</span>
          </div>
        )}

        {!isLoading && totalCount === 0 && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-subtle/40 px-3 text-label-xs sm:text-label-sm text-text-muted hover:border-primary/50 hover:text-primary transition-all group touch-manipulation active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
            <span>{t("sources.emptyDesc")}</span>
          </button>
        )}

        {sources?.map((source) => {
          const isActive = activeSourceIds.includes(source.id);
          const meta = getSourceIcon(source.type);
          const Icon = meta.icon;
          const isYouTube = source.type === "youtube";

          return (
            <div
              key={source.id}
              className={cn(
                "group relative flex shrink-0 items-center gap-1.5 sm:gap-2.5 rounded-xl border py-1 sm:py-1.5 pl-1.5 sm:pl-2.5 pr-1.5 sm:pr-2 transition-all duration-200 select-none shadow-2xs touch-manipulation",
                isActive
                  ? "bg-elevated border-border-default hover:border-primary/40 hover:shadow-xs"
                  : "bg-surface-subtle/40 border-dashed border-border-subtle opacity-65 hover:opacity-90"
              )}
            >
              {/* Checkbox toggle with enlarged touch area */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSource(source.id);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-primary transition-colors cursor-pointer touch-manipulation active:scale-90"
                title={isActive ? "Exclure de l'IA" : "Activer pour l'IA"}
                aria-label={isActive ? "Exclure de l'IA" : "Activer pour l'IA"}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm transition-all",
                    isActive
                      ? "bg-primary text-white shadow-2xs"
                      : "border border-border-strong hover:border-primary"
                  )}
                >
                  {isActive && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </button>

              {/* Source Icon + Details (Clickable to view modal) */}
              <div
                onClick={() => setSelectedSourceForViewer(source)}
                className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity"
                title={`Cliquer pour afficher : ${source.name}`}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                    meta.bg,
                    meta.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex flex-col min-w-0 pr-1">
                  <span className="truncate text-label-xs sm:text-label-sm font-medium text-text-primary max-w-[110px] xs:max-w-[140px] sm:max-w-[170px]">
                    {source.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="capitalize">{source.type}</span>
                    <span>•</span>
                    <span className={isActive ? "text-primary font-medium" : "text-text-muted"}>
                      {isActive ? t("sources.status.active") : t("sources.status.inactive")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions (View / Delete) */}
              <div className="flex items-center gap-0.5 pl-1 border-l border-border-subtle/60">
                <button
                  type="button"
                  onClick={() => setSelectedSourceForViewer(source)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-hover hover:text-text-primary transition-colors cursor-pointer touch-manipulation active:scale-90"
                  title={isYouTube ? t("sources.watchVideo") : t("sources.view")}
                  aria-label={isYouTube ? t("sources.watchVideo") : t("sources.view")}
                >
                  {isYouTube ? (
                    <Play className="h-3.5 w-3.5 fill-current text-[#FF0000]" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("sources.deleteConfirm"))) {
                      onDeleteSource(source.id);
                    }
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red transition-all cursor-pointer touch-manipulation active:scale-90"
                  title={t("sources.delete")}
                  aria-label={t("sources.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Viewer Modal */}
      <SourceViewerModal
        source={selectedSourceForViewer}
        open={!!selectedSourceForViewer}
        onOpenChange={(open) => {
          if (!open) setSelectedSourceForViewer(null);
        }}
        isActive={selectedSourceForViewer ? activeSourceIds.includes(selectedSourceForViewer.id) : true}
        onToggleActive={() => {
          if (selectedSourceForViewer) {
            onToggleSource(selectedSourceForViewer.id);
          }
        }}
        onDelete={() => {
          if (selectedSourceForViewer) {
            onDeleteSource(selectedSourceForViewer.id);
            setSelectedSourceForViewer(null);
          }
        }}
      />
    </div>
  );
}
