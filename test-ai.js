async function run() {
  const res = await fetch("http://localhost:3000/api/studio/presentation/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Add a slide" }],
      presentation: { slides: [] },
      activeSlideId: "1"
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
