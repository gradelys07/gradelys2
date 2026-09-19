"use client";

import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusRewardsProps {
  focusCredits: number;
}

export function FocusRewards({ focusCredits }: FocusRewardsProps) {
  const rewards = [
    { id: "persona-socratic", title: "Socratic AI Persona", cost: 100, icon: "🦉", desc: "Tutor only gives hints." },
    { id: "persona-strict", title: "Strict AI Persona", cost: 150, icon: "⚔️", desc: "Intense review mode." },
    { id: "theme-minimal", title: "Zen Theme", cost: 300, icon: "🧘", desc: "Ultra-minimalist UI." },
    { id: "export-pdf", title: "PDF Exports", cost: 500, icon: "📄", desc: "Generate print-ready PDFs." },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-md text-text-primary">Focus Shop</h3>
          <p className="text-body-sm text-text-muted mt-1">Unlock utilities with deep focus sessions.</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow/10 text-yellow px-4 py-2 rounded-full font-bold">
          <span className="text-xl">⚡</span> {focusCredits} Focus Credits
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const isUnlocked = focusCredits >= reward.cost;
          return (
            <div key={reward.id} className={cn("relative p-4 rounded-lg border", isUnlocked ? "border-yellow bg-yellow/5" : "border-border bg-base opacity-75")}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{reward.icon}</div>
                  <div>
                    <div className="text-label-lg font-medium text-text-primary">{reward.title}</div>
                    <div className="text-body-xs text-text-muted mt-0.5">{reward.desc}</div>
                  </div>
                </div>
                {isUnlocked ? (
                  <Unlock className="w-4 h-4 text-yellow" />
                ) : (
                  <Lock className="w-4 h-4 text-text-muted" />
                )}
              </div>
              {!isUnlocked && (
                <div className="mt-3 flex items-center justify-between text-body-xs font-medium text-text-muted border-t border-border pt-2">
                  <span>Cost: {reward.cost} ⚡</span>
                  <span>{reward.cost - focusCredits} to go</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
