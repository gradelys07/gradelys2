async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const prompt = "Reply with exactly 'hello'";
  const body = {
    contents: [{ role: "user", parts: [{text: prompt}] }],
    generationConfig: { temperature: 0.7 },
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 200));
}
run();
