"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageSquare, ArrowRight, CheckCircle2, ScanLine, FileText, Brain, Network, ChevronRight, Folder } from "lucide-react";

export function FeaturesBentoDynamic() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Removed useSpring to eliminate the extreme lag over long distances
  const smoothProgress = scrollYProgress;

  // Title Animations (0 to 0.05)
  const titleScaleDesktop = useTransform(smoothProgress, [0, 0.05], [1.5, 1]);
  const titleXDesktop = useTransform(smoothProgress, [0.05, 0.10], ["25vw", "0vw"]);

  // Pointer events mapping to allow interaction only when card is fully visible
  const p1 = useTransform(smoothProgress, (v) => v >= 0.10 && v <= 0.32 ? "auto" : "none");
  const p2 = useTransform(smoothProgress, (v) => v >= 0.20 && v <= 0.42 ? "auto" : "none");
  const p3 = useTransform(smoothProgress, (v) => v >= 0.30 && v <= 0.52 ? "auto" : "none");
  const p4 = useTransform(smoothProgress, (v) => v >= 0.40 && v <= 0.62 ? "auto" : "none");
  const p5 = useTransform(smoothProgress, (v) => v >= 0.50 && v <= 0.72 ? "auto" : "none");
  const p6 = useTransform(smoothProgress, (v) => v >= 0.60 && v <= 0.82 ? "auto" : "none");
  const p7 = useTransform(smoothProgress, (v) => v >= 0.70 ? "auto" : "none");

  // Cards (0.05 to 1.0) mapped closely to avoid massive gaps
  // Card 1: AI Chat
  const c1O = useTransform(smoothProgress, [0.05, 0.12, 0.20, 0.28], [0, 1, 1, 0]);
  const c1Y = useTransform(smoothProgress, [0.05, 0.12, 0.20, 0.28], ["40vh", "0vh", "0vh", "-40vh"]);
  const c1S = useTransform(smoothProgress, [0.05, 0.12, 0.20, 0.28], [0.9, 1, 1, 0.9]);

  // Card 2: Scan
  const c2O = useTransform(smoothProgress, [0.18, 0.25, 0.33, 0.41], [0, 1, 1, 0]);
  const c2Y = useTransform(smoothProgress, [0.18, 0.25, 0.33, 0.41], ["40vh", "0vh", "0vh", "-40vh"]);
  const c2S = useTransform(smoothProgress, [0.18, 0.25, 0.33, 0.41], [0.9, 1, 1, 0.9]);

  // Card 3: Practice
  const c3O = useTransform(smoothProgress, [0.31, 0.38, 0.46, 0.54], [0, 1, 1, 0]);
  const c3Y = useTransform(smoothProgress, [0.31, 0.38, 0.46, 0.54], ["40vh", "0vh", "0vh", "-40vh"]);
  const c3S = useTransform(smoothProgress, [0.31, 0.38, 0.46, 0.54], [0.9, 1, 1, 0.9]);

  // Card 4: Visualize
  const c4O = useTransform(smoothProgress, [0.44, 0.51, 0.59, 0.67], [0, 1, 1, 0]);
  const c4Y = useTransform(smoothProgress, [0.44, 0.51, 0.59, 0.67], ["40vh", "0vh", "0vh", "-40vh"]);
  const c4S = useTransform(smoothProgress, [0.44, 0.51, 0.59, 0.67], [0.9, 1, 1, 0.9]);

  // Card 5: Smart Notes
  const c5O = useTransform(smoothProgress, [0.57, 0.64, 0.72, 0.80], [0, 1, 1, 0]);
  const c5Y = useTransform(smoothProgress, [0.57, 0.64, 0.72, 0.80], ["40vh", "0vh", "0vh", "-40vh"]);
  const c5S = useTransform(smoothProgress, [0.57, 0.64, 0.72, 0.80], [0.9, 1, 1, 0.9]);

  // Card 6: Studio
  const c6O = useTransform(smoothProgress, [0.70, 0.77, 0.85, 0.93], [0, 1, 1, 0]);
  const c6Y = useTransform(smoothProgress, [0.70, 0.77, 0.85, 0.93], ["40vh", "0vh", "0vh", "-40vh"]);
  const c6S = useTransform(smoothProgress, [0.70, 0.77, 0.85, 0.93], [0.9, 1, 1, 0.9]);

  // Card 7: Spaces (Stays at the end)
  const c7O = useTransform(smoothProgress, [0.83, 0.90, 1.00], [0, 1, 1]);
  const c7Y = useTransform(smoothProgress, [0.83, 0.90, 1.00], ["40vh", "0vh", "0vh"]);
  const c7S = useTransform(smoothProgress, [0.83, 0.90, 1.00], [0.9, 1, 1]);

  return (
    <section ref={containerRef} id="features" className="relative h-auto lg:h-[400vh] bg-white border-y border-border-subtle py-24 lg:py-0">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-blue-50/40 to-purple-50/40 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Sticky Container */}
      <div className="lg:sticky lg:top-0 lg:h-screen w-full lg:overflow-hidden flex items-center">
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8 w-full h-full flex flex-col lg:block items-center">
          
          {/* Animated Title Container */}
          <motion.div 
            style={{ x: titleXDesktop, scale: titleScaleDesktop, transformOrigin: "center center" }}
            className="lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:justify-center z-20 w-full lg:w-5/12 max-lg:!transform-none max-lg:!relative max-lg:!w-full max-lg:mb-16 lg:pb-16 text-center lg:text-left"
          >
            <h2 className="text-[2.5rem] sm:text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-gray-900">
              Everything you need to <br className="hidden lg:block"/>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">learn, in one place.</span>
            </h2>
            <p className="mt-6 text-[1.1rem] leading-relaxed text-gray-500 max-w-xl mx-auto lg:mx-0">
              From asking your first question to reviewing before an exam, Gradelys brings your entire study workflow together.
            </p>
          </motion.div>

          {/* Right Column: Cards (Desktop Absolute overlapping, Mobile stacked) */}
          <div className="lg:absolute right-5 lg:right-8 w-full lg:w-6/12 lg:h-full lg:top-0 flex flex-col gap-8 lg:block">

            {/* CARD 1: AI CHAT */}
            <motion.div 
              style={{ opacity: c1O, y: c1Y, scale: c1S, pointerEvents: p1 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-blue-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">AI Chat</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors duration-300">Your personal AI study companion.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Ask questions, upload your course material, or paste a YouTube link. Get clear, contextual explanations grounded in what you're studying.
                </p>
                
                {/* Fake UI Preview: AI Chat */}
                <div className="mt-auto relative h-64 bg-[#fcfdff] rounded-t-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col text-sm transform-gpu -mx-4 -mb-4">
                  <div className="h-10 border-b border-gray-100 flex items-center px-4 justify-between">
                    <div className="font-semibold text-gray-900">Chat</div>
                    <div className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">🔥 3 day streak</div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                    <motion.div variants={{ hover: { y: -5 } }} className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-[12px] shadow-sm max-w-[80%]">
                      Explain photosynthesis
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0.5, y: 10, scale: 0.98 }, hover: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.1 } } }} className="self-start flex gap-3 max-w-[90%]">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-3 h-3 text-white"/>
                      </div>
                      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 text-[12px] text-gray-700 leading-relaxed">
                        <p className="mb-3">Photosynthesis is the process by which plants convert light energy...</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-between gap-1 text-center text-[10px]">
                          <motion.div variants={{ hover: { scale: 1.1, rotate: 5 } }} className="flex flex-col items-center"><div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">☀️</div></motion.div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <motion.div variants={{ hover: { scale: 1.1, y: -2 } }} className="flex flex-col items-center"><div className="w-6 h-6 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">🍃</div></motion.div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <motion.div variants={{ hover: { scale: 1.1, rotate: -5 } }} className="flex flex-col items-center"><div className="w-6 h-6 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">🍬</div></motion.div>
                        </div>
                      </div>
                    </motion.div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fcfdff] to-transparent" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 2: SCAN */}
            <motion.div 
              style={{ opacity: c2O, y: c2Y, scale: c2S, pointerEvents: p2 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-emerald-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <ScanLine className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Scan</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-emerald-600 transition-colors duration-300">Turn mistakes into your next study session.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Upload a graded exam or homework and instantly see what went wrong, why, and what to review next.
                </p>
                
                <div className="mt-auto flex gap-4 h-48 bg-gray-50 -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 overflow-hidden relative">
                  <motion.div 
                    variants={{ hover: { scale: 1.05, y: -5, rotate: -2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-1/2 bg-white rounded shadow-sm border border-gray-200 p-2 relative h-full flex flex-col gap-1.5 opacity-80 z-10"
                  >
                    <div className="w-3/4 h-1 bg-gray-300 rounded-full" />
                    <div className="w-full h-1 bg-gray-200 rounded-full" />
                    <div className="w-5/6 h-1 bg-gray-200 rounded-full" />
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-2" />
                    <div className="w-2/3 h-1 bg-gray-200 rounded-full" />
                    
                    <motion.div 
                      variants={{ hover: { scale: [1, 1.1, 1] } }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-4 border-2 border-emerald-400 rounded-sm"
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-400" />
                    </motion.div>
                    
                    <motion.div variants={{ hidden: { opacity: 0 }, hover: { opacity: 1 } }} className="absolute top-[40%] left-[20%] w-[60%] h-4 bg-red-100/50 rounded" />
                  </motion.div>
                  
                  <motion.div variants={{ hover: { x: -5, opacity: 1 } }} className="w-1/2 flex flex-col gap-3 z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-900">Score</span>
                      <motion.div variants={{ hover: { scale: 1.1 } }} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3"/> 72%</motion.div>
                    </div>
                    <motion.div variants={{ hidden: { opacity: 0, x: 10 }, hover: { opacity: 1, x: 0, transition: { delay: 0.1 } } }} className="flex flex-col gap-1">
                      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">What went wrong</span>
                      <div className="text-[10px] text-gray-700 flex items-start gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" /> Question 2 - Calculation error</div>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: 10 }, hover: { opacity: 1, x: 0, transition: { delay: 0.2 } } }} className="flex flex-col gap-1">
                      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">What to review</span>
                      <div className="text-[10px] text-gray-700 flex items-start gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" /> Quadratic functions</div>
                    </motion.div>
                  </motion.div>
                  
                  <motion.div 
                    variants={{ hover: { top: ["0%", "100%", "0%"] } }}
                    transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-400/50 shadow-[0_0_10px_2px_rgba(52,211,153,0.5)] z-20 pointer-events-none opacity-0 group-hover:opacity-100" 
                  />
                </div>
              </div>
            </motion.div>

            {/* CARD 3: PRACTICE */}
            <motion.div 
              style={{ opacity: c3O, y: c3Y, scale: c3S, pointerEvents: p3 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-purple-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Practice</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-purple-600 transition-colors duration-300">Practice until it sticks.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Turn your course material into quizzes, timed exams, and adaptive flashcards.
                </p>
                
                <div className="mt-auto bg-[#fafafa] -mx-4 -mb-4 p-5 pt-6 rounded-t-xl border border-gray-100 flex flex-col gap-4 h-48">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 mb-1">
                    <div className="h-1 bg-gray-200 rounded-full w-[80%] overflow-hidden">
                      <motion.div 
                        variants={{ hover: { width: "100%", backgroundColor: "#a855f7" } }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-purple-500 w-[60%]" 
                      />
                    </div>
                    <motion.span variants={{ hover: { opacity: 0 } }}>6/10</motion.span>
                    <motion.span className="absolute right-5 opacity-0 text-purple-600" variants={{ hover: { opacity: 1 } }}>7/10</motion.span>
                  </div>
                  <div className="text-xs font-semibold text-gray-900">What is the main function of mitochondria?</div>
                  <div className="flex flex-col gap-2">
                    <motion.div variants={{ hover: { opacity: 0.5, scale: 0.98 } }} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-600 flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-100 text-[9px] flex items-center justify-center font-medium">A</div> Protein synthesis
                    </motion.div>
                    <motion.div 
                      variants={{ hover: { scale: 1.02, backgroundColor: "#f3e8ff", borderColor: "#d8b4fe" } }}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-800 flex items-center gap-2 shadow-sm"
                    >
                      <motion.div variants={{ hover: { backgroundColor: "#9333ea", color: "#fff" } }} className="w-4 h-4 rounded bg-gray-100 text-gray-500 text-[9px] flex items-center justify-center font-medium">
                        <motion.div variants={{ hidden: { opacity: 0 }, hover: { opacity: 1 } }}><CheckCircle2 className="w-3 h-3 absolute -ml-1.5 -mt-1.5"/></motion.div>
                        <motion.span variants={{ hover: { opacity: 0 } }}>B</motion.span>
                      </motion.div> 
                      Cellular respiration
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 4: VISUALIZE */}
            <motion.div 
              style={{ opacity: c4O, y: c4Y, scale: c4S, pointerEvents: p4 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-indigo-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <Network className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Visualize</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors duration-300">Make complex ideas visible.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Transform difficult topics into diagrams, mind maps, timelines, and visual summaries.
                </p>
                
                <div className="mt-auto relative h-48 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path 
                      variants={{ hover: { pathLength: 1, strokeDasharray: "1, 0" } }}
                      initial={{ pathLength: 0, strokeDasharray: "0, 1" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      d="M50 50 L20 30 M50 50 L20 70 M50 50 L80 30 M50 50 L80 70" stroke="#818cf8" strokeWidth="1" fill="none" 
                    />
                  </svg>
                  
                  <motion.div variants={{ hover: { scale: 1.1, rotate: 5 } }} className="absolute w-24 h-8 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold z-10">
                    Photosynthesis
                  </motion.div>
                  <motion.div variants={{ hover: { x: -10, y: -10 } }} className="absolute top-[20%] left-[10%] px-2 py-1 bg-white border border-yellow-200 text-yellow-600 rounded-full shadow-sm text-[9px] font-medium z-10">
                    ☀️ Light
                  </motion.div>
                  <motion.div variants={{ hover: { x: -10, y: 10 } }} className="absolute bottom-[20%] left-[10%] px-2 py-1 bg-white border border-blue-200 text-blue-600 rounded-full shadow-sm text-[9px] font-medium z-10">
                    💧 H₂O
                  </motion.div>
                  <motion.div variants={{ hover: { x: 10, y: -10 } }} className="absolute top-[20%] right-[10%] px-2 py-1 bg-white border border-green-200 text-green-600 rounded-full shadow-sm text-[9px] font-medium z-10">
                    🍃 Chloroplast
                  </motion.div>
                  <motion.div variants={{ hover: { x: 10, y: 10 } }} className="absolute bottom-[20%] right-[10%] px-2 py-1 bg-white border border-purple-200 text-purple-600 rounded-full shadow-sm text-[9px] font-medium z-10">
                    🍬 Glucose
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* CARD 5: SMART NOTES */}
            <motion.div 
              style={{ opacity: c5O, y: c5Y, scale: c5S, pointerEvents: p5 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-violet-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Smart Notes</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-violet-600 transition-colors duration-300">Notes that work harder.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Organize your study material and turn notes into quizzes or flashcards instantly.
                </p>
                
                <div className="mt-auto bg-white -mx-4 -mb-4 rounded-t-xl border border-gray-200 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] h-48 flex flex-col overflow-hidden">
                  <div className="h-8 border-b border-gray-100 flex items-center px-4 gap-3 text-gray-400">
                    <span className="text-[10px] font-medium text-gray-800">Photosynthesis - Summary</span>
                  </div>
                  <div className="p-4 flex-1 overflow-hidden relative">
                    <div className="text-[10px] font-bold text-gray-800 mb-1">1. Overview</div>
                    <motion.div variants={{ hover: { backgroundColor: "#fdf4ff", color: "#9333ea" } }} className="text-[9px] text-gray-600 leading-relaxed bg-yellow-50 inline-block px-1 rounded transition-colors">
                      Photosynthesis is the process by which plants convert light energy...
                    </motion.div>
                    <div className="text-[10px] font-bold text-gray-800 mt-3 mb-1">2. Key reactants</div>
                    <ul className="text-[9px] text-gray-600 list-disc pl-3">
                      <li>Carbon dioxide (CO₂)</li>
                      <li>Water (H₂O)</li>
                    </ul>
                    
                    <motion.div 
                      variants={{ hidden: { y: 40, opacity: 0 }, hover: { y: 0, opacity: 1 } }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full p-1.5 shadow-xl w-max"
                    >
                      <button className="bg-violet-600 text-white text-[9px] font-medium px-4 py-2 rounded-full shadow-md hover:bg-violet-700">Create flashcards</button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 6: STUDIO */}
            <motion.div 
              style={{ opacity: c6O, y: c6Y, scale: c6S, pointerEvents: p6 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-pink-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Studio</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-pink-600 transition-colors duration-300">Turn sources into study material.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Generate structured notes, summaries, reports, essays, and slide outlines from your sources.
                </p>
                
                <div className="mt-auto bg-gray-50 -mx-4 -mb-4 rounded-t-xl border border-gray-200 p-4 h-48 flex items-center justify-center overflow-hidden">
                   <div className="w-full max-w-[200px] bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
                     <div className="px-3 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Generate with Studio</div>
                     <motion.div variants={{ hover: { x: 10, backgroundColor: "#eff6ff" } }} className="flex items-center justify-between px-3 py-2 border-t border-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-blue-500"/> Study Notes</div><ChevronRight className="w-3 h-3 text-gray-300"/></motion.div>
                     <motion.div variants={{ hover: { x: 10, backgroundColor: "#faf5ff" } }} transition={{ delay: 0.05 }} className="flex items-center justify-between px-3 py-2 border-t border-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-purple-500"/> Summary</div><ChevronRight className="w-3 h-3 text-gray-300"/></motion.div>
                     <motion.div variants={{ hover: { x: 10, backgroundColor: "#ecfdf5" } }} transition={{ delay: 0.1 }} className="flex items-center justify-between px-3 py-2 border-t border-gray-50 text-[10px] font-medium text-gray-700"><div className="flex items-center gap-2"><FileText className="w-3 h-3 text-emerald-500"/> Report</div><ChevronRight className="w-3 h-3 text-gray-300"/></motion.div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 7: SPACES */}
            <motion.div 
              style={{ opacity: c7O, y: c7Y, scale: c7S, pointerEvents: p7 }}
              whileHover="hover"
              className="lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center z-10 w-full max-lg:!opacity-100 max-lg:!transform-none max-lg:!relative lg:pb-16"
            >
              <div className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group w-full h-auto">
                <div className="inline-flex items-center gap-2 text-sky-600 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
                    <Folder className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Spaces</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-sky-600 transition-colors duration-300">Keep every subject organized.</h3>
                <p className="text-gray-500 leading-relaxed text-sm mb-8">
                  Group sources, chats, notes, quizzes, and study material by subject or exam.
                </p>
                
                <div className="mt-auto flex flex-col justify-end bg-[#f8fafc] -mx-4 -mb-4 p-4 rounded-t-xl border border-gray-100 h-48 relative overflow-hidden">
                  <motion.div variants={{ hidden: { y: 20, opacity: 0 }, hover: { y: -30, opacity: 0.7, rotate: -5, scale: 0.95 } }} className="absolute bottom-8 left-8 w-[calc(100%-2rem)] bg-white/80 border border-gray-200 rounded-xl shadow-sm p-3 flex gap-3 items-center pointer-events-none">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-gray-400 fill-gray-300" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-500">Biology 101</span>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hover: { y: -10, scale: 1.02 } }} className="w-full bg-white border border-gray-200 rounded-xl shadow-md p-3 flex gap-3 items-center z-10 relative">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-blue-600 fill-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-900">French Revolution</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">12 documents • 8 chats • 4 notes</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
