/**
 * Utilitaire de compression automatique d'images côté client.
 *
 * Spécifications :
 * - Convertit l'image en JPEG
 * - Redimensionne l'image pour que sa plus grande dimension ne dépasse pas 1600 pixels (ratio conservé)
 * - Règle la qualité initiale à 80 % (0.8)
 * - Si le fichier fait encore plus de 1 Mo (1 048 576 octets), baisse la qualité par paliers
 *   jusqu'à passer sous cette limite.
 */

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  size: number;
}

export interface CompressImageOptions {
  /** Dimension maximale en pixels (largeur ou hauteur). Par défaut : 1600 */
  maxDimension?: number;
  /** Qualité JPEG initiale (0..1). Par défaut : 0.8 (80 %) */
  initialQuality?: number;
  /** Taille maximale en octets. Par défaut : 1 Mo (1024 * 1024 octets) */
  maxSizeBytes?: number;
  /** Pas de réduction de la qualité lorsque la taille dépasse la limite. Par défaut : 0.08 */
  qualityStep?: number;
  /** Qualité minimale acceptable. Par défaut : 0.2 */
  minQuality?: number;
}

/**
 * Vérifie si un fichier ou blob est une image.
 */
export function isImageFile(file: File | Blob): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  if (file instanceof File && file.name) {
    return /\.(jpe?g|png|webp|gif|bmp|heic|heif|tiff?)$/i.test(file.name);
  }
  return false;
}

/**
 * Charge une image (File ou Blob) dans un élément HTMLImageElement.
 */
function loadImageElement(source: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger l'image pour la compression."));
    };

    img.src = objectUrl;
  });
}

/**
 * Convertit un canvas en Blob JPEG avec la qualité spécifiée.
 */
function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Échec de la génération du Blob JPEG depuis le canvas."));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Convertit un Blob en chaîne DataURL (base64 avec entête).
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Compresse une image côté client selon les règles définies :
 * - Format de sortie : JPEG
 * - Plus grande dimension <= 1600 px
 * - Qualité de départ : 80 %
 * - Décrémentation par paliers si la taille > 1 Mo
 */
export async function compressImage(
  input: File | Blob,
  options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("compressImage ne peut être exécuté que dans le navigateur.");
  }

  const maxDimension = options.maxDimension ?? 1600;
  const initialQuality = options.initialQuality ?? 0.8;
  const maxSizeBytes = options.maxSizeBytes ?? 1024 * 1024; // 1 Mo
  const qualityStep = options.qualityStep ?? 0.08;
  const minQuality = options.minQuality ?? 0.2;

  // 1. Charger l'image source
  const img = await loadImageElement(input);

  let originalWidth = img.naturalWidth || img.width;
  let originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("Dimensions de l'image invalides.");
  }

  // 2. Calcul du redimensionnement (plus grande dimension <= 1600px, ratio conservé)
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // 3. Dessiner sur le canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Impossible d'obtenir le contexte canvas 2D.");
  }

  // Fond blanc pour éviter un fond noir si l'image originale était un PNG transparent
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 4. Compression initiale à ~80 %
  let currentQuality = initialQuality;
  let blob = await canvasToJpegBlob(canvas, currentQuality);

  // 5. Si > 1 Mo, baisser la qualité par paliers jusqu'à passer sous cette limite
  while (blob.size > maxSizeBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, Number((currentQuality - qualityStep).toFixed(2)));
    blob = await canvasToJpegBlob(canvas, currentQuality);
  }

  // Filet de sécurité supplémentaire : si l'image dépasse encore 1 Mo malgré minQuality
  // (ex: bruit très fort), on réduit les dimensions par paliers de 15%
  let curW = targetWidth;
  let curH = targetHeight;
  while (blob.size > maxSizeBytes && (curW > 600 || curH > 600)) {
    curW = Math.round(curW * 0.85);
    curH = Math.round(curH * 0.85);
    canvas.width = curW;
    canvas.height = curH;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, curW, curH);
    ctx.drawImage(img, 0, 0, curW, curH);
    blob = await canvasToJpegBlob(canvas, currentQuality);
  }

  // 6. Extraction DataURL et Base64
  const dataUrl = await blobToDataUrl(blob);
  const base64 = dataUrl.split(",")[1] || "";

  // 7. Reconstruction d'un objet File avec extension .jpg
  const originalFileName = input instanceof File ? input.name : "photo.jpg";
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
  const outputFileName = `${nameWithoutExt || "photo"}.jpg`;

  const compressedFile = new File([blob], outputFileName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    blob,
    dataUrl,
    base64,
    mimeType: "image/jpeg",
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
  };
}
