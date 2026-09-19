"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, MessageSquare, ScanLine, Zap, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TrackingCTA } from "@/components/tracking-cta";
import { toast } from "sonner";

export function AnimatedHeroContent() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    // Set a client side cookie for demo mode to bypass DB creation
    document.cookie = "gradelys_demo=true; path=/; max-age=31536000";
    window.location.href = "/chat";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04, // Faster stagger for letters
        delayChildren: 0.1,
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, filter: "blur(8px)", y: 15 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.2 } }
  };

  // Text annotation fade-in
  const textAnnotationVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20, delay: 1.6 }
    }
  };

  // Scattered "thrown" cards variants
  const throwCardLeft1 = {
    hidden: { opacity: 0, scale: 0.2, x: -150, y: -50, rotate: -40 },
    visible: { 
      opacity: 1, scale: 1, x: -15, y: -10, rotate: -12, 
      transition: { type: "spring", stiffness: 180, damping: 15, delay: 1.8 } 
    }
  };
  const throwCardLeft2 = {
    hidden: { opacity: 0, scale: 0.2, x: -150, y: 150, rotate: 60 },
    visible: { 
      opacity: 1, scale: 1, x: 25, y: 80, rotate: 15, 
      transition: { type: "spring", stiffness: 160, damping: 14, delay: 1.9 } 
    }
  };
  const throwCardRight1 = {
    hidden: { opacity: 0, scale: 0.2, x: 150, y: -50, rotate: 50 },
    visible: { 
      opacity: 1, scale: 1, x: 15, y: -10, rotate: 12, 
      transition: { type: "spring", stiffness: 170, damping: 16, delay: 1.85 } 
    }
  };
  const throwCardRight2 = {
    hidden: { opacity: 0, scale: 0.2, x: 150, y: 150, rotate: -70 },
    visible: { 
      opacity: 1, scale: 1, x: -25, y: 80, rotate: -15, 
      transition: { type: "spring", stiffness: 150, damping: 13, delay: 1.95 } 
    }
  };

  const drawArrow = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 0.8,
      transition: { duration: 1, ease: "easeInOut", delay: 2.1 } 
    }
  };

  const text1 = "Learn smarter.";
  const text2 = "Not harder.";

  // Helper to render letter by letter
  const renderLetters = (text: string) => {
    return text.split(" ").map((word, wordIndex) => (
      <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap mr-[0.25em]">
        {word.split("").map((char, charIndex) => (
          <motion.span 
            key={`char-${wordIndex}-${charIndex}`} 
            variants={letterVariants} 
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </span>
    ));
  };

  return (
    <div className="relative mx-auto max-w-[90rem] px-5 lg:px-8 z-20">
      {/* Left Floating Content - Pushed further left */}
      <div className="absolute top-24 left-0 xl:left-[2%] 2xl:left-[8%] hidden lg:flex flex-col gap-4 max-w-[280px] z-10 pointer-events-none">
        <motion.div variants={textAnnotationVariants} initial="hidden" animate="visible" className="relative mb-6">
          <div className="text-blue-500 font-medium text-[1.1rem] rotate-[-12deg] flex flex-col items-center italic">
            <span>Your AI study</span>
            <span>companion</span>
            <svg width="40" height="40" viewBox="0 0 24 24" className="absolute -right-12 -bottom-2 text-blue-400 rotate-45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <motion.path variants={drawArrow} d="M5 12h14" />
              <motion.path variants={drawArrow} d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </motion.div>
        
        <motion.div 
          variants={throwCardLeft1} 
          initial="hidden" animate="visible" 
          whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
          className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto cursor-default origin-center"
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Chat with AI</h4>
              <p className="text-text-muted text-xs mt-1 leading-snug">Get instant help, explanations and personalized guidance.</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={throwCardLeft2} 
          initial="hidden" animate="visible" 
          whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
          className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto cursor-default origin-center"
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8fbf0] text-[#10b981]">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Scan & Solve</h4>
              <p className="text-text-muted text-xs mt-1 leading-snug">Upload your homework or notes and get step-by-step help.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Floating Content - Pushed further right */}
      <div className="absolute top-28 right-0 xl:right-[2%] 2xl:right-[8%] hidden lg:flex flex-col gap-4 max-w-[280px] z-10 pointer-events-none">
        <motion.div variants={textAnnotationVariants} initial="hidden" animate="visible" className="relative mb-6 flex justify-end pr-4">
          <div className="text-purple-500 font-medium text-[1.1rem] rotate-[8deg] flex flex-col items-center italic">
            <span>From questions...</span>
            <span>to understanding</span>
            <svg width="40" height="40" viewBox="0 0 24 24" className="absolute -left-10 -bottom-2 text-purple-400 rotate-[135deg]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <motion.path variants={drawArrow} d="M5 12h14" />
              <motion.path variants={drawArrow} d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </motion.div>
        
        <motion.div 
          variants={throwCardRight1} 
          initial="hidden" animate="visible" 
          whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
          className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto cursor-default origin-center"
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Smart Flashcards</h4>
              <p className="text-text-muted text-xs mt-1 leading-snug">Spaced repetition that adapts to your progress.</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={throwCardRight2} 
          initial="hidden" animate="visible" 
          whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
          className="bg-surface/80 backdrop-blur-md border border-border-subtle rounded-[1rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] pointer-events-auto cursor-default origin-center"
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm">Visual Learning</h4>
              <p className="text-text-muted text-xs mt-1 leading-snug">Turn any topic into diagrams, charts and mind maps.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Center Content */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mx-auto max-w-4xl text-center pt-24 pb-12 lg:pb-0">
        <h1 className="mt-8 text-[4rem] sm:text-[5.5rem] lg:text-[6.5rem] leading-[1.05] tracking-tight text-gray-900 font-extrabold flex flex-col items-center justify-center">
          <div className="flex overflow-hidden px-4">
            {renderLetters(text1)}
          </div>
          <div className="flex overflow-hidden px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent pb-2">
            {renderLetters(text2)}
          </div>
        </h1>
        
        <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-[1.2rem] leading-relaxed text-text-secondary font-medium">
          Chat with AI, scan your homework for instant feedback, generate flashcards
          that adapt to your memory, and turn any topic into a visual you'll actually remember.
        </motion.p>
        
        <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="[&_button]:!rounded-full [&_button]:px-8">
            <TrackingCTA href="/signup" label="Get started free" source="hero_cta" showArrow={true} />
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: ["0px 0px 0px 0px rgba(99,102,241,0)", "0px 0px 15px 0px rgba(99,102,241,0.4)", "0px 0px 0px 0px rgba(99,102,241,0)"]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full"
          >
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={handleTryDemo}
              disabled={isDemoLoading}
              className="!rounded-full px-8 gap-2 bg-white text-gray-900 hover:bg-gray-50 border-border-subtle shadow-sm transition-colors"
            >
              {isDemoLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              )}
              Try Demo
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8 flex items-center justify-center gap-4 text-sm font-medium text-text-muted">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-text-muted" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 10H21" stroke="currentColor" strokeWidth="2"/></svg>
            No credit card required
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
          <div>Free forever plan</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
