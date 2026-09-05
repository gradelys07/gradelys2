import { MetadataRoute } from "next";

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("vercel.app")) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  return "https://gradelys.com";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/pricing",
          "/contact",
          "/privacy",
          "/terms",
          "/cookies",
          "/refund",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/chat/",
          "/notes/",
          "/practice/",
          "/progress/",
          "/scan/",
          "/settings/",
          "/spaces/",
          "/studio/",
          "/visualize/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
