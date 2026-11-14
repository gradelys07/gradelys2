"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowLeft,
  Maximize2,
  Minimize2,
  BarChart3,
  Image as ImageIcon,
  Youtube,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatCanvasStore, type ChatCanvasArtifact } from "@/stores/chat-canvas-store";
import { ChartRenderer } from "@/components/chart-renderer";
import { MermaidDiagram } from "@/components/mermaid-diagram";

const PANEL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ChatCanvasPanel({ conversationId }: { conversationId: string }) {
  const { isOpen, activeArtifactId, artifacts, openArtifact, setOpen } =
    useChatCanvasStore();

  const conversationArtifacts = React.useMemo(
    () => artifacts.filter((a) => !a.conversationId || a.conversationId === conversationId),
    [artifacts, conversationId]
  );

  const activeArtifact: ChatCanvasArtifact | undefined = React.useMemo(() => {
    if (conversationArtifacts.length === 0) return undefined;
    return (
      conversationArtifacts.find((a) => a.id === activeArtifactId) ||
      conversationArtifacts[conversationArtifacts.length - 1]
    );
  }, [conversationArtifacts, activeArtifactId]);

  const [expanded, setExpanded] = React.useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setActiveVideoIndex(0);
  }, [activeArtifact?.id]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  function getTypeMeta(type: ChatCanvasArtifact["type"]) {
    switch (type) {
      case "python":
      case "chart":
        return { label: "Chart", Icon: BarChart3 };
      case "mermaid":
        return { label: "Schéma", Icon: GitBranch };
      case "images":
        return { label: "Photos", Icon: ImageIcon };
      case "youtube":
        return { label: "YouTube", Icon: Youtube };
    }
  }

  const renderInner = (artifact: ChatCanvasArtifact) => {
    const activeMeta = getTypeMeta(artifact.type);
    const ActiveIcon = activeMeta.Icon;

    return (
      <>
        {/* Panel Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 sm:px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:pt-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => setOpen(false)}
              className="lg:hidden inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-base px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-hover transition-colors"
              aria-label="Retour au chat"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>Retour</span>
            </motion.button>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <ActiveIcon className="h-3.5 w-3.5" />
              {activeMeta.label}
            </span>
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {artifact.title}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="hidden lg:inline-flex rounded-md p-1.5 text-text-muted hover:bg-hover hover:text-text-primary transition-colors"
              title={expanded ? "Réduire" : "Agrandir"}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border/70 lg:border-0 bg-base/80 lg:bg-transparent p-1.5 text-text-primary lg:text-text-muted hover:bg-hover hover:text-text-primary transition-colors"
              title="Fermer le panneau"
              aria-label="Fermer le panneau"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Artifact Tabs if multiple exist in this chat */}
        {conversationArtifacts.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface/60 px-3 py-2 shrink-0">
            {conversationArtifacts.map((art) => {
              const meta = getTypeMeta(art.type);
              const TabIcon = meta.Icon;
              const selected = art.id === artifact.id;
              return (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  key={art.id}
                  type="button"
                  onClick={() => openArtifact(art.id)}
                  className={cn(
                    "inline-flex max-w-[180px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    selected
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border bg-base text-text-secondary hover:bg-hover hover:text-text-primary"
                  )}
                >
                  <TabIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{art.title}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: PANEL_EASE }}
              className="space-y-4"
            >
              {(artifact.type === "chart" || artifact.type === "python") && artifact.chartData && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border-subtle bg-white p-3 sm:p-4 shadow-sm">
                    <ChartRenderer data={artifact.chartData} height={isMobile ? 280 : 360} />
                  </div>

                  {Array.isArray(artifact.chartData.data) &&
                    artifact.chartData.data.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface">
                        <table className="w-full text-left rtl:text-right text-xs">
                          <thead className="border-b border-border-subtle bg-base text-text-muted">
                            <tr>
                              {Object.keys(artifact.chartData.data[0]).map((col) => (
                                <th key={col} className="px-3 py-2 font-semibold">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {artifact.chartData.data.map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="border-b border-border-subtle/50 last:border-0">
                                {Object.keys(artifact.chartData.data[0]).map((col) => (
                                  <td key={col} className="px-3 py-2 text-text-primary">
                                    {String(row[col] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              {artifact.type === "mermaid" && artifact.code && (
                <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
                  <MermaidDiagram code={artifact.code} id={`canvas-${artifact.id}`} />
                </div>
              )}

              {artifact.type === "images" && artifact.mediaItems && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {artifact.mediaItems.map((item, idx) => (
                    <motion.div
                      key={`${item.url}-${idx}`}
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.24, delay: Math.min(idx * 0.05, 0.25), ease: PANEL_EASE }}
                      className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.caption || item.title || "Illustration"}
                        referrerPolicy="no-referrer"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                      {(item.caption || item.source) && (
                        <div className="p-2.5 text-left rtl:text-right">
                          {item.caption && (
                            <p className="text-xs font-medium text-text-primary">{item.caption}</p>
                          )}
                          {item.source && (
                            <div className="mt-1 flex items-center justify-between text-[11px] text-text-muted">
                              <span className="truncate">{item.source}</span>
                              {item.pageUrl && (
                                <a
                                  href={item.pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                                >
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {artifact.type === "youtube" && artifact.youtubeVideos && (
                <div className="space-y-3">
                  {artifact.youtubeVideos[activeVideoIndex] && (
                    <motion.div
                      key={artifact.youtubeVideos[activeVideoIndex].videoId}
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.22, ease: PANEL_EASE }}
                      className="space-y-3"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${artifact.youtubeVideos[activeVideoIndex].videoId}?rel=0`}
                          title={artifact.youtubeVideos[activeVideoIndex].title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full border-0"
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">
                            {artifact.youtubeVideos[activeVideoIndex].title}
                          </h3>
                          {artifact.youtubeVideos[activeVideoIndex].channel && (
                            <p className="text-xs text-text-muted">
                              {artifact.youtubeVideos[activeVideoIndex].channel}
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://www.youtube.com/watch?v=${artifact.youtubeVideos[activeVideoIndex].videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary hover:text-primary"
                        >
                          YouTube <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </motion.div>
                  )}

                  {artifact.youtubeVideos.length > 1 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-xs font-semibold text-text-muted">Vidéos associées</div>
                      {artifact.youtubeVideos.map((v, idx) => (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={v.videoId}
                          type="button"
                          onClick={() => setActiveVideoIndex(idx)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left rtl:text-right text-xs transition-colors",
                            idx === activeVideoIndex
                              ? "border-primary bg-primary/10 font-medium text-primary"
                              : "border-border bg-surface text-text-secondary hover:bg-hover"
                          )}
                        >
                          <span className="truncate">{v.title}</span>
                          {v.duration && <span className="shrink-0 text-[11px] text-text-muted">{v.duration}</span>}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Exit Bar (always reachable with thumb) */}
        <div className="lg:hidden shrink-0 border-t border-border-subtle bg-surface px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>Revenir au chat</span>
          </motion.button>
        </div>
      </>
    );
  };

  if (isMobile) {
    if (!mounted) return null;
    return createPortal(
      <AnimatePresence>
        {isOpen && activeArtifact && (
          <motion.aside
            key="chat-canvas-mobile"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.28, ease: PANEL_EASE }}
            className="fixed inset-0 z-50 flex flex-col bg-base shadow-2xl"
          >
            {renderInner(activeArtifact)}
          </motion.aside>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <AnimatePresence>
      {isOpen && activeArtifact && (
        <motion.aside
          key="chat-canvas-desktop"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.24, ease: PANEL_EASE }}
          className={cn(
            "hidden lg:flex flex-col border-l rtl:border-l-0 rtl:border-r border-border-subtle bg-base transition-[width] duration-200",
            expanded ? "lg:w-[58%]" : "lg:w-[460px] xl:w-[540px]"
          )}
        >
          {renderInner(activeArtifact)}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
