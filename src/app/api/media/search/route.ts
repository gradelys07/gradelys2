import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/supabase/route-helpers";

export const dynamic = "force-dynamic";

interface MediaImageResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  pageUrl?: string;
}

interface MediaVideoResult {
  videoId: string;
  title: string;
  channel?: string;
  duration?: string;
  thumbnail?: string;
  url: string;
}

const REQUEST_TIMEOUT_MS = 4500;
const WIKI_USER_AGENT = "Gradelys/2.0 (Educational Study Assistant; https://gradelys.com)";

const QUERY_STOP_WORDS = new Set([
  "diagram",
  "diagramme",
  "labeled",
  "labelled",
  "illustration",
  "photo",
  "photos",
  "image",
  "images",
  "picture",
  "stock",
  "view",
  "showing",
  "schema",
  "schéma",
  "structure",
  "internal",
  "interne",
  "human",
  "humain",
  "explained",
  "explique",
  "overview",
  "detailed",
  "anatomy",
  "anatomie",
]);

function simplifySearchQuery(q: string): string {
  const words = q
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const core = words.filter((w) => !QUERY_STOP_WORDS.has(w.toLowerCase()));
  if (core.length >= 2) return core.slice(0, 3).join(" ");
  if (core.length === 1) return words.slice(0, 3).join(" ");
  return words.slice(0, 3).join(" ") || q;
}

function isUsableImageUrl(url: string | undefined | null): url is string {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  const lower = trimmed.split("?")[0].toLowerCase();
  if (lower.endsWith(".svg") || lower.endsWith(".tif") || lower.endsWith(".tiff") || lower.endsWith(".pdf")) {
    return false;
  }
  return true;
}

function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function fetchSerperImages(q: string, num: number): Promise<MediaImageResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: Math.min(Math.max(num * 2, 8), 15) }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data?.images) ? data.images : [];
  const results: MediaImageResult[] = [];
  for (const r of list) {
    if (!isUsableImageUrl(r?.imageUrl)) continue;
    results.push({
      url: r.imageUrl,
      thumbnailUrl: isUsableImageUrl(r?.thumbnailUrl) ? r.thumbnailUrl : r.imageUrl,
      title: String(r.title || q),
      source: String(r.source || "Google Images"),
      pageUrl: typeof r.link === "string" ? r.link : undefined,
    });
  }
  return results;
}

async function fetchWikimediaCommonsImages(q: string): Promise<MediaImageResult[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(q)}` +
    `&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&format=json&origin=*`;

  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as any[];
  const results: MediaImageResult[] = [];
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    const thumb = info?.thumburl || info?.url;
    if (!isUsableImageUrl(thumb)) continue;
    const rawTitle = String(page?.title || q).replace(/^File:/i, "").replace(/\.[^.]+$/, "");
    results.push({
      url: thumb,
      thumbnailUrl: thumb,
      title: rawTitle,
      source: "Wikimedia Commons",
      pageUrl: info?.descriptionurl,
    });
  }
  return results;
}

async function fetchWikipediaImages(q: string, lang: "en" | "fr"): Promise<MediaImageResult[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(q)}&gsrlimit=6&prop=pageimages|info` +
    `&piprop=original|thumbnail&pithumbsize=960&inprop=url&format=json&origin=*`;

  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as any[];
  const results: MediaImageResult[] = [];
  for (const page of pages) {
    const src = page?.thumbnail?.source || page?.original?.source;
    if (!isUsableImageUrl(src)) continue;
    results.push({
      url: src,
      thumbnailUrl: src,
      title: String(page?.title || q),
      source: `Wikipedia (${lang.toUpperCase()})`,
      pageUrl: page?.fullurl,
    });
  }
  return results;
}

