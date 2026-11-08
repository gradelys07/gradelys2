import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getMissingRequiredVars } from "@/lib/config";
import { SetupRequired } from "@/components/setup-required";
import { PostHogProvider, PostHogPageView } from "@/components/posthog-provider";

function getBaseUrl(): URL {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("vercel.app")) {
    const urlWithProtocol = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
    try {
      return new URL(urlWithProtocol);
    } catch (e) {
      return new URL("https://gradelys.com");
    }
  }
  return new URL("https://gradelys.com");
}

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: {
    default: "Gradelys: Study Smarter, Remember More",
    template: "%s | Gradelys",
  },
  description:
    "Scan your graded exams, find exactly what you got wrong, and turn your notes into flashcards that stick. Free to start, no credit card.",
  keywords: [
    "study app",
    "spaced repetition flashcards",
    "exam revision",
    "homework scanner",
    "AI study tool",
    "mind map maker",
    "active recall",
    "SM-2",
    "study notes generator",
    "flashcard app",
    "active recall study",
    "exam prep",
  ],
  authors: [{ name: "Gradelys", url: "https://gradelys.com" }],
  creator: "Gradelys",
  publisher: "Gradelys",
  category: "Education",
  applicationName: "Gradelys",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://gradelys.com",
    languages: {
      "en-US": "https://gradelys.com",
      "x-default": "https://gradelys.com",
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3" },
      { url: "/favicon-32x32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=3", sizes: "16x16", type: "image/png" },
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gradelys.com",
    title: "Gradelys: Study Smarter, Remember More",
    description:
      "Scan your graded exams, find exactly what you got wrong, and turn your notes into flashcards that stick. Free to start, no credit card.",
    siteName: "Gradelys",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys — Study Smarter, Remember More",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gradelys: Study Smarter, Remember More",
    description:
      "Scan your graded exams, find exactly what you got wrong, and turn your notes into flashcards that stick. Free to start, no credit card.",
    images: [
      {
        url: "https://gradelys.com/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Gradelys — Study Smarter, Remember More",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = getMissingRequiredVars();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-void font-sans antialiased">
        <Script
          id="whop-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("biz_qFdeP0qtndkr5o");whop.track("page");`
          }}
        />
        {missing.length > 0 ? (
          <SetupRequired missing={missing} />
        ) : (
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <Providers>{children}</Providers>
          </PostHogProvider>
        )}
      </body>
    </html>
  );
}
