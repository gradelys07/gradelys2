"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowUp, Paperclip, FileText, Calculator, Globe2, Folder, FileUp, Youtube, LayoutGrid, MessageSquare, Plus, Activity, Star, ClipboardList, GraduationCap, ChevronRight, MessageCircle, Check, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateConversation } from "@/hooks/use-chat";
import { useSpaces, useSources } from "@/hooks/use-spaces";
import { useTranslation } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";
import { useConversations } from "@/hooks/use-chat";
import { Switch } from "@/components/ui/switch";
import { useGamification } from "@/hooks/use-gamification";
import { usePracticeSessions } from "@/hooks/use-practice";
import { useFocusStore } from "@/stores/focus-store";

export default function ChatHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);
  const createConversation = useCreateConversation();
  const { data: spaces } = useSpaces();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const activeSpaceId = useUIStore((s) => s.activeSpaceId);
  const setActiveSpaceId = useUIStore((s) => s.setActiveSpaceId);
  const [spaceId, setSpaceId] = useState<string | null>(activeSpaceId);
  
  function handleSpaceChange(id: string | null) {
    setSpaceId(id);
    setActiveSpaceId(id);
  }
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const { t } = useTranslation();
  const setNewSpaceOpen = useUIStore((s) => s.setNewSpaceOpen);
  const startFocus = useFocusStore((s) => s.startFocus);
  const [isFocused, setIsFocused] = useState(false);

  const selectedSpace = spaces?.find((s) => s.id === spaceId);
  const { data: sources } = useSources(spaceId);
  const { data: conversations } = useConversations("chat");
  const recentConversations = conversations?.slice(0, 4) || [];
  const { data: gamification } = useGamification();
  const { data: practiceSessions } = usePracticeSessions();
  const currentStreak = gamification?.streak?.current_streak || 0;

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const suggestions = [
    { icon: FileText, title: t("chat.suggestion1.title"), desc: t("chat.suggestion1.desc"), color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Sparkles, title: t("chat.suggestion2.title"), desc: t("chat.suggestion2.desc"), color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: ClipboardList, title: t("chat.suggestion3.title"), desc: t("chat.suggestion3.desc"), color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: GraduationCap, title: t("chat.suggestion4.title"), desc: t("chat.suggestion4.desc"), color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  async function startChat(text: string) {
    if (!text.trim() || loading) return;
    
    if (user?.isAnonymous) {
      toast("Création de compte requise", { description: "Veuillez créer un compte pour commencer." });
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await createConversation.mutateAsync({ title: text.slice(0, 48), spaceId });
      sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, text);
      router.push(`/chat/${res.conversation.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
      setLoading(false);
    }
  }

  function handleAddSourceClick(type: string) {
    if (user?.isAnonymous) {
      toast("Création de compte requise", { description: "Veuillez créer un compte pour commencer." });
      setShowAuthModal(true);
      return;
    }
    
    if (spaceId) {
      router.push(`/spaces/${spaceId}?addSource=${type}`);
    } else {
      if (spaces && spaces.length > 0) {
        const id = spaces[0].id;
        handleSpaceChange(id);
        router.push(`/spaces/${id}?addSource=${type}`);
      } else {
        setNewSpaceOpen(true);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      toast.error(t("chat.moreThanThreeDocsToast"));
      return;
    }
    setAttachedFiles(files);
  }

  const firstName = user?.name?.split(" ")[0];

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
      className="flex h-full w-full overflow-hidden bg-[#F8FAFC]/80 relative"
      style={{ backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      {/* Dynamic Background Elements */}
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
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.3, 0.2], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[150px]"
        />
      </div>

      {/* LEFT COLUMN: Main Dashboard */}
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 relative z-10">
        {!isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/50 backdrop-blur-md text-text-muted hover:bg-white/80 hover:text-text-primary shadow-sm transition-all"
            title="Open side panel"
          >
            <PanelRightOpen className="h-4.5 w-4.5" />
          </button>
        )}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl"
        >
          {/* Top badge */}
          <motion.button 
            id="tour-streak"
            variants={itemVariants}
            onClick={() => router.push("/progress")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/40 px-4 py-1.5 text-label-sm font-medium text-text-secondary shadow-sm hover:bg-white/60 hover:shadow-md transition-all backdrop-blur-md"
          >
            <span className="text-orange-500 drop-shadow-sm">🔥</span> {currentStreak} {t("chat.studyStreak")} <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          </motion.button>

          <motion.div variants={itemVariants} className="mt-32 text-center">
            <h1 className="text-display-lg font-extrabold tracking-tight text-text-primary drop-shadow-md">
              What are we <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">studying</span> today?
            </h1>
            <p className="mt-5 text-title-md font-medium text-text-secondary/80">
              Ask anything, upload a source, or study from one of your spaces.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            id="tour-chat-input"
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
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-6 pt-4">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-base px-3 py-1.5 shadow-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="max-w-[120px] truncate text-label-sm text-text-primary">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, index) => index !== i))}
                        className="ml-1 rounded-full p-0.5 text-text-muted hover:bg-hover hover:text-text-primary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                placeholder={selectedSpace ? `Ask about ${selectedSpace.name}…` : "Ask Gradelys anything..."}
                rows={3}
                className="w-full resize-none bg-transparent px-6 py-4 text-body-lg text-text-primary placeholder:text-text-muted/60 focus:outline-none"
              />
              <div className="flex items-center justify-between px-4 pb-2 mt-2 relative">
                <div className="flex items-center gap-2">
                  <button 
                    id="tour-file-upload"
                    type="button" 
                    onClick={() => document.getElementById("hidden-file-input")?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-black/5 hover:bg-black/10 text-text-secondary hover:text-text-primary transition-all duration-300"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button 
                        id="tour-web-search"
                        type="button" 
                        className={cn(
                          "flex h-10 items-center gap-2 rounded-full border px-4 text-label-sm font-medium transition-all duration-300",
                          webSearchEnabled ? "border-primary bg-primary text-white shadow-md" : "border-black/5 bg-black/5 text-text-secondary hover:bg-black/10 hover:text-text-primary"
                        )}
                      >
                        <Globe2 className="h-4 w-4" /> 
                        Web + Documents 
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 p-4 rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-2xl" side="top" align="start">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-label-sm font-medium">{t("chat.webSearchLabel")}</span>
                          <span className="text-body-xs text-text-muted">{t("chat.allowInternetAccess")}</span>
                        </div>
                        <Switch checked={webSearchEnabled} onCheckedChange={setWebSearchEnabled} />
                      </div>
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-label-sm font-medium">{t("chat.documents")} ({attachedFiles.length}/3)</span>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full text-xs h-9 rounded-xl border-border bg-white hover:bg-hover" 
                          onClick={() => document.getElementById("hidden-file-input")?.click()}
                        >
                          <Plus className="h-4 w-4 mr-2" /> {t("chat.addFiles")}
                        </Button>
                        <p className="text-[10px] text-text-muted mt-2 text-center leading-tight">
                          {t("chat.moreThanThreeDocs")}
                        </p>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input id="hidden-file-input" type="file" multiple className="hidden" onChange={handleFileChange} />
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim()} 
                  loading={loading} 
                  className="h-12 w-12 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.form>

          {/* Suggestions Grid */}
          <motion.div variants={containerVariants} className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {suggestions.map((s) => (
              <motion.button
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                key={s.title}
                onClick={() => startChat(s.title)}
                className="group relative flex items-start gap-4 rounded-2xl border border-white/40 bg-white/50 p-6 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-white/70 hover:shadow-[0_8px_40px_rgba(14,165,233,0.12)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className={`relative mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/60 to-white/30 shadow-inner transition-transform duration-500 group-hover:scale-110 ${s.color}`}>
                  <s.icon className="h-6 w-6 drop-shadow-sm" />
                </div>
                
                <div className="relative flex-1">
                  <h3 className="text-body-lg font-semibold text-text-primary transition-colors group-hover:text-primary">{s.title}</h3>
                  <p className="mt-1.5 text-body-sm text-text-muted/80 leading-relaxed line-clamp-2">{s.desc}</p>
                </div>
                
                <div className="relative mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-primary/10">
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Bottom Actions */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => handleAddSourceClick("pdf")} className="flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-4 py-2 text-label-sm font-medium text-text-secondary backdrop-blur-md transition-all hover:bg-white/60 hover:text-text-primary hover:shadow-md">
              <FileUp className="h-4 w-4 text-blue-500" /> Upload PDF
            </button>
            <button onClick={() => handleAddSourceClick("youtube")} className="flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-4 py-2 text-label-sm font-medium text-text-secondary backdrop-blur-md transition-all hover:bg-white/60 hover:text-text-primary hover:shadow-md">
              <Youtube className="h-4 w-4 text-red-500" /> Add YouTube
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-4 py-2 text-label-sm font-medium text-text-secondary backdrop-blur-md transition-all hover:bg-white/60 hover:text-text-primary hover:shadow-md">
                  <Folder className="h-4 w-4 text-purple-500" />
                  {selectedSpace ? `Using ${selectedSpace.name}` : t("chat.generalDiscussion")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px] rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-2xl p-2">
                <DropdownMenuItem onClick={() => handleSpaceChange(null)} className="rounded-xl px-3 py-2 text-body-sm hover:bg-black/5">
                  <div className="flex w-full items-center justify-between">
                    <span>{t("chat.gradelysGeneral")}</span>
                    {!spaceId && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
                {spaces?.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => handleSpaceChange(s.id)} className="flex items-center justify-between rounded-xl px-3 py-2 text-body-sm hover:bg-black/5">
                    <div className="flex items-center">
                      <span className="mr-2 text-base">{s.emoji}</span> {s.name}
                    </div>
                    {spaceId === s.id && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setNewSpaceOpen(true)} className="rounded-xl px-3 py-2 text-body-sm text-primary hover:bg-primary/10">
                  <Plus className="h-4 w-4 mr-2" /> Create Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </motion.div>
      </div>

      {isRightPanelOpen && (
        <div 
          className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-slate-200/60 bg-slate-100/80 p-5 backdrop-blur-xl xl:flex z-10 relative shadow-inner"
          style={{ backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.12) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          
          {/* Recent Activity */}
          <div id="tour-recent-activity" className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-label-lg font-bold text-text-primary">Recent activity</h3>
              <button 
                onClick={() => setIsRightPanelOpen(false)}
                className="rounded-full p-1.5 text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors"
                title="Hide side panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentConversations.length > 0 ? (
                recentConversations.map((conv) => (
                  <div 
                    key={conv.id} 
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className="flex items-start gap-3 rounded-2xl border border-white/30 bg-white/40 p-3.5 transition-all hover:bg-white/60 hover:shadow-md cursor-pointer group"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/50 text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                      <MessageCircle className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-label-sm font-semibold text-text-primary truncate">{conv.title || t("chat.newConversation")}</h4>
                      </div>
                      <p className="mt-1 text-body-xs text-text-muted/80 truncate font-medium">{t("chat.openConversation")}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted/40 self-center group-hover:text-primary transition-colors" />
                  </div>
                ))
              ) : (
                <div className="text-center text-body-sm text-text-muted py-6 border border-dashed border-white/40 rounded-2xl bg-white/20">
                  {t("chat.noRecentActivity")}
                </div>
              )}
            </div>
          </div>

          {/* Active Space */}
          <div id="tour-active-space" className="mb-10">
            <h3 className="mb-5 text-label-lg font-bold text-text-primary">Active space</h3>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/40 p-4 cursor-pointer transition-all hover:bg-white/60 hover:shadow-md group">
                  {selectedSpace ? (
                    <>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/50 text-2xl shadow-sm">
                        {selectedSpace.emoji}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-label-md font-bold text-text-primary truncate">{selectedSpace.name}</h4>
                        <p className="mt-0.5 text-body-xs text-text-muted font-medium">
                          {sources?.length || 0} documents
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-body-xs font-semibold text-emerald-500">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div> Active
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />
                    </>
                  ) : (
                    <div className="flex w-full items-center justify-between">
                      <span className="text-label-md font-semibold text-primary">{t("chat.generalDiscussion")}</span>
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[260px] rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-2xl p-2">
                {spaces?.map((s: any) => (
                  <DropdownMenuItem key={s.id} onClick={() => handleSpaceChange(s.id)} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-black/5 cursor-pointer">
                    <div className="flex items-center truncate">
                      <span className="mr-2 text-base">{s.emoji}</span> <span className="truncate">{s.name}</span>
                    </div>
                    {spaceId === s.id && <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => handleSpaceChange(null)} className="rounded-xl px-3 py-2 hover:bg-black/5 cursor-pointer mt-1">
                  Clear selection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewSpaceOpen(true)} className="rounded-xl px-3 py-2 text-primary hover:bg-primary/10 cursor-pointer mt-1">
                  <Plus className="h-4 w-4 mr-2" /> Create Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Focus Timer Trigger */}
          <div className="mb-10">
            <button
              onClick={() => startFocus()}
              className="group relative flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-6 text-center transition-all hover:border-primary/40 hover:bg-white/60 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-label-lg font-bold text-text-primary">Focus Session</h3>
                <p className="mt-1 text-body-sm text-text-muted">Lancez un chrono pour vos révisions manuelles</p>
              </div>
            </button>
          </div>

          {/* Quick Stats */}
          <div id="tour-quick-stats">
            <h3 className="mb-5 text-label-lg font-bold text-text-primary">Statistiques d'Apprentissage</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/30 bg-white/40 p-4 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-3 shadow-inner">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-title-md font-black text-text-primary drop-shadow-sm">
                  {(() => {
                    if (!practiceSessions || practiceSessions.length === 0) return "0%";
                    const totalQ = practiceSessions.reduce((acc, s) => acc + (s.totalQuestions || 0), 0);
                    const totalC = practiceSessions.reduce((acc, s) => acc + (s.correctAnswers || 0), 0);
                    return totalQ > 0 ? `${Math.round((totalC / totalQ) * 100)}%` : "0%";
                  })()}
                </div>
                <div className="text-body-xs font-medium text-text-muted/80 mt-1">Taux de Rétention</div>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/40 p-4 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3 shadow-inner">
                  <Calculator className="h-5 w-5" />
                </div>
                <div className="text-title-md font-black text-text-primary drop-shadow-sm">
                  {(() => {
                    if (!practiceSessions || practiceSessions.length === 0) return "0h 0m";
                    const totalMins = practiceSessions.reduce((acc, s) => acc + Math.round((s.timeTakenSeconds || 0) / 60), 0);
                    const hours = Math.floor(totalMins / 60);
                    const mins = totalMins % 60;
                    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
                  })()}
                </div>
                <div className="text-body-xs font-medium text-text-muted/80 mt-1">Temps de Concentration</div>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/40 p-4 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 mb-3 shadow-inner">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="text-title-md font-black text-text-primary drop-shadow-sm">
                  {practiceSessions?.length || 0}
                </div>
                <div className="text-body-xs font-medium text-text-muted/80 mt-1">Sessions Complétées</div>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/40 p-4 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-3 shadow-inner">
                  <Star className="h-5 w-5" />
                </div>
                <div className="text-title-md font-black text-text-primary drop-shadow-sm">
                  {(() => {
                    if (!practiceSessions || practiceSessions.length === 0) return "0/20";
                    const totalScore = practiceSessions.reduce((acc, s) => acc + (s.score || 0), 0);
                    const avg = totalScore / practiceSessions.length;
                    // Assuming max score is 100 based on standard percentages, convert to /20
                    const outOf20 = (avg / 100) * 20;
                    return `${outOf20.toFixed(1)}/20`;
                  })()}
                </div>
                <div className="text-body-xs font-medium text-text-muted/80 mt-1">Moyenne Générale</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
