"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronRight, Paperclip, X, Check, Brain, FileStack, History, Pin, PinOff, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { useSpaces } from "@/hooks/use-spaces";
import { ToolKind } from "./tool-chat-thread";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { StudioCapabilitiesModal, StudioCapability } from "./studio-capabilities-modal";
import { SpeakMessageButton, VoiceDictationButton } from "@/components/ui/voice-controls";

export function UnifiedDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const createConversation = useCreateConversation();
  const { data: spaces } = useSpaces();
  const { data: creations, isLoading: creationsLoading } = useConversations("all-tools");
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const [historyFilter, setHistoryFilter] = useState<"all" | "studio" | "visualize" | "practice">("all");

  const filteredCreations = useMemo(() => {
    const items = creations || [];
    if (historyFilter === "all") return items;
    return items.filter((item) => item.kind === historyFilter);
  }, [creations, historyFilter]);

  const activeSpaceId = useUIStore((s) => s.activeSpaceId);
  const setActiveSpaceId = useUIStore((s) => s.setActiveSpaceId);
  const setHistorySidebarOpen = useUIStore((s) => s.setHistorySidebarOpen);
  const [localSpaceId, setLocalSpaceId] = useState<string | null>(activeSpaceId || null);

  function handleSpaceChange(id: string | null) {
    setLocalSpaceId(id);
    setActiveSpaceId(id);
  }
  const [attachOpen, setAttachOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const selectedSpace = spaces?.find((s: any) => s.id === localSpaceId);

  async function startChat(text: string, forceKind?: ToolKind) {
    if (useAuthStore.getState().user?.isAnonymous) {
      toast(t("studio.toast.accountRequired"), { description: t("studio.toast.accountRequiredDesc") });
      useAuthStore.getState().setShowAuthModal(true);
      return;
    }
    if (!text.trim() && !forceKind) return;
    
    if (!localSpaceId) {
      setAttachOpen(true);
      toast.error(t("tool.pickSpaceError") || t("studio.toast.pickSpaceError"));
      return;
    }

    setLoading(true);
    // Add user message to local chat history for display
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");

    try {
      if (forceKind) {
        // Direct route override
        const res = await createConversation.mutateAsync({ title: text.slice(0, 48) || "Nouvelle session", spaceId: localSpaceId || undefined, kind: forceKind });
        if (text) sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, text);
        router.push(`/${forceKind}?c=${res.conversation.id}${localSpaceId ? `&spaceId=${localSpaceId}` : ""}`);
        return;
      }

      // Call Orchestrator
      const orchestratorRes = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, conversationHistory: messages })
      });
      
      const data = await orchestratorRes.json();

      if (data.action === "ask") {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
        setLoading(false);
        return; // Don't route, wait for user reply
      }

      // Action is "route"
      const targetKind = data.kind || "studio";
      const targetSubKind = data.subKind;
      const targetVisualType = data.visualType;
      const refinedPrompt = data.refinedPrompt || text;
      
      const res = await createConversation.mutateAsync({ title: refinedPrompt.slice(0, 48) || "Nouvelle session", spaceId: localSpaceId || undefined, kind: targetKind });
      
      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, refinedPrompt);
      
      if (targetSubKind || targetVisualType) {
         sessionStorage.setItem(`gradelys:pending-preset:${res.conversation.id}`, JSON.stringify({
           subKind: targetSubKind,
           visualType: targetVisualType
         }));
      }
      
      router.push(`/${targetKind}?c=${res.conversation.id}${localSpaceId ? `&spaceId=${localSpaceId}` : ""}`);
      
    } catch (e: any) {
      console.error(e);
      toast.error(t("studio.toast.aiError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDirectCreate(cap: StudioCapability) {
    if (useAuthStore.getState().user?.isAnonymous) {
      toast(t("studio.toast.accountRequired"), { description: t("studio.toast.accountRequiredDesc") });
      useAuthStore.getState().setShowAuthModal(true);
      return;
    }
    if (!localSpaceId) {
      setInput(cap.promptExample);
      setAttachOpen(true);
      toast.error(t("studio.toast.pickSpaceError"));
      return;
    }

    setLoading(true);
    try {
      const res = await createConversation.mutateAsync({
        title: cap.title.slice(0, 48),
        spaceId: localSpaceId || undefined,
        kind: cap.kind,
      });

      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, cap.promptExample);
      if (cap.subKind || cap.visualType) {
        sessionStorage.setItem(
          `gradelys:pending-preset:${res.conversation.id}`,
          JSON.stringify({
            subKind: cap.subKind,
            visualType: cap.visualType,
            difficulty: cap.difficulty,
          })
        );
      }

      if (cap.id === "slides") {
        sessionStorage.setItem("gradelys:presentation-prompt", cap.promptExample);
        router.push(`/studio/presentation?conversationId=${res.conversation.id}&spaceId=${localSpaceId || ""}`);
        return;
      }

      router.push(`/${cap.kind}?c=${res.conversation.id}${localSpaceId ? `&spaceId=${localSpaceId}` : ""}`);
    } catch (e: any) {
      console.error(e);
      toast.error(t("studio.toast.createError"));
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCapability(cap: StudioCapability, mode: "fill" | "direct") {
    if (mode === "direct" && localSpaceId) {
      setGuideOpen(false);
      handleDirectCreate(cap);
      return;
    }

    setInput(cap.promptExample);
    setGuideOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);

    if (!localSpaceId) {
      setAttachOpen(true);
      toast.info(t("studio.toast.formatSelected"), {
        description: t(`format.${cap.id}.title`),
      });
    } else {
      toast.success(t("studio.toast.promptInserted"), {
        description: t("studio.toast.pressEnter"),
      });
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const TOOLS = [
    {
      id: "visualize",
      kind: "visualize" as ToolKind,
      icon: Sparkles,
      title: t("studio.tools.visualize.title"),
      subtitle: t("studio.tools.visualize.desc"),
    },
    {
      id: "practice",
      kind: "practice" as ToolKind,
      icon: Brain,
      title: t("studio.tools.practice.title"),
      subtitle: t("studio.tools.practice.desc"),
    },
    {
      id: "studio",
      kind: "studio" as ToolKind,
      icon: FileStack,
      title: t("studio.tools.studio.title"),
      subtitle: t("studio.tools.studio.desc"),
    }
  ];

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC]/80 px-6 py-12 sm:px-12"
      style={{ backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-display-lg font-extrabold tracking-tight text-transparent drop-shadow-md">
            Studio
          </h1>
          <p className="mt-5 text-title-md font-medium text-text-secondary/80">
            {t("studio.subtitle")}
          </p>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-elevated px-3 py-1 text-label-xs text-text-secondary hover:border-primary/40 hover:text-text-primary hover:bg-hover transition-colors shadow-xs"
            >
              <span>{t("studio.whatCanICreate")}</span>
              <ChevronRight className="h-3 w-3 text-text-muted rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
        
        {messages.length > 0 && (
          <motion.div variants={itemVariants} className="mt-8 space-y-4 rounded-3xl bg-white/40 p-6 backdrop-blur-xl">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex w-full flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-5 py-3 text-body-md shadow-sm", msg.role === "user" ? "bg-primary text-white rounded-br-none rtl:rounded-br-2xl rtl:rounded-bl-none" : "bg-white text-text-primary rounded-bl-none rtl:rounded-bl-2xl rtl:rounded-br-none border border-black/5")}>
                  {msg.content}
                </div>
                <SpeakMessageButton text={msg.content} messageId={`orch-${idx}`} className="mt-1" />
              </div>
            ))}
          </motion.div>
        )}

        <motion.form
          variants={itemVariants}
          onSubmit={(e) => {
            e.preventDefault();
            startChat(input);
          }}
          className={cn(
            "relative mt-12 rounded-3xl border border-white/40 bg-white/60 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-500",
            isFocused ? "border-primary/50 bg-white/80 shadow-[0_8px_40px_rgba(14,165,233,0.15)] scale-[1.01]" : "hover:border-white/60 hover:bg-white/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          )}
        >
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  startChat(input);
                }
              }}
              placeholder={selectedSpace ? t("studio.inputPlaceholderSpace").replace("{name}", selectedSpace.name) : t("studio.inputPlaceholder")}
              rows={3}
              className="w-full resize-none bg-transparent px-6 py-4 text-body-lg text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
            
            <div className="flex items-center justify-between px-4 pb-2 mt-0 relative">
              <AnimatePresence>
                {attachOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-[calc(100%+12px)] left-4 rtl:left-auto rtl:right-4 w-72 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-2xl z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-label-sm font-semibold uppercase tracking-wider text-text-muted">{t("tool.space") || "Select Space"}</span>
                      <button type="button" onClick={() => setAttachOpen(false)} className="rounded-full p-1 text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1 rtl:pr-0 rtl:pl-1">
                      {spaces?.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            handleSpaceChange(s.id);
                            setAttachOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm text-left rtl:text-right transition-all",
                            localSpaceId === s.id ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-black/5"
                          )}
                        >
                          <span className="text-base">{s.emoji}</span> 
                          <span className="truncate font-medium">{s.name}</span>
                          {localSpaceId === s.id && <Check className="ml-auto rtl:ml-0 rtl:mr-auto h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setAttachOpen(!attachOpen)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-full border px-4 transition-all duration-300",
                    attachOpen ? "border-primary bg-primary text-white shadow-md" : "border-black/10 bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary"
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                  {selectedSpace ? (
                    <span className="text-label-sm font-medium line-clamp-1 max-w-[120px]">{selectedSpace.emoji} {selectedSpace.name}</span>
                  ) : (
                    <span className="text-label-sm font-medium">{t("studio.attachSpace")}</span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <VoiceDictationButton value={input} onChange={setInput} disabled={loading} variant="pill" />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={(!input.trim() && !loading)} 
                  loading={loading} 
                  className="h-12 w-12 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.form>

        <motion.div variants={itemVariants} className="mt-16 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-heading-sm font-semibold text-text-primary">
              {t("studio.orChooseTool")}
            </h2>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 text-label-xs text-text-muted hover:text-primary transition-colors"
            >
              <span>{t("studio.seeAllFormats")}</span>
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          </div>
          <div className="h-[1px] flex-1 ml-6 rtl:ml-0 rtl:mr-6 bg-gradient-to-r rtl:bg-gradient-to-l from-border-strong/50 to-transparent" />
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={tool.id}
              type="button"
              onClick={() => {
                if (!localSpaceId) {
                  setAttachOpen(true);
                  toast.error(t("tool.pickSpaceError") || "Pick a space first.");
                  return;
                }
                router.push(`/${tool.id}?spaceId=${localSpaceId}`);
              }}
              className="group relative flex flex-col items-start gap-5 rounded-[2rem] border border-white/60 bg-white/40 p-7 text-left rtl:text-right shadow-xl shadow-black/5 backdrop-blur-2xl transition-all duration-500 hover:border-primary/40 hover:bg-white/60 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              
              <div className="flex w-full items-center justify-between z-10">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-white/50 text-primary shadow-sm ring-1 ring-black/5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:ring-primary/20 group-hover:from-white group-hover:to-primary/10">
                  <tool.icon className="h-8 w-8 drop-shadow-sm transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" />
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-text-muted shadow-sm ring-1 ring-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1">
                  <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </div>
              </div>
              
              <div className="relative z-10 mt-2">
                <h3 className="text-heading-sm font-bold text-text-primary transition-colors duration-300 group-hover:text-primary">
                  {tool.title}
                </h3>
                <p className="mt-2 text-body-md leading-relaxed text-text-secondary/90">
                  {tool.subtitle}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Creations History Section */}
        <motion.div variants={itemVariants} className="mt-16 pb-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="h-4 w-4" />
              </div>
              <h2 className="text-heading-sm font-semibold text-text-primary">
                {t("studio.history")}
              </h2>
            </div>

            <div className="hidden h-[1px] flex-1 bg-gradient-to-r rtl:bg-gradient-to-l from-border-strong/50 to-transparent sm:mx-4 sm:block" />

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/60 bg-white/50 p-1 shadow-sm backdrop-blur-md">
                {(
                  [
                    { key: "all", label: t("studio.modal.tabAll") },
                    { key: "studio", label: t("studio.modal.tabDocuments") },
                    { key: "visualize", label: t("studio.modal.tabVisuals") },
                    { key: "practice", label: t("studio.modal.tabPractice") },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setHistoryFilter(tab.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      historyFilter === tab.key
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary hover:bg-white/80 hover:text-text-primary"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHistorySidebarOpen(true)}
                className="h-8 gap-1.5 rounded-xl border-white/60 bg-white/50 px-3 text-xs font-medium text-text-secondary backdrop-blur-md hover:bg-white/80 hover:text-text-primary"
              >
                <History className="h-3.5 w-3.5" />
                <span>{t("studio.history")}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </div>
          </div>

          {creationsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-36 animate-pulse rounded-2xl border border-white/60 bg-white/40 p-5 backdrop-blur-xl"
                />
              ))}
            </div>
          ) : filteredCreations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/40 px-6 py-10 text-center backdrop-blur-xl">
              <History className="h-7 w-7 text-text-muted/60" />
              <p className="text-sm font-medium text-text-secondary">
                {creations && creations.length > 0 ? t("common.noResults") : t("tool.noSessions")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCreations.map((s) => {
                const targetKind = s.kind || "studio";
                const sSpaceId = s.spaceId ?? (s as any).space_id;
                const itemSpace = spaces?.find((sp: any) => sp.id === sSpaceId);
                const dateIso =
                  (s as any).updated_at || s.updatedAt || (s as any).created_at || s.createdAt;
                const KindIcon =
                  targetKind === "visualize"
                    ? Sparkles
                    : targetKind === "practice"
                    ? Brain
                    : FileStack;
                const kindLabel =
                  targetKind === "visualize"
                    ? t("studio.tools.visualize.title")
                    : targetKind === "practice"
                    ? t("studio.tools.practice.title")
                    : t("studio.tools.studio.title");
                const kindBadgeClass =
                  targetKind === "visualize"
                    ? "bg-sky-500/10 text-sky-600"
                    : targetKind === "practice"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-purple-500/10 text-purple-600";
                const href = `/${targetKind}?c=${s.id}${sSpaceId ? `&spaceId=${sSpaceId}` : ""}`;

                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(href);
                      }
                    }}
                    className="group relative flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/50 p-5 text-left rtl:text-right shadow-md shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/75 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          kindBadgeClass
                        )}
                      >
                        <KindIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{kindLabel}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConversation.mutate({ id: s.id, pinned: !s.pinned });
                          }}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                            s.pinned
                              ? "bg-primary/15 text-primary opacity-100"
                              : "text-text-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 hover:bg-surface-hover hover:text-text-primary"
                          )}
                          aria-label={s.pinned ? "Unpin" : "Pin"}
                        >
                          {s.pinned ? (
                            <PinOff className="h-3.5 w-3.5" />
                          ) : (
                            <Pin className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation.mutate(s.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-all hover:bg-danger/10 hover:text-danger"
                          aria-label={t("action.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-semibold text-text-primary transition-colors group-hover:text-primary">
                      {s.title || t("chat.newConversation")}
                    </h3>

                    <div className="flex items-center justify-between gap-2 border-t border-border-subtle/50 pt-3 text-xs text-text-muted">
                      {itemSpace ? (
                        <span className="inline-flex max-w-[58%] items-center gap-1.5 truncate rounded-full bg-surface-subtle/80 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                          <span>{itemSpace.emoji || "📁"}</span>
                          <span className="truncate">{itemSpace.name}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-text-muted">
                        {dateIso ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{formatRelativeDate(dateIso)}</span>
                          </span>
                        ) : null}
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <StudioCapabilitiesModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onSelectCapability={handleSelectCapability}
        hasSelectedSpace={!!localSpaceId}
      />
    </div>
  );
}
