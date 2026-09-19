import { config } from "dotenv";
config({ path: ".env.local" });
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = {
    contents: [{ role: "user", parts: [{ text: "What is the weather?" }] }],
    tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.3 } } }]
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
