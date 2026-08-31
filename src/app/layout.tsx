import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getMissingRequiredVars } from "@/lib/config";
import { SetupRequired } from "@/components/setup-required";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Gradelys — Your AI-powered learning workspace",
    template: "%s · Gradelys",
  },
  description:
    "Chat, scan your homework, generate flashcards, visualize concepts, and study smarter with Gradelys — the all-in-one AI learning workspace for students.",
  keywords: ["AI study app", "flashcards", "spaced repetition", "AI tutor", "exam prep", "study workspace"],
  authors: [{ name: "Gradelys" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    title: "Gradelys — Your AI-powered learning workspace",
    description: "Chat, scan homework, generate flashcards, and visualize concepts — all in one place.",
    siteName: "Gradelys",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gradelys — Your AI-powered learning workspace",
    description: "Chat, scan homework, generate flashcards, and visualize concepts — all in one place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = getMissingRequiredVars();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-void font-sans antialiased">
        {missing.length > 0 ? (
          <SetupRequired missing={missing} />
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
