const apiKey = process.env.GEMINI_API_KEY;

async function testGenerateContent(modelName) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{text: "Generate an image of a cat"}] }] })
      }
    );
    const text = await res.text();
    console.log(modelName, "generateContent", res.status, text.slice(0, 200));
  } catch(e){}
}

(async () => {
  await testGenerateContent("models/gemini-3.1-flash-lite-image");
  await testGenerateContent("models/gemini-2.5-flash-image");
})();
