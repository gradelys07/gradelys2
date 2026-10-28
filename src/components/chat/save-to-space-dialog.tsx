"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpaces } from "@/hooks/use-spaces";
import { apiFetch } from "@/lib/api-fetch";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FolderPlus, Folder, Sparkles, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/locale-provider";

const PRESET_EMOJIS = ["📚", "📐", "🔬", "🌍", "💻", "📊", "📖", "🧠", "💡", "⚡"];
const PRESET_COLORS = [
  { id: "#6366F1", label: "Indigo" },
  { id: "#3B82F6", label: "Bleu" },
  { id: "#10B981", label: "Émeraude" },
  { id: "#EC4899", label: "Rose" },
  { id: "#F59E0B", label: "Ambre" },
  { id: "#8B5CF6", label: "Violet" },
];

export function SaveToSpaceDialog({
  open,
  onOpenChange,
  conversationId,
  defaultTitle,
  currentSpaceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  defaultTitle?: string;
  currentSpaceId?: string | null;
  onSaved?: (spaceId: string) => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { data: spaces, isLoading: loadingSpaces } = useSpaces();

  const [mode, setMode] = React.useState<"new" | "existing">("new");
  const [name, setName] = React.useState(defaultTitle || t("chat.saveDialog.defaultSpaceName"));
  const [emoji, setEmoji] = React.useState("📚");
  const [color, setColor] = React.useState("#6366F1");
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string>(currentSpaceId || "");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (defaultTitle) {
      setName(defaultTitle);
    } else {
      setName(t("chat.saveDialog.defaultSpaceName"));
    }
  }, [defaultTitle, t]);

  React.useEffect(() => {
    if (currentSpaceId) {
      setSelectedSpaceId(currentSpaceId);
    } else if (spaces && spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [currentSpaceId, spaces]);

  async function handleSave() {
    if (!conversationId || submitting) return;

    if (mode === "new" && !name.trim()) {
      toast.error(t("chat.saveDialog.nameRequired"));
      return;
    }
    if (mode === "existing" && !selectedSpaceId) {
      toast.error(t("chat.saveDialog.spaceRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = { conversationId };
      if (mode === "new") {
        payload.newSpace = { name: name.trim(), emoji, color };
      } else {
        payload.spaceId = selectedSpaceId;
      }

      const res = await apiFetch<{
        success: boolean;
        spaceId: string;
        space: { id: string; name: string; emoji: string };
      }>("/api/chat/save-to-space", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      qc.invalidateQueries({ queryKey: ["spaces"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["sources", res.spaceId] });

      toast.success(
        t("chat.saveDialog.savedInSpace").replace("{name}", res.space?.name || t("chat.saveDialog.defaultSpaceFallback")),
        {
          description: t("chat.saveDialog.savedDesc"),
          action: {
            label: t("chat.saveDialog.openSpace"),
            onClick: () => router.push(`/spaces/${res.spaceId}`),
          },
        }
      );

      if (onSaved) onSaved(res.spaceId);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t("chat.saveDialog.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-heading-md font-semibold text-text-primary">
              {t("chat.saveDialog.title")}
            </h2>
            <p className="text-body-sm text-text-muted">
              {t("chat.saveDialog.desc")}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-5 grid grid-cols-2 rounded-lg border border-border-subtle bg-surface-subtle p-1">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "rounded-md py-1.5 text-body-sm font-medium transition-colors",
              mode === "new"
                ? "bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {t("chat.saveDialog.tabNew")}
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={cn(
              "rounded-md py-1.5 text-body-sm font-medium transition-colors",
              mode === "existing"
                ? "bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {t("chat.saveDialog.tabExisting")}
          </button>
        </div>

        {mode === "new" ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-label-md font-medium text-text-secondary">
                {t("chat.saveDialog.nameLabel")}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("chat.saveDialog.namePlaceholder")}
                className="mt-1.5"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-label-md font-medium text-text-secondary">
                {t("chat.saveDialog.emojiLabel")}
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {PRESET_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border text-body-lg transition-all",
                      emoji === e
                        ? "border-primary bg-primary/10 shadow-sm scale-110"
                        : "border-border bg-surface hover:bg-hover"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-label-md font-medium text-text-secondary">
                {t("chat.saveDialog.colorTheme")}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    style={{ backgroundColor: c.id }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-transform",
                      color === c.id ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                    )}
                  >
                    {color === c.id && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <label className="block text-label-md font-medium text-text-secondary mb-2">
              {t("chat.saveDialog.selectDest")}
            </label>
            {loadingSpaces ? (
              <div className="py-6 text-center text-body-sm text-text-muted">
                {t("chat.saveDialog.loadingSpaces")}
              </div>
            ) : !spaces || spaces.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-body-sm text-text-muted">{t("chat.saveDialog.noExisting")}</p>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className="mt-2 text-label-md font-medium text-primary hover:underline"
                >
                  {t("chat.saveDialog.createNewSpaceCta")}
                </button>
              </div>
            ) : (
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {spaces.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSpaceId(s.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
                      selectedSpaceId === s.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-surface hover:bg-hover"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-heading-sm">{s.emoji || "📚"}</span>
                      <span className="truncate text-body-sm font-medium text-text-primary">
                        {s.name}
                      </span>
                    </div>
                    {selectedSpaceId === s.id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border-subtle pt-4">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("chat.saveDialog.cancel")}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSave}
            loading={submitting}
            icon={<Sparkles className="h-4 w-4" />}
          >
            {mode === "new" ? t("chat.saveDialog.submitNew") : t("chat.saveDialog.submitExisting")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
