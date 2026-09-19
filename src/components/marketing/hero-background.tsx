"use client";

import { motion } from "framer-motion";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
      />
      
      {/* Animated Glowing Orbs */}
      <motion.div
        animate={{
          x: ["0%", "10%", "-5%", "0%"],
          y: ["0%", "-10%", "5%", "0%"],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply"
      />

      <motion.div
        animate={{
          x: ["0%", "-15%", "5%", "0%"],
          y: ["0%", "15%", "-10%", "0%"],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] right-[15%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply"
      />

      <motion.div
        animate={{
          x: ["0%", "10%", "-15%", "0%"],
          y: ["0%", "-10%", "15%", "0%"],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -bottom-[10%] left-[30%] w-[50vw] h-[30vw] max-w-[700px] max-h-[400px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply"
      />
    </div>
  );
}
