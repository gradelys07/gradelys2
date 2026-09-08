"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowUp, Paperclip, Sparkles, FileText, Calculator, Globe2, FolderKanban, FileUp, Youtube, LayoutGrid, MessageSquare, Plus, Activity, Star, ClipboardList, GraduationCap, ChevronRight, MessageCircle, Check, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateConversation } from "@/hooks/use-chat";
import { useSpaces, useSources } from "@/hooks/use-spaces";
import { useTranslation } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";
import { useConversations } from "@/hooks/use-chat";
import { Switch } from "@/components/ui/switch";
import { useGamification } from "@/hooks/use-gamification";





export default function ChatHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createConversation = useCreateConversation();
  const { data: spaces } = useSpaces();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const { t } = useTranslation();
  const setNewSpaceOpen = useUIStore((s) => s.setNewSpaceOpen);

  const selectedSpace = spaces?.find((s) => s.id === spaceId);
  const { data: sources } = useSources(spaceId);
  const { data: conversations } = useConversations("chat");
  const recentConversations = conversations?.slice(0, 4) || [];
  const { data: gamification } = useGamification();
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
    setLoading(true);
    const res = await createConversation.mutateAsync({ title: text.slice(0, 48), spaceId });
    sessionStorage.setItem(`gradelys:pending-message:${res.conversation.id}`, text);
    router.push(`/chat/${res.conversation.id}`);
  }

  function handleAddSourceClick(type: string) {
    if (spaceId) {
      router.push(`/spaces/${spaceId}?addSource=${type}`);
    } else {
      if (spaces && spaces.length > 0) {
        const id = spaces[0].id;
        setSpaceId(id);
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-base relative">
      {/* LEFT COLUMN: Main Dashboard */}
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 relative">
        {!isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:bg-hover hover:text-text-primary shadow-sm"
            title="Open side panel"
          >
            <PanelRightOpen className="h-4.5 w-4.5" />
          </button>
        )}
        <div className="mx-auto max-w-3xl">
          {/* Top badge */}
          <button 
            onClick={() => router.push("/progress")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-label-sm font-medium text-text-secondary shadow-sm hover:bg-hover transition-colors"
          >
            <span className="text-orange-500">🔥</span> {currentStreak} {t("chat.studyStreak")} <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          </button>

          <div className="mt-12 text-center">
            {/* Graphic / Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle shadow-inner mb-6 relative">
              <Sparkles className="h-8 w-8 text-primary" />
              <div className="absolute -top-2 -right-2 h-4 w-4 text-purple-400"><Sparkles className="h-full w-full" /></div>
              <div className="absolute -bottom-1 -left-2 h-3 w-3 text-blue-400"><Sparkles className="h-full w-full" /></div>
            </div>

            <h1 className="text-display-md text-text-primary">
              What are we studying today?
            </h1>
            <p className="mt-2 text-body-lg text-text-secondary">
              Ask anything, upload a source, or study from one of your spaces.
            </p>
          </div>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startChat(input);
            }}
            className="relative mt-8 rounded-2xl border-2 border-primary/20 bg-surface shadow-glow focus-within:border-primary transition-all p-2"
          >
            <div className="flex flex-col">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    startChat(input);
                  }
                }}
                placeholder={selectedSpace ? `Ask about ${selectedSpace.name}…` : "Ask Gradelys anything..."}
                rows={2}
                className="w-full resize-none bg-transparent px-4 py-3 text-body-lg text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <div className="flex items-center justify-between px-2 pb-1 mt-2">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleAddSourceClick('pdf')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-hover text-text-secondary transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button 
                        type="button" 
                        className="flex h-9 items-center gap-2 rounded-full border border-border hover:bg-hover text-text-secondary px-3 text-body-sm font-medium transition-colors"
                      >
                        <Globe2 className={`h-4 w-4 ${webSearchEnabled ? 'text-primary' : ''}`} /> 
                        Web + Documents 
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 p-4" side="top" align="start">
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
                          className="w-full text-xs h-8" 
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
                <Button type="submit" size="icon" disabled={!input.trim()} loading={loading} className="rounded-full h-10 w-10">
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Suggestions Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {suggestions.map((s) => (
              <button
                key={s.title}
                onClick={() => startChat(s.title)}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-surface px-5 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm group"
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-label-md text-text-primary font-medium group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="mt-1 text-body-sm text-text-muted line-clamp-2">{s.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted/50 group-hover:text-primary mt-2 transition-colors" />
              </button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => handleAddSourceClick("pdf")} className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-label-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary">
              <FileUp className="h-4 w-4 text-blue-500" /> Upload PDF
            </button>
            <button onClick={() => handleAddSourceClick("youtube")} className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-label-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary">
              <Youtube className="h-4 w-4 text-red-500" /> Add YouTube
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-label-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary">
                  <FolderKanban className="h-4 w-4 text-purple-500" />
                  {selectedSpace ? `Using ${selectedSpace.name}` : t("chat.generalDiscussion")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSpaceId(null)}>{t("chat.noSpace")}</DropdownMenuItem>
                {spaces?.map((s: any) => (
                  <DropdownMenuItem key={s.id} onClick={() => setSpaceId(s.id)} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {s.emoji} <span className="ml-2">{s.name}</span>
                    </div>
                    {spaceId === s.id && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setNewSpaceOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar (Desktop only) */}
      {isRightPanelOpen && (
        <div className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border/50 bg-surface/30 p-6 xl:flex">
          
          {/* Recent Activity */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-label-lg font-semibold text-text-primary">Recent activity</h3>
              <button 
                onClick={() => setIsRightPanelOpen(false)}
                className="rounded p-1.5 text-text-muted hover:bg-hover hover:text-text-primary"
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
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong cursor-pointer group"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-label-sm font-medium text-text-primary truncate">{conv.title || t("chat.newConversation")}</h4>
                    </div>
                    <p className="mt-0.5 text-body-xs text-text-muted truncate">{t("chat.openConversation")}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 self-center group-hover:text-primary transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center text-body-sm text-text-muted py-4 border border-dashed border-border rounded-xl bg-surface/50">
                {t("chat.noRecentActivity")}
              </div>
            )}
          </div>
        </div>

        {/* Active Space */}
        <div className="mb-8">
          <h3 className="mb-4 text-label-lg font-semibold text-text-primary">Active space</h3>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 cursor-pointer transition-colors hover:border-border-strong group">
                {selectedSpace ? (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl">
                      {selectedSpace.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-label-md font-medium text-text-primary truncate">{selectedSpace.name}</h4>
                      <p className="mt-0.5 text-body-xs text-text-muted">
                        {sources?.length || 0} documents
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-body-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Active
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-primary" />
                  </>
                ) : (
                  <div className="flex w-full items-center justify-between">
                    <span className="text-label-md font-medium text-primary">{t("chat.generalDiscussion")}</span>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[260px]">
              {spaces?.map((s: any) => (
                <DropdownMenuItem key={s.id} onClick={() => setSpaceId(s.id)}>
                  {s.emoji} {s.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setSpaceId(null)}>
                Clear selection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNewSpaceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="mb-4 text-label-lg font-semibold text-text-primary">{t("chat.quickStats")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-2">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="text-title-sm font-bold text-text-primary">{gamification?.counters?.messagesSent || 0}</div>
              <div className="text-body-xs text-text-muted mt-0.5">{t("chat.messagesSent")}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 mb-2">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-title-sm font-bold text-text-primary">{gamification?.counters?.documentsCreated || 0}</div>
              <div className="text-body-xs text-text-muted mt-0.5">{t("chat.documentsWritten")}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mb-2">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="text-title-sm font-bold text-text-primary">{gamification?.counters?.quizzesCompleted || 0}</div>
              <div className="text-body-xs text-text-muted mt-0.5">{t("chat.quizzesCompleted")}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 mb-2">
                <Star className="h-4 w-4" />
              </div>
              <div className="text-title-sm font-bold text-text-primary">{gamification?.counters?.notesCreated || 0}</div>
              <div className="text-body-xs text-text-muted mt-0.5">{t("chat.notesCreated")}</div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
