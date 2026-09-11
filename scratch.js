const apiKey = process.env.GEMINI_API_KEY;
async function testModel(modelName) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [{ prompt: "A beautiful sunset" }], parameters: { sampleCount: 1 } })
      }
    );
    const text = await res.text();
    console.log(modelName, res.status, text.slice(0, 200));
  } catch (e) { console.error(modelName, e.message); }
}

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
  await testModel("models/gemini-3.1-flash-image");
  await testGenerateContent("models/gemini-3.1-flash-image");
  await testModel("models/imagen-3.0-generate-001");
})();
