"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Timer, GripHorizontal, Maximize2, Minimize2, X } from "lucide-react";
import { useSaveSession } from "@/hooks/use-practice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFocusStore } from "@/stores/focus-store";
import { useTranslation } from "@/i18n/locale-provider";

export function GlobalFocusTimer() {
  const { isActive, seconds, isMinimized, startFocus, pauseFocus, stopFocus, resetFocus, tick, setMinimized } = useFocusStore();
  const saveSession = useSaveSession();
  const constraintsRef = useRef(null);
  const { t } = useTranslation();

  // Interval manager
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  const endSession = async () => {
    stopFocus();
    if (seconds < 60) {
      toast.info(t("timer.sessionTooShort"));
      resetFocus();
      return;
    }

    try {
      await saveSession.mutateAsync({
        mode: "focus" as any,
        subject: "Session de Concentration",
        score: 100,
        totalQuestions: 0,
        correctAnswers: 0,
        timeTakenSeconds: seconds,
        spaceId: null as any,
      });
      toast.success(`${t("timer.sessionSaved")} (+${Math.round(seconds / 60)} min)`);
      resetFocus();
    } catch (e: any) {
      toast.error(e.message || "Failed to save session");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If completely inactive and not running, don't show the widget unless we want it to be a permanent dock.
  // The user said "ajouter un petit bouton que quand tu l'allume il va afficher...". 
  // So if seconds === 0 and !isActive, we hide the widget. It gets triggered by the Dashboard button.
  if (seconds === 0 && !isActive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" ref={constraintsRef}>
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className={cn(
          "pointer-events-auto absolute bottom-6 right-6 flex flex-col overflow-hidden rounded-2xl border bg-elevated shadow-2xl backdrop-blur-xl transition-all duration-300",
          isMinimized ? "w-32 border-primary/30" : "w-72 border-primary/20",
          isActive ? "shadow-primary/20" : "shadow-black/5"
        )}
      >
        {/* Drag Handle & Header */}
        <div className="flex cursor-grab items-center justify-between border-b border-border-subtle bg-surface/50 px-3 py-2 active:cursor-grabbing">
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-text-muted" />
            {!isMinimized && <span className="text-label-sm font-bold text-text-secondary">Focus Timer</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(!isMinimized)} className="rounded p-1 text-text-muted hover:bg-white/10 hover:text-text-primary">
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </button>
            {!isActive && seconds > 0 && !isMinimized && (
              <button onClick={resetFocus} className="rounded p-1 text-red hover:bg-red/10">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={cn("flex flex-col items-center justify-center p-4", isMinimized && "p-3")}>
          <motion.div
            animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: isActive ? Infinity : 0, duration: 2, ease: "easeInOut" }}
            className={cn(
              "font-black tracking-tighter tabular-nums text-text-primary drop-shadow-sm",
              isMinimized ? "text-2xl" : "my-4 text-5xl"
            )}
          >
            {formatTime(seconds)}
          </motion.div>

          {!isMinimized && (
            <div className="flex w-full items-center justify-center gap-3">
              <button
                onClick={isActive ? pauseFocus : startFocus}
                className={cn(
                  "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-label-sm font-bold shadow-sm transition-all hover:-translate-y-0.5",
                  isActive
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-primary text-white hover:bg-primary-hover hover:shadow-primary/30"
                )}
              >
                {isActive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              
              <AnimatePresence>
                {seconds > 0 && (
                  <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    onClick={endSession}
                    className="flex h-10 items-center justify-center rounded-lg bg-red/10 px-4 text-red transition-all hover:bg-red/20"
                    title={t("timer.endAndSave")}
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
