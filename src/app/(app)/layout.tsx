import type { Metadata } from "next";
import { AppLayoutClient } from "@/components/app-shell/app-layout-client";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Gradelys",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
