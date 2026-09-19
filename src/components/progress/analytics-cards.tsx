"use client";

import { Activity, Clock, Target, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsCardsProps {
  retentionIndex: number;
  averageResponseTime: number;
  totalFocusTime: number; // in minutes
}

export function AnalyticsCards({ retentionIndex, averageResponseTime, totalFocusTime }: AnalyticsCardsProps) {
  const isEmpty = retentionIndex === 0 && averageResponseTime === 0 && totalFocusTime === 0;

  if (isEmpty) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 text-center shadow-inner"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-md backdrop-blur-md mb-4">
          <Rocket className="h-8 w-8 text-blue-500 drop-shadow-md" />
        </div>
        <h3 className="text-heading-sm font-bold text-text-primary mb-2">Prêt à décoller ? 🚀</h3>
        <p className="text-body-md text-text-muted max-w-md mx-auto">
          Vos métriques de performance s'afficheront ici dès que vous aurez complété votre première session de révision (Quiz ou Flashcards).
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <motion.div whileHover={{ y: -5 }} className="rounded-2xl border border-white/20 bg-gradient-to-br from-surface to-surface-elevated p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-400/5 text-blue-500 shadow-inner">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="text-label-sm font-semibold text-text-muted">Taux de Rétention</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-display-sm font-black text-text-primary drop-shadow-sm">{Math.round(retentionIndex)}%</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-body-sm font-medium text-text-muted/80 relative z-10">
          {retentionIndex > 75 ? "Votre mémoire à long terme est optimale. 🔥" : "Votre rétention baisse, révisez quelques flashcards."}
        </p>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} className="rounded-2xl border border-white/20 bg-gradient-to-br from-surface to-surface-elevated p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/5 text-emerald-500 shadow-inner">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-label-sm font-semibold text-text-muted">Temps de Réflexion Moyen</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-display-sm font-black text-text-primary drop-shadow-sm">{averageResponseTime}s</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-body-sm font-medium text-text-muted/80 relative z-10">
          Vos réflexes deviennent plus rapides. ⚡
        </p>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} className="rounded-2xl border border-white/20 bg-gradient-to-br from-surface to-surface-elevated p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-400/5 text-purple-500 shadow-inner">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-label-sm font-semibold text-text-muted">Temps d'Étude Profonde</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-display-sm font-black text-text-primary drop-shadow-sm">{Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-body-sm font-medium text-text-muted/80 relative z-10">
          Temps actif passé à résoudre des problèmes. 🧠
        </p>
      </motion.div>
    </div>
  );
}
