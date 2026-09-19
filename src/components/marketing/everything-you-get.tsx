"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { MessageSquare, BrainCircuit, Layers, CheckSquare, LineChart, FileText, Check, ArrowDownRight } from "lucide-react";
import { useRef, MouseEvent } from "react";

// --- HIGHLY DETAILED MOCKUPS FOR BENTO GRID ---

const ChatMockup = () => (
  <div className="absolute right-0 bottom-0 w-[95%] md:w-[90%] lg:w-[85%] h-[95%] bg-white rounded-tl-3xl border-t border-l border-gray-100 shadow-[0_30px_60px_rgb(0,0,0,0.12)] flex flex-col transform group-hover:-translate-x-4 group-hover:-translate-y-4 transition-transform duration-700 ease-out overflow-hidden relative">
    
    {/* Window Header */}
    <div className="w-full flex items-center justify-between border-b border-gray-100 p-5 pb-3 z-20 bg-white/95 backdrop-blur-sm relative">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="text-[9px] font-medium text-gray-400">Chapter_4_Notes.pdf</div>
    </div>

    {/* Messages Container */}
    <div className="flex-1 flex flex-col justify-end gap-3.5 px-5 md:px-6 relative overflow-hidden">
      {/* Top fade gradient to simulate scrolling */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />

      {/* Oldest Message (User) */}
      <div className="flex gap-2 items-end opacity-30">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-300 rounded-full" />
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none p-2.5 max-w-[80%] text-[9px] text-gray-700 font-medium">
          What is the main topic of chapter 4?
        </div>
      </div>

      {/* Older Message (AI) */}
      <div className="flex gap-2 items-end flex-row-reverse opacity-60">
        <div className="w-6 h-6 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-blue-600" />
        </div>
        <div className="bg-blue-50 text-gray-600 rounded-2xl rounded-br-none p-3 max-w-[80%] text-[9px] leading-relaxed">
          Chapter 4 covers cellular respiration, detailing glycolysis, the Krebs cycle, and the electron transport chain.
        </div>
      </div>

      {/* Message 2 (User) */}
      <div className="flex gap-2 items-end opacity-90">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-gray-300 rounded-full" />
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none p-3.5 max-w-[80%] shadow-sm text-[10px] text-gray-700 font-medium">
          Can you summarize the Krebs cycle from page 12?
        </div>
      </div>

      {/* Message 3 (AI) */}
      <div className="flex gap-2 items-end flex-row-reverse relative z-10">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-none p-4 max-w-[85%] shadow-md text-[10px] leading-relaxed">
          <p className="mb-2">Sure! Here is a summary of the Krebs cycle based on the text:</p>
          <ul className="list-disc pl-3 mb-3 space-y-1 text-[9px] text-blue-50 opacity-90">
            <li>It occurs in the mitochondrial matrix.</li>
            <li>Produces 2 ATP, 6 NADH, and 2 FADH₂.</li>
          </ul>
          
          {/* Source citation pill */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded bg-blue-500/50 border border-blue-400/50 hover:bg-blue-500 cursor-pointer transition-colors">
            <FileText className="w-2.5 h-2.5 text-blue-100" />
            <span className="text-[8px] font-medium text-blue-50">Source: Page 12</span>
          </div>
        </div>
      </div>
    </div>

    {/* Input Bar */}
    <div className="p-5 md:p-6 pt-3 relative z-20 bg-white">
      <div className="w-full h-10 bg-white rounded-xl border border-gray-200 flex items-center px-3 shadow-sm hover:border-gray-300 transition-colors">
        <div className="w-4 h-4 text-gray-300">
           <MessageSquare className="w-full h-full" />
        </div>
        <div className="ml-3 text-[10px] text-gray-400 font-medium truncate">Ask a follow-up question...</div>
        <div className="ml-auto w-6 h-6 flex-shrink-0 bg-blue-500 rounded flex items-center justify-center shadow-sm">
           <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent ml-0.5" />
        </div>
      </div>
    </div>
  </div>
);

const MindMapMockup = () => (
  <div className="absolute right-0 bottom-0 w-[85%] h-[85%] bg-gradient-to-br from-purple-50/90 to-purple-100/40 rounded-tl-3xl border-t border-l border-purple-100 p-4 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out origin-bottom-right overflow-hidden shadow-xl">
    {/* Subtle grid background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12)_1px,transparent_1px)] [background-size:12px_12px]" />
    
    <div className="relative w-full h-full flex items-center justify-center">
      {/* SVG Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 50 50 L 25 25" stroke="#d8b4fe" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M 50 50 L 75 75" stroke="#d8b4fe" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M 50 50 L 75 25" stroke="#d8b4fe" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>

      {/* Central Node */}
      <div className="absolute w-16 h-10 bg-purple-600 rounded-xl z-20 shadow-lg border border-purple-400 flex flex-col items-center justify-center gap-1.5">
        <div className="w-8 h-1.5 bg-purple-200 rounded-full" />
        <div className="w-5 h-1 bg-purple-300 rounded-full" />
      </div>
      
      {/* Child Nodes */}
      <div className="absolute top-2 left-2 w-14 h-8 bg-white rounded-lg shadow-md border border-purple-200 flex items-center justify-center z-10">
        <div className="w-8 h-1 bg-purple-300 rounded-full" />
      </div>
      <div className="absolute bottom-2 right-2 w-14 h-8 bg-white rounded-lg shadow-md border border-purple-200 flex items-center justify-center z-10">
        <div className="w-8 h-1 bg-purple-300 rounded-full" />
      </div>
      <div className="absolute top-2 right-2 w-12 h-6 bg-purple-100 rounded-md shadow-sm border border-purple-200 flex items-center justify-center z-10">
        <div className="w-6 h-1 bg-purple-300 rounded-full" />
      </div>
    </div>
  </div>
);

const FlashcardMockup = () => (
  <div className="absolute right-0 bottom-0 w-full h-full flex items-end justify-end p-6 perspective-1000">
    <div className="relative w-40 h-48 transform group-hover:-translate-y-8 group-hover:rotate-0 -rotate-12 transition-all duration-700 ease-out origin-bottom-right">
      
      {/* Back card */}
      <div className="absolute inset-0 bg-white shadow-xl rounded-2xl border border-gray-200 rotate-12 origin-bottom-right transition-transform duration-700 group-hover:rotate-6" />
      
      {/* Middle card */}
      <div className="absolute inset-0 bg-emerald-50/80 shadow-xl rounded-2xl border border-emerald-100 rotate-6 origin-bottom-right transition-transform duration-700 group-hover:rotate-3" />
      
      {/* Front card */}
      <div className="absolute inset-0 bg-white shadow-2xl rounded-2xl border border-emerald-200 p-5 flex flex-col justify-between transform-style-3d group-hover:border-emerald-400 transition-colors duration-700">
        
        {/* Card Content */}
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
            <Layers className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full" />
          <div className="w-2/3 h-2.5 bg-gray-200 rounded-full" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2 mt-auto pt-4 border-t border-gray-100">
           <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
             <div className="w-3 h-3 bg-red-400 rounded-sm rotate-45" />
           </div>
           <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
             <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
           </div>
        </div>
      </div>
    </div>
  </div>
);

const QuizMockup = () => (
  <div className="absolute right-0 bottom-0 w-[95%] h-[95%] bg-white rounded-tl-3xl border-t border-l border-gray-100 shadow-2xl p-6 flex flex-col gap-3.5 transform group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-700 ease-out">
    
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 rounded bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">Q3</div>
      <div className="w-2/3 h-2.5 bg-gray-200 rounded-full" />
    </div>
    <div className="w-4/5 h-2 bg-gray-200 rounded-full mb-3" />

    {/* Options */}
    <div className="w-full h-11 bg-white rounded-xl border border-gray-200 flex items-center px-3 shadow-sm hover:border-gray-300">
      <div className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 font-bold">A</div>
      <div className="ml-3 w-1/2 h-2 bg-gray-200 rounded-full" />
    </div>

    <div className="w-full h-11 bg-rose-50 rounded-xl border-2 border-rose-400 flex items-center px-3 shadow-md relative overflow-hidden">
      <div className="absolute inset-0 bg-rose-400/10" />
      <div className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center relative z-10">
         <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
      <div className="ml-3 w-2/3 h-2 bg-rose-600/60 rounded-full relative z-10" />
    </div>

    <div className="w-full h-11 bg-white rounded-xl border border-gray-200 flex items-center px-3 shadow-sm">
      <div className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 font-bold">C</div>
      <div className="ml-3 w-1/3 h-2 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const StudioMockup = () => (
  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[95%] h-[90%] bg-gray-50 rounded-l-3xl border-y border-l border-gray-200 shadow-2xl p-2 flex gap-2 transform group-hover:-translate-x-6 transition-transform duration-700 ease-out overflow-hidden">
    
    {/* Toolbar */}
    <div className="absolute top-0 left-0 right-0 h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-2 z-20 shadow-sm">
       <div className="w-3 h-3 rounded-full bg-red-400" />
       <div className="w-3 h-3 rounded-full bg-amber-400" />
       <div className="w-3 h-3 rounded-full bg-emerald-400" />
       <div className="ml-4 w-32 h-3 bg-gray-100 rounded-md" />
       <div className="ml-auto w-16 h-5 bg-amber-500 text-white text-[8px] font-bold rounded flex items-center justify-center">Export</div>
    </div>

    {/* Sidebar */}
    <div className="w-[30%] h-full pt-12 pb-2 px-2 bg-white/50 border-r border-gray-200 flex flex-col gap-3 overflow-y-auto">
       <div className="w-full aspect-video bg-amber-50 rounded-lg border-2 border-amber-400 relative shadow-sm">
          <div className="absolute bottom-1 right-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">1</div>
       </div>
       <div className="w-full aspect-video bg-white rounded-lg border border-gray-200 shadow-sm relative opacity-70">
          <div className="absolute bottom-1 right-1 text-[9px] font-bold text-gray-400">2</div>
       </div>
       <div className="w-full aspect-video bg-white rounded-lg border border-gray-200 shadow-sm relative opacity-70">
          <div className="absolute bottom-1 right-1 text-[9px] font-bold text-gray-400">3</div>
       </div>
    </div>

    {/* Main Editor */}
    <div className="flex-1 h-full pt-12 pb-4 px-6 flex flex-col items-center justify-center relative">
       {/* Slide Content */}
       <div className="w-full h-full max-h-[160px] bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
         <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-amber-300 to-rose-400" />
         <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
           <Sparkles className="w-8 h-8 text-amber-500" />
         </div>
         <div className="w-3/4 h-5 bg-gray-800 rounded-full mb-4" />
         <div className="w-full h-2.5 bg-gray-200 rounded-full mb-3" />
         <div className="w-5/6 h-2.5 bg-gray-200 rounded-full" />
       </div>
    </div>
  </div>
);

const AnalyticsMockup = () => (
  <div className="absolute right-0 bottom-0 w-[95%] md:w-[90%] lg:w-[85%] h-[90%] bg-white rounded-tl-3xl border-t border-l border-gray-100 shadow-[0_30px_60px_rgb(0,0,0,0.1)] p-8 flex flex-col justify-end transform group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-700 ease-out">
    
    {/* Header */}
    <div className="absolute top-8 left-8 right-8 flex justify-between items-center border-b border-gray-100 pb-5">
      <div>
        <div className="w-24 h-2 bg-gray-300 rounded-full mb-3" />
        <div className="w-36 h-5 bg-gray-800 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-cyan-50 rounded-md border border-cyan-100 flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <div className="w-12 h-1.5 bg-cyan-500/50 rounded-full" />
        </div>
      </div>
    </div>

    {/* Bar chart mockup */}
    <div className="flex items-end justify-between gap-3 sm:gap-6 h-[55%] border-b-2 border-gray-100 pb-0 relative">
      {/* Background grid lines */}
      <div className="absolute top-0 w-full h-px bg-gray-100" />
      <div className="absolute top-1/2 w-full h-px bg-gray-100" />

      {[30, 55, 40, 85, 60, 100, 75].map((height, i) => (
        <div key={i} className="w-full relative group/bar flex flex-col items-center justify-end h-full">
          {height === 100 && (
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 z-10 flex flex-col items-center">
               Peak Focus
               <div className="w-2 h-2 bg-cyan-600 rotate-45 absolute -bottom-1" />
             </div>
          )}
          <div 
            className={`w-full rounded-t-lg relative transition-all duration-700 delay-[${i * 50}ms] ${height === 100 ? 'bg-cyan-500' : 'bg-cyan-100 group-hover:bg-cyan-200'}`} 
            style={{ height: `${height}%` }} 
          />
          {/* X axis labels */}
          <div className="mt-3 w-5 h-1.5 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

// --- FEATURES DATA ---

const FEATURES = [
  {
    id: "chat",
    title: "Document Chat",
    description: "Talk directly to your PDFs, slides, and notes. Get immediate answers and explanations from your course materials.",
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    glowColor: "rgba(59, 130, 246, 0.25)",
    hoverTitle: "group-hover:text-blue-600",
    className: "md:col-span-2 md:row-span-2",
    horizontal: false,
    mockup: ChatMockup,
  },
  {
    id: "mindmaps",
    title: "Smart Mind Maps",
    description: "Visualize materials with AI-generated structures in seconds.",
    icon: BrainCircuit,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    glowColor: "rgba(168, 85, 247, 0.25)",
    hoverTitle: "group-hover:text-purple-600",
    className: "md:col-span-1 md:row-span-1",
    horizontal: false,
    mockup: MindMapMockup,
  },
  {
    id: "flashcards",
    title: "Spaced Repetition",
    description: "Memorize faster and retain info longer with our SM-2 engine.",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    glowColor: "rgba(16, 185, 129, 0.25)",
    hoverTitle: "group-hover:text-emerald-600",
    className: "md:col-span-1 md:row-span-1",
    horizontal: false,
    mockup: FlashcardMockup,
  },
  {
    id: "quizzes",
    title: "Custom Quizzes",
    description: "Test knowledge with generated multiple-choice questions.",
    icon: CheckSquare,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    glowColor: "rgba(244, 63, 94, 0.25)",
    hoverTitle: "group-hover:text-rose-600",
    className: "md:col-span-1 md:row-span-1",
    horizontal: false,
    mockup: QuizMockup,
  },
  {
    id: "studio",
    title: "Presentation Studio",
    description: "Create stunning, AI-assisted presentations and study guides directly from your course materials in one click.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    glowColor: "rgba(245, 158, 11, 0.25)",
    hoverTitle: "group-hover:text-amber-600",
    className: "md:col-span-2 md:row-span-1",
    horizontal: true,
    textClass: "md:w-1/2",
    mockupClass: "md:w-1/2",
    mockup: StudioMockup,
  },
  {
    id: "analytics",
    title: "Progress Tracking",
    description: "Analyze your performance, track your study streaks, and identify your knowledge gaps at a single glance.",
    icon: LineChart,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    glowColor: "rgba(6, 182, 212, 0.25)",
    hoverTitle: "group-hover:text-cyan-600",
    className: "md:col-span-3 md:row-span-1",
    horizontal: true,
    textClass: "md:w-1/3 lg:w-1/3",
    mockupClass: "md:w-2/3 lg:w-2/3",
    mockup: AnalyticsMockup,
  },
];

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Mouse position values for the 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animation for smooth 3D tilting
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Map mouse position to rotation angles
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-6, 6]);

  // Glow effect mapping
  const gradientX = useTransform(smoothMouseX, [-0.5, 0.5], [0, 100]);
  const gradientY = useTransform(smoothMouseY, [-0.5, 0.5], [0, 100]);
  const background = useMotionTemplate`radial-gradient(400px circle at ${gradientX}% ${gradientY}%, ${feature.glowColor}, transparent 70%)`;

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        type: "spring",
        bounce: 0.4
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative group h-full cursor-default rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgb(0,0,0,0.1)] transition-all duration-500 ${feature.className}`}
    >
      {/* Interactive Hover Glow (Follows mouse) */}
      <motion.div
        className="absolute inset-0 z-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background }}
      />

      <div className={`relative h-full flex z-10 overflow-hidden rounded-[32px] ${feature.horizontal ? 'flex-col md:flex-row' : 'flex-col'}`} style={{ transform: "translateZ(20px)" }}>
        
        {/* Text Content */}
        <div className={`p-8 md:p-10 ${feature.horizontal ? `${feature.textClass} flex flex-col justify-center` : 'pb-0'}`}>
          {/* Animated Icon */}
          <motion.div 
            whileHover={{ scale: 1.15, rotate: 10, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 shadow-sm`}
          >
            <feature.icon className={`w-7 h-7 ${feature.color}`} />
          </motion.div>
          
          <h3 className={`text-2xl font-extrabold mb-3 text-[#111827] transition-colors duration-300 ${feature.hoverTitle}`}>
            {feature.title}
          </h3>
          
          <p className="text-gray-500 text-lg leading-relaxed font-medium">
            {feature.description}
          </p>
        </div>

        {/* Mockup Container */}
        <div className={`relative flex-grow min-h-[220px] lg:min-h-[250px] ${feature.horizontal ? feature.mockupClass : 'mt-6'}`}>
          <feature.mockup />
        </div>

        {/* Demo Button - Bottom Right (Revealed on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            document.cookie = "gradelys_demo=true; path=/; max-age=31536000";
            window.location.href = "/chat";
          }}
          title={`Essayer ${feature.title}`}
          className="absolute bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-[#111827] text-white hover:bg-black shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group/demobtn opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
        >
          <ArrowDownRight strokeWidth={1.5} className="w-5 h-5 group-hover/demobtn:translate-x-0.5 group-hover/demobtn:translate-y-0.5 transition-transform duration-300" />
        </button>
      </div>
    </motion.div>
  );
}

export function EverythingYouGet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Scroll Parallax for Header
  const headerY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  // Scroll Parallax for Background Orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], ["-20%", "50%"]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ["20%", "-50%"]);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden z-10 bg-gradient-to-b from-transparent via-blue-50/10 to-transparent perspective-1000">
      
      {/* Scroll-driven floating Background Orbs */}
      <motion.div 
        style={{ y: orb1Y }} 
        className="absolute top-10 left-[10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[120px] -z-10 pointer-events-none" 
      />
      <motion.div 
        style={{ y: orb2Y }} 
        className="absolute bottom-10 right-[10%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[150px] -z-10 pointer-events-none" 
      />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        
        {/* Animated Header Section */}
        <motion.div 
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center mb-24 relative z-10"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#111827] tracking-tight mb-6">
            Everything you need, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">in one workspace.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            A complete suite of AI-powered learning tools built specifically to help you study smarter, not harder.
          </p>
        </motion.div>

        {/* Dynamic Bento Grid with 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
