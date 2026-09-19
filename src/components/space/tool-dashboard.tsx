"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronRight, Paperclip, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";
import { useCreateConversation } from "@/hooks/use-chat";
import { useSpaces } from "@/hooks/use-spaces";
import { ToolKind, PRESETS, Preset } from "./tool-chat-thread";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

export function ToolDashboard({ kind, title, description, spaceId }: { kind: ToolKind; title: string; description: string; spaceId?: string | null }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const createConversation = useCreateConversation();
  const { data: spaces } = useSpaces();

  const activeSpaceId = useUIStore((s) => s.activeSpaceId);
  const setActiveSpaceId = useUIStore((s) => s.setActiveSpaceId);
  const [localSpaceId, setLocalSpaceId] = useState<string | null>(spaceId || activeSpaceId || null);

  function handleSpaceChange(id: string | null) {
    setLocalSpaceId(id);
    setActiveSpaceId(id);
  }
  const [attachOpen, setAttachOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);

  const presets = PRESETS[kind];
  const selectedSpace = spaces?.find((s: any) => s.id === localSpaceId);

  async function startChat(text: string, preset?: Preset) {
    if (useAuthStore.getState().user?.isAnonymous) {
      toast("Création de compte requise", { description: "Veuillez créer un compte pour commencer." });
      useAuthStore.getState().setShowAuthModal(true);
      return;
    }
    if (!text.trim() && !preset) return;
    
    if (!localSpaceId) {
      setAttachOpen(true);
      toast.error(t("tool.pickSpaceError") || "Pick a space first — this generates from its sources.");
      return;
    }

    setLoading(true);
    try {
      const res = await createConversation.mutateAsync({ title: (preset ? preset.title : text).slice(0, 48), spaceId: localSpaceId || undefined, kind });
      
      if (kind === "studio" && preset && preset.id === "slides") {
        sessionStorage.setItem("gradelys:presentation-prompt", preset.prompt);
        router.push(`/studio/presentation?conversationId=${res.conversation.id}&spaceId=${localSpaceId || ""}`);
        return;
      }
      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}:personalized`, String(isPersonalized));
      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, text || (preset ? preset.prompt : ""));
      router.push(`?c=${res.conversation.id}${localSpaceId ? `&spaceId=${localSpaceId}` : ""}`);
    } finally {
      setLoading(false);
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

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC]/80 px-6 py-12 sm:px-12"
      style={{ backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[150px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <motion.div variants={itemVariants} className="mt-28 text-center">
          <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-display-lg font-extrabold tracking-tight text-transparent drop-shadow-md">
            {title}
          </h1>
          <p className="mt-5 text-title-md font-medium text-text-secondary/80">
            {description}
          </p>
        </motion.div>

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
              placeholder={selectedSpace ? `Start creating with ${selectedSpace.name}...` : "What do you want to create?"}
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
                    className="absolute bottom-[calc(100%+12px)] left-4 w-72 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-2xl z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-label-sm font-semibold uppercase tracking-wider text-text-muted">{t("tool.space") || "Select Space"}</span>
                      <button type="button" onClick={() => setAttachOpen(false)} className="rounded-full p-1 text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {spaces?.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            handleSpaceChange(s.id);
                            setAttachOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm transition-all",
                            localSpaceId === s.id ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-black/5"
                          )}
                        >
                          <span className="text-base">{s.emoji}</span> 
                          <span className="truncate font-medium">{s.name}</span>
                          {localSpaceId === s.id && <Check className="ml-auto h-4 w-4" />}
                        </button>
                      ))}
                      {(!spaces || spaces.length === 0) && (
                        <p className="px-3 py-4 text-center text-label-md text-text-muted">{t("tool.noSpacesYet") || "No spaces available."}</p>
                      )}
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
                    <span className="text-label-sm font-medium">Attach Space</span>
                  )}
                </button>

                {(kind === "visualize" || kind === "studio") && (
                  <button 
                    type="button" 
                    onClick={() => setIsPersonalized(!isPersonalized)}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-full border px-4 transition-all duration-300",
                      isPersonalized ? "border-primary bg-[var(--primary-subtle)] text-primary shadow-sm" : "border-black/10 bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary"
                    )}
                    title={t("tool.personalizeTitle")}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="text-label-sm font-medium hidden sm:inline-block">{t("tool.personalizeShort")}</span>
                  </button>
                )}
              </div>
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
        </motion.form>

        <motion.div variants={itemVariants} className="mt-16 mb-6 flex items-center justify-between">
          <h2 className="text-heading-sm font-semibold text-text-primary">
            {t("tool.quickStarts") || "Quick Starts"}
          </h2>
          <div className="h-[1px] flex-1 ml-6 bg-gradient-to-r from-border-strong/50 to-transparent" />
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={preset.id}
              type="button"
              onClick={() => startChat(preset.prompt, preset)}
              className={cn(
                "group relative flex flex-col items-start gap-5 rounded-[2rem] border border-white/60 bg-white/40 p-7 text-left shadow-xl shadow-black/5 backdrop-blur-2xl transition-all duration-500 hover:border-primary/40 hover:bg-white/60 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden",
                preset.id === "auto" && kind === "visualize" && "sm:col-span-2 lg:col-span-3 lg:flex-row lg:items-center lg:p-10"
              )}
            >
              {/* Dynamic Gradient Background on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              
              {/* Top Section: Icon & Arrow */}
              <div className={cn("flex items-center justify-between z-10", preset.id === "auto" && kind === "visualize" ? "w-auto lg:shrink-0" : "w-full")}>
                <div className={cn(
                  "relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-white/50 text-primary shadow-sm ring-1 ring-black/5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-md group-hover:ring-primary/20 group-hover:from-white group-hover:to-primary/10",
                  preset.id === "auto" && kind === "visualize" ? "h-20 w-20" : "h-16 w-16"
                )}>
                  <preset.icon className={cn(
                    "drop-shadow-sm transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110",
                    preset.id === "auto" && kind === "visualize" ? "h-10 w-10" : "h-8 w-8"
                  )} />
                </div>
                {preset.id !== "auto" || kind !== "visualize" ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-text-muted shadow-sm ring-1 ring-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-hover:-translate-x-1">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                ) : null}
              </div>
              
              {/* Bottom Section: Text */}
              <div className={cn("relative z-10", preset.id === "auto" && kind === "visualize" ? "mt-0 flex-1 lg:ml-6" : "mt-2")}>
                <h3 className={cn("font-bold text-text-primary transition-colors duration-300 group-hover:text-primary", preset.id === "auto" && kind === "visualize" ? "text-heading-lg" : "text-heading-sm")}>
                  {preset.title}
                </h3>
                <p className={cn("mt-2 leading-relaxed text-text-secondary/90", preset.id === "auto" && kind === "visualize" ? "text-body-lg" : "text-body-md")}>
                  {preset.subtitle}
                </p>
              </div>

              {/* Arrow for horizontal card */}
              {preset.id === "auto" && kind === "visualize" && (
                <div className="hidden lg:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/60 text-text-muted shadow-sm ring-1 ring-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-hover:-translate-x-2">
                  <ChevronRight className="h-7 w-7" />
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
