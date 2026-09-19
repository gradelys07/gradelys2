import { PresentationDocument } from "./types";

/** Convert an image URL to a base64 data URI using an offscreen canvas */
async function urlToBase64(url: string): Promise<string | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = window.document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}

export async function exportToPptx(document: PresentationDocument) {
  if (typeof window === "undefined") return;

  if (!(window as any).PptxGenJS) {
    await new Promise<void>((resolve, reject) => {
      const script = window.document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PptxGenJS"));
      window.document.head.appendChild(script);
    });
  }

  // Pre-fetch all external images as base64 to avoid CORS/XHR issues
  const imageCache = new Map<string, string>();
  for (const slide of document.slides) {
    for (const el of slide.elements) {
      if (el.type === "image") {
        const imgSrc = el.properties.src || (el.properties as any).url;
        if (imgSrc && !imgSrc.startsWith("data:") && !imageCache.has(imgSrc)) {
          const b64 = await urlToBase64(imgSrc);
          if (b64) imageCache.set(imgSrc, b64);
        }
      }
    }
  }

  // Create new PPTX
  const pres = new (window as any).PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = document.metadata?.title || "Presentation";

  document.slides.forEach((slideData) => {
    const slide = pres.addSlide();
    
    if (slideData.background?.type === "solid") {
      slide.background = { color: slideData.background.value.replace("#", "") };
    }

    // Elements
    slideData.elements.forEach(el => {
      // PptxGenJS uses inches. Our logical canvas is 1280x720. 
      // 16x9 layout in PptxGenJS is 10 x 5.625 inches.
      const scaleX = 10 / 1280;
      const scaleY = 5.625 / 720;
      
      const x = el.x * scaleX;
      const y = el.y * scaleY;
      const w = el.width * scaleX;
      const h = el.height * scaleY;

      if (el.type === "text") {
        slide.addText(el.properties.content, {
          x, y, w, h,
          fontSize: el.properties.fontSize * (72 / 96), // rough pixel to pt conversion
          color: el.properties.color?.replace("#", ""),
          bold: el.properties.fontWeight >= 600,
          align: el.properties.alignment,
        });
      }
      
      if (el.type === "shape") {
        slide.addShape(pres.ShapeType.rect, {
          x, y, w, h,
          fill: { color: el.properties.fill?.replace("#", "") },
        });
      }

      if (el.type === "chart") {
         // Advanced mapping required here later, currently a placeholder rectangle
         slide.addShape(pres.ShapeType.rect, {
          x, y, w, h,
          fill: { color: "cccccc" },
        });
        slide.addText(`Chart: ${el.properties.title || 'Chart'}`, { x, y, w, h, align: "center", color: "666666" });
      }
      
      if (el.type === "table") {
        const tableData = el.properties.data.map(row => row.map(cell => ({ text: cell.value })));
        slide.addTable(tableData, { x, y, w, h });
      }

      if (el.type === "image") {
        const imgSrc = el.properties.src || (el.properties as any).url;
        if (imgSrc) {
          const data = imgSrc.startsWith("data:") ? imgSrc : imageCache.get(imgSrc);
          if (data) {
            slide.addImage({ data, x, y, w, h });
          }
        }
      }
    });
  });

  await pres.writeFile({ fileName: `${pres.title}.pptx` });
}
