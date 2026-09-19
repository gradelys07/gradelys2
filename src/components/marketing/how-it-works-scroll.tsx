"use client";

import { MagicStar as Sparkles } from "@/components/ui/magic-star";
import { useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { CloudUpload, Camera, Link2, FileText, ImageIcon, ArrowRight, Brain, Circle, CheckCircle2, Network, Zap, Search, MessageSquare, Heart, BookOpen, Bot } from "lucide-react";

export function HowItWorksScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = scrollYProgress;

  // Title Animation
  // The title stays in the center background. Slight scale down for parallax effect as cards come in.
  const titleScale = useTransform(smoothProgress, [0, 0.15], [1, 0.9]);
  
  // We swap Text A and Text B when the 3rd card is covering the center.
  // Card 3 arrives at center at 0.65. At this moment, it covers the text.
  const textAOpacity = useTransform(smoothProgress, [0, 0.60, 0.65], [1, 1, 0]);
  const textBOpacity = useTransform(smoothProgress, [0, 0.60, 0.65], [0, 0, 1]);
  
  // Slide Text B down slightly after revealing to meet the testimonials section
  const textBY = useTransform(smoothProgress, [0.75, 1], ["0vh", "20vh"]);

  // Cards Horizontal Scroll Animation
  // 0.00 to 0.15: 1st card slides into center (0vw).
  // 0.15 to 0.40: 2nd card slides into center.
  // 0.40 to 0.65: 3rd card slides into center.
  // 0.65 to 0.90: 3rd card slides out to the left (-300%), revealing Text B.
  // 0.90 to 1.00: Text B stays visible and slides down (via textBY).
  const cardsX = useTransform(
    smoothProgress, 
    [0, 0.15, 0.40, 0.65, 0.90, 1], 
    ["100%", "0%", "-100%", "-200%", "-300%", "-300%"]
  );

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-white border-y border-border-subtle z-10">
      
      {/* Sticky Container */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex items-center justify-center relative">
        
        {/* Background gradient */}
        <div className="absolute inset-0 flex justify-center opacity-30 pointer-events-none z-0">
          <div className="w-[1000px] h-[500px] bg-gradient-to-b from-blue-50/50 via-purple-50/20 to-transparent blur-3xl rounded-full" />
        </div>

        {/* Text A: Three Steps */}
        <motion.div 
          style={{ scale: titleScale, opacity: textAOpacity }}
          className="absolute inset-0 z-0 flex flex-col items-center justify-center text-center w-full px-5 pointer-events-none"
        >
          <h2 className="text-[12vw] md:text-[6rem] lg:text-[7.5rem] leading-[0.9] font-black tracking-tighter text-[#111827] drop-shadow-sm">
            Three steps to a <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">better grade.</span>
          </h2>
        </motion.div>

        {/* Text B: Loved by Students */}
        <motion.div 
          style={{ scale: titleScale, opacity: textBOpacity, y: textBY }}
          className="absolute inset-0 z-0 flex flex-col items-center justify-center text-center w-full px-5 pointer-events-none"
        >
          <h2 className="text-[12vw] md:text-[6rem] lg:text-[7.5rem] leading-[0.9] font-black tracking-tighter text-[#111827] drop-shadow-sm">
            Real students. <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Real progress.</span>
          </h2>
          <p className="mt-8 text-xl lg:text-2xl text-gray-500 max-w-2xl mx-auto font-medium">
            Join thousands of students who are already using Gradelys to study smarter, not harder.
          </p>
        </motion.div>

        {/* Horizontal Scrolling Cards */}
        {/* We use w-full and translate in units of 100% to slide exactly one screen width at a time. */}
        <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
          <motion.div 
            style={{ x: cardsX }}
            className="flex h-full w-[100%] pointer-events-auto"
          >
            
            {/* STEP 1 - Wraps the card to take up 100% of the viewport width so translating -100% centers the next one */}
            <div className="w-full flex-shrink-0 h-full flex items-center justify-center px-4 md:px-12 py-8 lg:py-24">
              <div className="w-full max-w-6xl h-full bg-white border border-gray-100 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-8 pt-8 pb-4">
                  <span className="text-4xl lg:text-6xl font-bold text-blue-600 tracking-tighter">(01)</span>
                  <h3 className="text-3xl lg:text-5xl font-extrabold text-[#111827] tracking-tight">Add content</h3>
                </div>
                
                {/* Graphic Area */}
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-t border-b border-blue-100 relative group flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Floating UI Elements */}
                  <div className="relative w-full h-full flex items-center justify-center max-w-3xl">
                     <div className="w-[85%] max-w-lg bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-10 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform duration-500 z-10 relative">
                       <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                         <CloudUpload className="w-12 h-12 text-blue-500" />
                       </div>
                       <h4 className="text-3xl font-bold text-[#111827] mb-3">Drop your files here</h4>
                       <p className="text-[#6b7280] font-medium mb-10 text-center text-lg">PDFs, images, slides, or paste a link to any course material.</p>
                       <div className="flex w-full gap-4">
                         <div className="flex-1 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center gap-3 text-[#374151] font-bold hover:bg-gray-50 hover:border-blue-200 cursor-pointer transition-colors"><Camera className="w-6 h-6 text-blue-500"/> Photo</div>
                         <div className="flex-1 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center gap-3 text-[#374151] font-bold hover:bg-gray-50 hover:border-blue-200 cursor-pointer transition-colors"><Link2 className="w-6 h-6 text-blue-500"/> Link</div>
                       </div>
                     </div>

                     <div className="absolute -left-12 top-12 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-[bounce_4s_infinite] opacity-90 z-20 hidden md:flex">
                       <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-red-600"/></div>
                       <div><p className="font-bold text-base text-[#111827]">Biology_Ch4.pdf</p><p className="text-sm text-[#6b7280]">2.4 MB</p></div>
                     </div>

                     <div className="absolute -right-12 bottom-12 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-[bounce_5s_infinite] opacity-90 z-20 hidden md:flex">
                       <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-emerald-600"/></div>
                       <div><p className="font-bold text-base text-[#111827]">Exam_photo.jpg</p><p className="text-sm text-emerald-600 font-medium">Uploaded</p></div>
                     </div>
                  </div>
                </div>

                {/* Text Area */}
                <div className="p-8 lg:p-10 bg-white">
                  <h4 className="text-2xl lg:text-3xl font-bold text-[#111827] mb-3">Seamless integration</h4>
                  <p className="text-lg lg:text-xl text-[#6b7280] leading-relaxed max-w-3xl">
                    Simply paste a topic, upload your lengthy course PDF, or snap a photo of a graded exam. We securely process your documents in seconds.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="w-full flex-shrink-0 h-full flex items-center justify-center px-4 md:px-12 py-8 lg:py-24">
              <div className="w-full max-w-6xl h-full bg-white border border-gray-100 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-8 pt-8 pb-4">
                  <span className="text-4xl lg:text-6xl font-bold text-purple-600 tracking-tighter">(02)</span>
                  <h3 className="text-3xl lg:text-5xl font-extrabold text-[#111827] tracking-tight">AI does the work</h3>
                </div>
                
                {/* Graphic Area */}
                <div className="flex-1 bg-gradient-to-br from-purple-50 to-fuchsia-50/50 border-t border-b border-purple-100 relative group flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative w-full h-full flex items-center justify-center max-w-3xl">
                    <div className="w-[90%] bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-10 flex flex-col gap-8 hover:scale-[1.02] transition-transform duration-500">
                      <div className="flex flex-col gap-5">
                        <div className="self-end bg-purple-100 text-purple-900 text-base font-medium px-5 py-4 rounded-3xl rounded-tr-sm shadow-sm max-w-[80%]">
                          Explain photosynthesis like I'm 10 years old.
                        </div>
                        <div className="self-start flex gap-4 w-full pr-12">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-2 shadow-md">
                            <Sparkles className="w-5 h-5 text-white"/>
                          </div>
                          <div className="bg-[#f8f9fa] border border-gray-200 rounded-3xl rounded-tl-sm p-6 text-base text-[#374151] leading-relaxed shadow-sm w-full font-medium">
                            <p className="mb-4 text-lg">Imagine a plant is like a little chef. To cook its food, it needs three things:</p>
                            <ul className="list-disc pl-6 space-y-3">
                              <li><strong>Sunlight</strong> (the oven's heat)</li>
                              <li><strong>Water</strong> (from the roots)</li>
                              <li><strong>Carbon Dioxide</strong> (air we breathe out)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 pl-14">
                        <div className="bg-white border-2 border-gray-100 rounded-full px-5 py-3 text-sm font-bold text-[#374151] flex items-center gap-2 shadow-sm hover:border-purple-300 hover:text-purple-700 cursor-pointer transition-colors"><Brain className="w-5 h-5 text-purple-500"/> Generate Flashcards</div>
                        <div className="bg-white border-2 border-gray-100 rounded-full px-5 py-3 text-sm font-bold text-[#374151] flex items-center gap-2 shadow-sm hover:border-blue-300 hover:text-blue-700 cursor-pointer transition-colors"><FileText className="w-5 h-5 text-blue-500"/> Save to Notes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Area */}
                <div className="p-8 lg:p-10 bg-white">
                  <h4 className="text-2xl lg:text-3xl font-bold text-[#111827] mb-3">Instant understanding</h4>
                  <p className="text-lg lg:text-xl text-[#6b7280] leading-relaxed max-w-3xl">
                    Gradelys instantly reads, structures, and transforms your uploads into conversational chat answers, flashcards, quizzes, and visual summaries.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="w-full flex-shrink-0 h-full flex items-center justify-center px-4 md:px-12 py-8 lg:py-24">
              <div className="w-full max-w-6xl h-full bg-white border border-gray-100 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-8 pt-8 pb-4">
                  <span className="text-4xl lg:text-6xl font-bold text-emerald-600 tracking-tighter">(03)</span>
                  <h3 className="text-3xl lg:text-5xl font-extrabold text-[#111827] tracking-tight">Actually remember</h3>
                </div>
                
                {/* Graphic Area */}
                <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50/50 border-t border-b border-emerald-100 relative group flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative w-full h-full flex items-center justify-center gap-10 max-w-4xl px-4">
                    
                    {/* Quiz Card */}
                    <div className="flex-1 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 flex flex-col z-10 hover:scale-[1.02] transition-transform duration-500">
                      <div className="flex justify-between items-center text-sm text-[#6b7280] font-bold mb-6 uppercase tracking-wider">
                        <span className="text-emerald-600 flex items-center gap-2"><Brain className="w-5 h-5"/> Biology 101</span>
                        <span>2/10</span>
                      </div>
                      <div className="text-2xl font-extrabold text-[#111827] mb-8 leading-snug">What is the main function of mitochondria?</div>
                      <div className="flex flex-col gap-4 mt-auto">
                        <div className="border-2 border-gray-100 rounded-2xl px-5 py-4 text-base font-bold text-[#4b5563] flex items-center gap-3"><Circle className="w-5 h-5 text-[#d1d5db]"/> Protein synthesis</div>
                        <div className="border-2 border-emerald-500 bg-emerald-50 rounded-2xl px-5 py-4 text-base font-bold text-emerald-800 flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-600"/> Cellular Respiration</div>
                        <div className="border-2 border-gray-100 rounded-2xl px-5 py-4 text-base font-bold text-[#4b5563] flex items-center gap-3"><Circle className="w-5 h-5 text-[#d1d5db]"/> DNA replication</div>
                      </div>
                    </div>

                    {/* Stats Card */}
                    <div className="w-[40%] max-w-[240px] flex flex-col gap-6 hidden md:flex">
                      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl hover:scale-105 transition-transform duration-500">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-2xl font-black text-emerald-600 mb-5">12</div>
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-[#1f2937]">Cards Due</span>
                          <span className="text-sm text-[#6b7280] font-medium mb-3">Spaced repetition</span>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[82%]" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 shadow-xl text-white hover:scale-105 transition-transform duration-500">
                         <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                         <h5 className="font-bold text-xl mb-2">Mastery level</h5>
                         <p className="text-[#9ca3af] text-sm">You are 82% ready for the final exam.</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Text Area */}
                <div className="p-8 lg:p-10 bg-white">
                  <h4 className="text-2xl lg:text-3xl font-bold text-[#111827] mb-3">Active recall</h4>
                  <p className="text-lg lg:text-xl text-[#6b7280] leading-relaxed max-w-3xl">
                    Spaced repetition algorithms keep bringing back what you're about to forget, ensuring long-term retention rather than quick cramming.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
