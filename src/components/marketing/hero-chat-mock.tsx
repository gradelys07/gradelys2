"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { motion, useScroll, useTransform } from "framer-motion";
import { FileText, Brain, Bot, CheckCircle2, Send, Search, ScanLine, NotebookPen, TrendingUp, Settings, LogOut, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export function HeroChatMock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [startTyping, setStartTyping] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // 1. Zoom from a visible size to normal size quickly
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.6, 1]);
  
  // 2. Expand to dock perfectly to the screen
  const width = useTransform(scrollYProgress, [0, 0.2], ["75vw", "100vw"]);
  const minHeight = useTransform(scrollYProgress, [0, 0.2], ["60vh", "100vh"]); 
  const borderRadius = useTransform(scrollYProgress, [0, 0.2], ["32px", "0px"]);
  const borderWidth = useTransform(scrollYProgress, [0, 0.2], ["1px", "0px"]);

  // 3. Move badges outward (Parallax) after initial zoom
  const badgeRightX = useTransform(scrollYProgress, [0, 0.3], [0, 400]);
  const badgeLeftX = useTransform(scrollYProgress, [0, 0.3], [0, -400]);

  // Removed unstable state trigger for text animation

  if (!mounted) {
    return <div className="h-[400px] w-full max-w-4xl mx-auto mt-16 rounded-2xl bg-surface/50 animate-pulse" />;
  }

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.15,
      },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  };

  const floatingBadgeVars = {
    initial: { y: 0 },
    float: {
      y: [-5, 5, -5],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const ledContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
        delayChildren: 0.5
      }
    }
  };

  const ledChar = {
    hidden: { opacity: 0, textShadow: "0px 0px 0px rgba(168, 85, 247, 0)", color: "#9ca3af" },
    visible: { 
      opacity: 1,
      textShadow: ["0px 0px 8px rgba(99, 102, 241, 0.4)", "0px 0px 0px rgba(99, 102, 241, 0)"],
      color: ["#4f46e5", "#111827"],
      transition: { duration: 0.6 }
    }
  };

  const aiText = "Gradelys uses an advanced SM-2 spaced repetition algorithm combined with AI. It analyzes your memory decay curve in real-time, scheduling reviews exactly when you're about to forget them. The result? 80% less study time with maximum retention.";

  return (
    <div ref={containerRef} className="relative w-full h-[150vh]">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gray-50/30">
        <motion.div 
          style={{ scale }}
          className="relative flex w-full items-center justify-center perspective-[2000px]"
        >
          
          <motion.div style={{ width, minHeight }} className="relative flex flex-col">
            {/* Outer Glow */}
            <motion.div style={{ borderRadius }} className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-indigo-500/30 blur-2xl opacity-60 pointer-events-none" />

            {/* Main Glass Container */}
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="visible"
              style={{ borderRadius, borderWidth }}
              className="relative w-full h-full flex flex-col bg-surface/80 backdrop-blur-2xl border border-border/40 shadow-xl overflow-hidden"
            >
        {/* Window Controls */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-surface">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          <div className="flex items-center gap-2 bg-surface-subtle px-3 py-1 rounded-full border border-border-subtle">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium text-text-secondary">gradelys.com/chat</span>
          </div>
          <div className="w-16" /> {/* Spacer for balance */}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Dashboard Sidebar Mock */}
          <div className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-border/40 bg-surface/40 backdrop-blur-xl">
            <div className="flex h-14 items-center px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md overflow-hidden">
                  <img src="/favicon.png" alt="Gradelys" className="h-full w-full object-contain" />
                </div>
                <span className="text-sm font-bold text-text-primary">Gradelys</span>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="flex w-full items-center justify-between rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  <span>Search</span>
                </div>
                <kbd className="inline-flex h-4 items-center gap-1 rounded bg-surface-subtle px-1 font-mono text-[9px] font-medium text-text-secondary">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="px-3 mt-2">
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium bg-primary text-white shadow-sm hover:bg-primary-hover">
                <Plus className="h-4 w-4" /> New Chat
              </button>
            </div>

            <div className="flex-1 px-3 mt-6 space-y-1">
              <div className="text-[10px] uppercase text-text-muted font-semibold mb-2 px-2">Main</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-secondary text-[13px] hover:bg-hover hover:text-text-primary"><ScanLine className="w-4 h-4" /> Scan Exam</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-secondary text-[13px] hover:bg-hover hover:text-text-primary"><NotebookPen className="w-4 h-4" /> Notes</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-secondary text-[13px] hover:bg-hover hover:text-text-primary"><TrendingUp className="w-4 h-4" /> Progress</div>
              
              <div className="text-[10px] uppercase text-text-muted font-semibold mb-2 mt-6 px-2">Recent Chats</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-primary font-medium text-[13px] bg-[var(--primary-subtle)]">Study app differences...</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-secondary text-[13px] hover:bg-hover hover:text-text-primary">Cell biology terms</div>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-secondary text-[13px] hover:bg-hover hover:text-text-primary">Calculus derivatives</div>
            </div>

            <div className="p-3 border-t border-border/40">
              <div className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-hover">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <img src="https://i.pravatar.cc/100?img=11" alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[13px] font-medium text-text-primary">Marc D.</div>
                  <div className="truncate text-[10px] text-text-muted">Pro Plan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="flex-1 flex flex-col relative bg-surface">
            <div className="flex flex-col flex-1 p-6 sm:p-8 gap-6 overflow-y-auto">
              
              {/* User Message */}
              <motion.div variants={itemVars} className="flex justify-end">
                <div className="flex items-end gap-3 max-w-[85%] sm:max-w-[70%]">
                  <div className="relative p-4 rounded-2xl rounded-br-sm bg-surface-alt text-text-primary shadow-sm border border-border-subtle text-sm sm:text-[15px] leading-relaxed">
                    Tell me a fact about Gradelys. What makes it different from other study apps?
                  </div>
                </div>
              </motion.div>

              {/* AI Response */}
              <motion.div variants={itemVars} className="flex gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white shadow-md z-10 border border-white/20">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 max-w-[85%] sm:max-w-[75%]">
                  <div className="p-5 rounded-2xl rounded-tl-sm bg-[var(--primary-subtle)] border border-primary/20 text-text-primary text-sm sm:text-[15px] leading-relaxed shadow-sm font-medium min-h-[100px]">
                    <motion.div variants={ledContainer} initial="hidden" animate="visible">
                      {aiText.split("").map((char, index) => (
                        <motion.span key={index} variants={ledChar}>
                          {char}
                        </motion.span>
                      ))}
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-green-subtle)] hover:bg-green-100 border border-green-200 text-green-700 text-sm font-medium transition-colors"
                    >
                      <Brain className="w-4 h-4" /> Start Quiz (5 Qs)
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-subtle hover:bg-hover border border-border-subtle text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-500" /> Save to Flashcards
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Input Field */}
            <div className="p-4 border-t border-border/40 bg-surface/80 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border-subtle focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                <Sparkles className="w-5 h-5 text-primary/60" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything, or attach a PDF, image, or YouTube link..."
                  className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-muted outline-none"
                />
                <button 
                  className="p-1.5 rounded-lg bg-primary hover:bg-primary-hover transition-colors text-white disabled:opacity-50 disabled:hover:bg-primary"
                  disabled={!inputValue.trim()}
                  onClick={() => {
                    if (inputValue.trim()) {
                      setInputValue("");
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
      {/* Floating Badges */}
      <motion.div
        variants={floatingBadgeVars}
        initial="initial"
        animate="float"
        style={{ x: badgeRightX }}
        className="absolute right-[-2rem] md:right-[-4rem] top-20 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border-subtle shadow-xl z-20"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-green-subtle)]">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <span className="text-sm font-medium text-text-primary">Sources Cited</span>
      </motion.div>

      <motion.div
        variants={floatingBadgeVars}
        initial="initial"
        animate="float"
        style={{ animationDelay: "1s", x: badgeLeftX }}
        className="absolute left-[-2rem] md:left-[-4rem] bottom-32 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border-subtle shadow-xl z-20"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary-subtle)]">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-text-primary">SM-2 Activated</span>
      </motion.div>

    </motion.div>
      
        </motion.div>
      </div>
    </div>
  );
}
