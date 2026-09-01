import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getMissingRequiredVars } from "@/lib/config";
import { SetupRequired } from "@/components/setup-required";

function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
  try {
    return new URL(urlWithProtocol);
  } catch (e) {
    console.error("Invalid NEXT_PUBLIC_APP_URL:", url);
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: {
    default: "Gradelys — Your AI-powered learning workspace",
    template: "%s · Gradelys",
  },
  description:
    "Chat, scan your homework, generate flashcards, visualize concepts, and study smarter with Gradelys — the all-in-one AI learning workspace for students.",
  keywords: ["AI study app", "flashcards", "spaced repetition", "AI tutor", "exam prep", "study workspace"],
  authors: [{ name: "Gradelys" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: "/apple-touch-icon.png",
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
        <Script
          id="whop-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("biz_qFdeP0qtndkr5o");whop.track("page");`
          }}
        />
        {missing.length > 0 ? (
          <SetupRequired missing={missing} />
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
