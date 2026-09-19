"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrainCircuit, Fingerprint, Sparkles, UserRound, Zap } from "lucide-react";
import { MagicStar } from "@/components/ui/magic-star";

export function AiAdaptationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Animations tied to scroll progress
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0.3, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 0.1], [30, 0]);

  // Chat message 1 (User)
  const msg1Opacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const msg1Y = useTransform(scrollYProgress, [0.15, 0.25], [20, 0]);

  // AI Loading state
  const loadingOpacity = useTransform(scrollYProgress, [0.25, 0.35, 0.45], [0, 1, 0]);
  
  // Floating badges (Profile analysis)
  const badge1Opacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const badge1Scale = useTransform(scrollYProgress, [0.45, 0.55], [0.8, 1]);
  const badge2Opacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);
  const badge2Scale = useTransform(scrollYProgress, [0.5, 0.6], [0.8, 1]);

  // Chat message 2 (AI Response)
  const msg2Opacity = useTransform(scrollYProgress, [0.6, 0.75], [0, 1]);
  const msg2Y = useTransform(scrollYProgress, [0.6, 0.75], [20, 0]);
  const msg2Scale = useTransform(scrollYProgress, [0.6, 0.75], [0.95, 1]);

  // Background gradient shift based on scroll
  const bgGlowOpacity = useTransform(scrollYProgress, [0.1, 0.75], [0.3, 0.8]);
  const bgGlowScale = useTransform(scrollYProgress, [0.1, 0.75], [1, 1.2]);

  return (
    <section ref={containerRef} className="relative bg-white h-[300vh]">
      
      {/* Sticky Container for the "Video" effect */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Dynamic Background Decor */}
        <motion.div 
          style={{ opacity: bgGlowOpacity, scale: bgGlowScale }}
          className="pointer-events-none absolute inset-0 -z-10 flex justify-center items-center"
        >
          <div className="w-[800px] h-[500px] bg-gradient-to-br from-indigo-200 via-purple-100 to-transparent blur-[100px] rounded-full mix-blend-multiply" />
        </motion.div>

        <div className="mx-auto max-w-7xl px-5 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Text Content */}
          <motion.div 
            style={{ opacity, y }}
            className="flex flex-col items-start"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-4 md:mb-6">
              An AI that adapts <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                entirely to you.
              </span>
            </h2>
            
            <p className="text-sm md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
              Gradelys doesn't give generic answers. The AI learns from your skill level, your weak points, and how you think. It adjusts its vocabulary, analogies, and explanations in real-time to guarantee <strong>maximum comprehension</strong>.
            </p>

            <ul className="space-y-3 md:space-y-5">
              {[
                { icon: BrainCircuit, text: "Continuous analysis of your progress and mistakes" },
                { icon: Fingerprint, text: "Unique explanations calibrated to your learning style" },
                { icon: UserRound, text: "Analogies based on your personal interests" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 md:gap-4 text-gray-700 font-medium text-sm md:text-lg">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual Interactive Element (Scroll-driven) */}
          <motion.div
            style={{ opacity, scale }}
            className="relative"
          >
            {/* Glow backdrop */}
            <motion.div 
              style={{ opacity: bgGlowOpacity }}
              className="absolute -inset-4 bg-gradient-to-r from-purple-300 to-indigo-300 blur-3xl rounded-full" 
            />
            
            <div className="relative rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-5 md:p-8 shadow-2xl overflow-hidden min-h-[300px] md:min-h-[400px]">
              {/* Decorative top bar */}
              <div className="flex items-center gap-2 mb-4 md:mb-8">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400/80" />
              </div>

              {/* Chat simulation */}
              <div className="space-y-4 md:space-y-6">
                
                {/* User Message */}
                <motion.div style={{ opacity: msg1Opacity, y: msg1Y }} className="flex items-end justify-end gap-2 md:gap-3">
                  <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-3 md:p-4 max-w-[90%] md:max-w-[80%] text-xs md:text-[15px] text-gray-700 font-medium shadow-sm">
                    "I just can't seem to wrap my head around the concept of entropy in thermodynamics..."
                  </div>
                </motion.div>

                {/* AI Loading/Thinking visual */}
                <motion.div style={{ opacity: loadingOpacity }} className="flex items-center gap-2 md:gap-3 ml-2 md:ml-4 h-6 md:h-8">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-400" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-400" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400" />
                  </div>
                  <span className="text-[10px] md:text-sm text-gray-500 font-medium tracking-wide flex items-center gap-1 md:gap-1.5">
                    <Zap className="w-3 h-3 md:w-4 md:h-4 text-amber-500 animate-pulse" /> Analyzing profile...
                  </span>
                </motion.div>

                {/* AI Message */}
                <motion.div style={{ opacity: msg2Opacity, y: msg2Y, scale: msg2Scale }} className="flex items-start gap-2 md:gap-3 origin-bottom-left">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                    <MagicStar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/60 rounded-2xl rounded-tl-sm p-4 md:p-5 max-w-[95%] md:max-w-[85%] text-xs md:text-[15px] text-gray-800 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-400" />
                    <p className="font-semibold mb-1 md:mb-2 text-indigo-950">
                      No worries! Since you're a Computer Science major, let's look at it from another angle:
                    </p>
                    <p className="text-gray-700 leading-relaxed hidden sm:block">
                      Imagine entropy is like <strong>hard drive fragmentation</strong>. As time goes on, files get scattered and disorganized naturally. The universe does the exact same thing with energy: it naturally tends toward a state of higher disorder.
                    </p>
                    <p className="text-gray-700 leading-relaxed block sm:hidden">
                      Imagine entropy is like <strong>hard drive fragmentation</strong>. Files get scattered over time. The universe naturally tends toward higher disorder just like data.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating Badges */}
            <motion.div 
              style={{ opacity: badge1Opacity, scale: badge1Scale }}
              className="absolute -right-2 md:-right-8 top-1/4 bg-white/90 backdrop-blur-sm px-3 md:px-4 py-2 md:py-2.5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/50 hidden sm:flex items-center gap-2 z-10"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <span className="text-xs md:text-sm font-bold text-gray-800">Profile: CS Major</span>
            </motion.div>

            <motion.div 
              style={{ opacity: badge2Opacity, scale: badge2Scale }}
              className="absolute -left-2 md:-left-8 bottom-1/4 md:bottom-1/3 bg-white/90 backdrop-blur-sm px-3 md:px-4 py-2 md:py-2.5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/50 hidden sm:flex items-center gap-2 z-10"
            >
              <Fingerprint className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
              <span className="text-xs md:text-sm font-bold text-gray-800">Tailored Analogy</span>
            </motion.div>
          </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
