"use client";

import { useState } from "react";
import { MessageSquareHeart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DemoFeedbackButton() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    // Set a client side cookie for demo mode to bypass DB creation
    document.cookie = "gradelys_demo=true; path=/; max-age=31536000";
    window.location.href = "/chat";
  };

  return (
    <button
      onClick={handleTryDemo}
      disabled={isDemoLoading}
      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDemoLoading ? (
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
      ) : (
        <MessageSquareHeart className="h-4 w-4 text-primary" />
      )}
      Test it to add your own feedback
    </button>
  );
}