async function fetchOpenverseImages(q: string): Promise<MediaImageResult[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=8`;
  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data?.results) ? data.results : [];
  const results: MediaImageResult[] = [];
  for (const item of list) {
    const imgUrl = item?.url;
    const thumb = item?.thumbnail || imgUrl;
    if (!isUsableImageUrl(imgUrl) && !isUsableImageUrl(thumb)) continue;
    const resolvedUrl = isUsableImageUrl(imgUrl) ? imgUrl : (thumb as string);
    results.push({
      url: resolvedUrl,
      thumbnailUrl: isUsableImageUrl(thumb) ? thumb : resolvedUrl,
      title: String(item?.title || q),
      source: String(item?.source || "Openverse"),
      pageUrl: typeof item?.foreign_landing_url === "string" ? item.foreign_landing_url : undefined,
    });
  }
  return results;
}

async function searchImages(q: string, count: number): Promise<MediaImageResult[]> {
  const combined: MediaImageResult[] = [];
  const seen = new Set<string>();

  const collect = (settled: PromiseSettledResult<MediaImageResult[]>[]) => {
    for (const outcome of settled) {
      if (outcome.status !== "fulfilled") continue;
      for (const item of outcome.value) {
        const normalized = item.url.split("#")[0];
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        combined.push(item);
      }
    }
  };

  const primary = await Promise.allSettled([
    fetchSerperImages(q, count),
    fetchWikipediaImages(q, "en"),
    fetchWikimediaCommonsImages(q),
    fetchWikipediaImages(q, "fr"),
    fetchOpenverseImages(q),
  ]);
  collect(primary);

  const simplified = simplifySearchQuery(q);
  if (combined.length < count && simplified.toLowerCase() !== q.trim().toLowerCase()) {
    const secondary = await Promise.allSettled([
      fetchWikimediaCommonsImages(simplified),
      fetchWikipediaImages(simplified, "en"),
      fetchWikipediaImages(simplified, "fr"),
    ]);
    collect(secondary);
  }

  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${q}, educational diagram or realistic illustration`
  )}?nologo=true&width=800&height=600`;

  if (combined.length === 0) {
    combined.push({
      url: fallbackUrl,
      thumbnailUrl: fallbackUrl,
      title: q,
      source: "AI Illustration",
    });
  }

  return combined.slice(0, count);
}

async function fetchSerperVideos(q: string): Promise<MediaVideoResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/videos", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 8 }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data?.videos) ? data.videos : [];
  const results: MediaVideoResult[] = [];
  for (const v of list) {
    const videoId = extractYouTubeVideoId(v?.link || "");
    if (!videoId) continue;
    results.push({
      videoId,
      title: String(v?.title || q),
      channel: typeof v?.channel === "string" ? v.channel : typeof v?.source === "string" ? v.source : undefined,
      duration: typeof v?.duration === "string" ? v.duration : undefined,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  return results;
}

function walkForVideoRenderers(node: any, out: MediaVideoResult[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkForVideoRenderers(item, out);
    return;
  }
  if (node.videoRenderer && typeof node.videoRenderer === "object") {
    const vr = node.videoRenderer;
    const videoId = extractYouTubeVideoId(vr.videoId || "");
    if (videoId) {
      const titleRuns = vr.title?.runs?.map((r: any) => r.text).join("") || vr.title?.simpleText || "";
      const channelRuns =
        vr.ownerText?.runs?.map((r: any) => r.text).join("") ||
        vr.longBylineText?.runs?.map((r: any) => r.text).join("") ||
        undefined;
      const duration = vr.lengthText?.simpleText || undefined;
      out.push({
        videoId,
        title: titleRuns || "YouTube Video",
        channel: channelRuns,
        duration,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
    return;
  }
  for (const key of Object.keys(node)) {
    walkForVideoRenderers(node[key], out);
  }
}

async function fetchYouTubeSearchScrape(q: string): Promise<MediaVideoResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=fr`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const html = await res.text();

  const results: MediaVideoResult[] = [];
  const dataMatch = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (dataMatch?.[1]) {
    try {
      const json = JSON.parse(dataMatch[1]);
      walkForVideoRenderers(json, results);
    } catch {
      // Fall through to regex fallback
    }
  }

  if (results.length === 0) {
    const regex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null && results.length < 8) {
      const videoId = m[1];
      const title = m[2].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
      results.push({
        videoId,
        title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  return results;
}

async function fetchPipedVideos(q: string): Promise<MediaVideoResult[]> {
  const url = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`;
  const res = await fetch(url, {
    headers: { "User-Agent": WIKI_USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const results: MediaVideoResult[] = [];
  for (const item of items) {
    const videoId = extractYouTubeVideoId(item?.url || "");
    if (!videoId) continue;
    const secs = typeof item?.duration === "number" && item.duration > 0 ? item.duration : null;
    const duration = secs
      ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
      : undefined;
    results.push({
      videoId,
      title: String(item?.title || q),
      channel: typeof item?.uploaderName === "string" ? item.uploaderName : undefined,
      duration,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  return results;
}

async function searchVideos(q: string, count: number): Promise<MediaVideoResult[]> {
  const settled = await Promise.allSettled([
    fetchSerperVideos(q),
    fetchYouTubeSearchScrape(q),
    fetchPipedVideos(q),
  ]);

  const combined: MediaVideoResult[] = [];
  const seen = new Set<string>();

  for (const outcome of settled) {
    if (outcome.status !== "fulfilled") continue;
    for (const v of outcome.value) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      combined.push(v);
    }
  }

  return combined.slice(0, count);
}

export async function GET(req: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "videos" ? "videos" : "images";
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return errorResponse("Query parameter 'q' is required", 400);
  }

  const rawCount = Number(searchParams.get("count"));
  const defaultCount = type === "videos" ? 3 : 6;
  const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.min(Math.round(rawCount), 12) : defaultCount;

  if (type === "videos") {
    const videos = await searchVideos(q, count);
    return NextResponse.json({ videos });
  }

  const images = await searchImages(q, count);
  return NextResponse.json({ images });
}

