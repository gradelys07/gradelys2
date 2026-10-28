"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Youtube,
  FileText,
  Link2,
  Type,
  ImageIcon,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Search,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { SpaceSource, SourceType } from "@/types";

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function getSourceIcon(type: SourceType) {
  switch (type) {
    case "youtube":
      return { icon: Youtube, color: "text-[#FF0000]", bg: "bg-[#FF0000]/10" };
    case "pdf":
      return { icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10" };
    case "url":
      return { icon: Link2, color: "text-sky-500", bg: "bg-sky-500/10" };
    case "text":
      return { icon: Type, color: "text-amber-500", bg: "bg-amber-500/10" };
    case "image":
      return { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "spreadsheet":
      return { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-600/10" };
    default:
      return { icon: FileText, color: "text-primary", bg: "bg-primary/10" };
  }
}

interface SourceViewerModalProps {
  source: SpaceSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function SourceViewerModal({
  source,
  open,
  onOpenChange,
  isActive,
  onToggleActive,
  onDelete,
}: SourceViewerModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!source) return null;

  const rawContent = (source as any).content_preview || source.contentPreview || "";
  const isYouTube = source.type === "youtube";
  const youtubeId = isYouTube ? getYouTubeVideoId(source.url) : null;
  const meta = getSourceIcon(source.type);
  const Icon = meta.icon;

  const wordCount = rawContent ? rawContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = rawContent ? rawContent.length : 0;

  async function handleCopy() {
    if (!rawContent) return;
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      toast.success(t("sources.modal.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur de copie");
    }
  }

  const typeLabel = t(`sources.type.${source.type}`) || source.type.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="w-[95vw] sm:w-full max-w-3xl max-h-[86dvh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-base px-3.5 py-3 sm:px-6 sm:py-4 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1">
          <div className={cn("flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl", meta.bg, meta.color)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-heading-xs sm:text-heading-sm font-semibold text-text-primary max-w-[150px] xs:max-w-[220px] sm:max-w-md" title={source.name}>
              {source.name}
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-label-xs text-text-muted">
              <span className="font-medium text-text-secondary">{typeLabel}</span>
              <span>•</span>
              <button
                type="button"
                onClick={onToggleActive}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors cursor-pointer touch-manipulation active:scale-95",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-surface-subtle text-text-muted hover:text-text-primary"
                )}
                title="Cliquer pour activer/exclure de l'IA"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-primary" : "bg-text-muted")} />
                {isActive ? t("sources.status.active") : t("sources.status.inactive")}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-label-xs sm:text-label-sm text-text-secondary hover:bg-hover hover:text-text-primary transition-colors touch-manipulation active:scale-95"
              title={isYouTube ? t("sources.modal.watchOnYouTube") : "Visiter le lien"}
            >
              <span className="hidden sm:inline">{isYouTube ? t("sources.modal.watchOnYouTube") : "Visiter"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(t("sources.deleteConfirm"))) {
                  onDelete();
                  onOpenChange(false);
                }
              }}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red transition-colors touch-manipulation active:scale-95"
              title={t("sources.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain [-webkit-overflow-scrolling:touch]">
        {isYouTube && youtubeId ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Embedded 16:9 YouTube Player with playsinline=1 for iOS Safari */}
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-lg border border-border-subtle">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                title={source.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Transcript & AI Extracted Notes Section */}
            {rawContent ? (
              <div className="rounded-xl border border-border-subtle bg-surface-subtle p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3 border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-label-sm sm:text-label-md font-semibold text-text-primary">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span>{t("sources.modal.transcript")}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    className="text-label-xs sm:text-label-sm h-7 sm:h-8 touch-manipulation active:scale-95"
                  >
                    {copied ? t("sources.modal.copied") : t("sources.modal.copy")}
                  </Button>
                </div>
                <div className="max-h-52 sm:max-h-64 overflow-y-auto pr-1 sm:pr-2 text-body-xs sm:text-body-sm leading-relaxed text-text-secondary whitespace-pre-wrap select-text selection:bg-primary/20 overscroll-contain [-webkit-overflow-scrolling:touch]">
                  {rawContent}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Non-YouTube content viewer */
          <div className="space-y-3 sm:space-y-4">
            {/* Toolbar for text viewer */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 sm:px-4 sm:py-2.5">
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-label-xs text-text-muted flex-wrap">
                <span className="flex items-center gap-1 font-medium text-text-secondary">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  {t("sources.modal.content")}
                </span>
                <span>•</span>
                <span>
                  {wordCount.toLocaleString()} {t("sources.modal.words")}
                </span>
                <span className="hidden xs:inline">•</span>
                <span className="hidden xs:inline">
                  {charCount.toLocaleString()} {t("sources.modal.characters")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  className="text-label-xs sm:text-label-sm h-7 sm:h-8 touch-manipulation active:scale-95"
                >
                  {copied ? t("sources.modal.copied") : t("sources.modal.copy")}
                </Button>
              </div>
            </div>

            {/* Document Content Display */}
            {rawContent ? (
              <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-5 shadow-xs max-h-[400px] sm:max-h-[500px] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                <div className="text-body-sm sm:text-body-md leading-relaxed text-text-primary whitespace-pre-wrap font-sans select-text selection:bg-primary/20">
                  {rawContent}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 sm:p-12 text-center text-text-muted">
                <p className="text-body-sm">{t("sources.modal.noContent")}</p>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-label-sm sm:text-label-md font-medium text-primary hover:underline"
                  >
                    <span>Visiter le lien source</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
