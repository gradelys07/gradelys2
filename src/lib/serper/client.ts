export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY is not configured");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!res.ok) throw new Error(`Serper API error (${res.status})`);
  const data = await res.json();
  return (data.organic || []).slice(0, 5).map((r: any) => ({
    title: r.title,
    snippet: r.snippet || "",
    link: r.link,
  }));
}
