import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getMissingRequiredVars } from "@/lib/config";
import { SetupRequired } from "@/components/setup-required";

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
    default: "Gradelys | Espace d'apprentissage & de révision interactif",
    template: "%s | Gradelys",
  },
  description:
    "Révisez efficacement avec Gradelys : mémorisation espacée (SM-2), diagnostics d'exercices, fiches de révision et synthèses visuelles pour votre réussite académique.",
  keywords: [
    "révision examen",
    "fiches de révision",
    "répétition espacée",
    "algorithme SM-2",
    "méthode de travail étudiant",
    "synthèse de cours",
    "diagnostic examen",
    "active recall",
    "apprentissage interactif",
    "espace d'étude",
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
    canonical: "/",
    languages: {
      "fr": "https://gradelys.com",
      "en": "https://gradelys.com",
      "x-default": "https://gradelys.com",
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    url: "https://gradelys.com",
    title: "Gradelys | Espace d'apprentissage & de révision interactif",
    description:
      "Révisez efficacement avec Gradelys : mémorisation espacée (SM-2), diagnostics d'exercices, fiches de révision et synthèses visuelles pour votre réussite académique.",
    siteName: "Gradelys",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gradelys | Espace d'apprentissage & de révision interactif",
    description:
      "Révisez efficacement avec Gradelys : mémorisation espacée (SM-2), diagnostics d'exercices, fiches de révision et synthèses visuelles pour votre réussite académique.",
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
    <html lang="fr" suppressHydrationWarning>
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
