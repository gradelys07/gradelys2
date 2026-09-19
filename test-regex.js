const content = `{"theme":{"fontFamily":"Inter","primaryColor":"#000000","secondaryColor":"#666666","backgroundColor":"#ffffff"},"slides":[{"id":"uLOEStYCala6Sk6ksyHEL","layout":"blank","background":{"type":"solid","value":"#ffffff"},"elements":[]}]}`;

let cleanContent = content;

const jsonBlockMatch = cleanContent.match(/```(?:json|json_presentation)\n([\s\S]*?)\n```/i);
if (jsonBlockMatch) {
  cleanContent = jsonBlockMatch[1].trim();
} else {
  cleanContent = cleanContent.replace(/```(?:json|json_presentation)?\n?/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleanContent.indexOf("{");
  const lastBrace = cleanContent.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
  }
}
console.log("Starts with { ?", cleanContent.startsWith("{"));
try {
  const json = JSON.parse(cleanContent);
  console.log("Is array of slides?", Array.isArray(json.slides));
} catch(e) {
  console.error("Parse failed", e);
}
