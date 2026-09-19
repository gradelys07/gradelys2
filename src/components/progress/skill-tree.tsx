"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SkillTreeProps {
  skills: { subject: string; mastery: number }[];
}

import { motion } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";

export function SkillTree({ skills }: SkillTreeProps) {
  if (skills.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center shadow-xl overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="h-[400px] w-[400px] rounded-full border border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl"
          />
        </div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 p-4 shadow-2xl backdrop-blur-md mb-6 border border-white/20"
        >
          <BrainCircuit className="h-10 w-10 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
        </motion.div>
        
        <h3 className="relative z-10 text-heading-sm font-bold text-white mb-2 drop-shadow-md">Graphe de Connaissances Vierge</h3>
        <p className="relative z-10 text-body-md text-slate-300 max-w-md mx-auto">
          Discutez avec l'IA, passez des quiz ou analysez des documents pour commencer à cartographier vos compétences.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-surface-elevated p-8 shadow-lg">
      {/* Background glowing effects */}
      <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
      
      <div className="min-w-[600px] flex flex-wrap items-center justify-center gap-10 py-8 relative">
        {/* Connecting line with gradient */}
        <div className="absolute left-10 right-10 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 z-0 rounded-full" />
        
        {skills.map((skill, i) => {
          const isMastered = skill.mastery >= 70;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              key={skill.subject} 
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-xl transition-all duration-300 group-hover:scale-110",
                  isMastered
                    ? "border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                    : "border-blue-400 bg-gradient-to-br from-blue-500/20 to-blue-400/5 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                )}
              >
                {/* Glowing inner ring */}
                <div className="absolute inset-2 rounded-full bg-white/5 backdrop-blur-sm" />
                
                <span className={cn("relative z-10 text-heading-sm font-black drop-shadow-sm", isMastered ? "text-emerald-500" : "text-blue-500")}>
                  {Math.round(skill.mastery)}%
                </span>
              </div>
              
              <div className="mt-4 rounded-full bg-surface-elevated/80 px-4 py-1.5 backdrop-blur-md border border-border shadow-sm">
                <span className="text-label-sm font-bold capitalize bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                  {skill.subject}
                </span>
              </div>
              
              {isMastered && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
