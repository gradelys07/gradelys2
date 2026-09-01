"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/whop/tracking";

/** Invisible component that fires a Whop view_content event on mount. */
export function TrackPageView({ page }: { page: string }) {
  useEffect(() => {
    trackViewContent(page);
  }, [page]);

  return null;
}
