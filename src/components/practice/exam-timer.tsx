"use client";

import * as React from "react";
import { Play, Pause, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  onStop: (timeSeconds: number) => void;
}

export function ExamTimer({ onStop }: ExamTimerProps) {
  const [seconds, setSeconds] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-border-strong bg-elevated px-4 py-2 shadow-sm">
      <div className={cn("font-mono text-body-lg font-medium", isRunning ? "text-primary" : "text-text-secondary")}>
        {formatTime(seconds)}
      </div>
      <div className="flex items-center gap-1 border-l border-border pl-3">
        {!isRunning ? (
          <button
            onClick={() => setIsRunning(true)}
            className="rounded-full p-1.5 text-text-muted hover:bg-hover hover:text-text-primary"
            title="Start Timer"
          >
            <Play className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsRunning(false)}
            className="rounded-full p-1.5 text-text-muted hover:bg-hover hover:text-text-primary"
            title="Pause Timer"
          >
            <Pause className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => {
            setIsRunning(false);
            onStop(seconds);
          }}
          disabled={seconds === 0}
          className="rounded-full p-1.5 text-text-muted hover:bg-red/10 hover:text-red disabled:opacity-50"
          title="Stop Exam"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
