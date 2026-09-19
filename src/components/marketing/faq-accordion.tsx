"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const isOpen = openIndex === i;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: isOpen ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.5)",
              borderColor: isOpen ? "rgba(59, 130, 246, 0.3)" : "rgba(229, 231, 235, 0.5)",
            }}
            className="rounded-2xl border backdrop-blur-sm overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <span className={cn(
                "text-lg font-bold transition-colors duration-300 pr-4",
                isOpen ? "text-blue-600" : "text-gray-900"
              )}>
                {item.q}
              </span>
              
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
                isOpen ? "bg-blue-100 text-blue-600 shadow-inner" : "bg-gray-100 text-gray-500 border border-gray-200"
              )}>
                <motion.div
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              </div>
            </button>
            
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-6 text-gray-500 leading-relaxed font-medium">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
