// The green-screen trick. Her cut-out goes onto solid green; try-ons keep
// that green behind her; the app removes the green to stand her in a scene.

export const SCREEN_GREEN = { r: 0, g: 177, b: 64 }; // #00b140
const MAX_LONG_EDGE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // signed Storage links allow this
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the picture"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't save the picture"))),
      type,
      quality,
    ),
  );
}

// Transparent cut-out (PNG) → JPEG of her on solid green.
export async function cutoutOnGreen(cutoutUrl: string): Promise<Blob> {
  const img = await loadImage(cutoutUrl);
  const scale = Math.min(
    1,
    MAX_LONG_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the picture");
  const { r, g, b } = SCREEN_GREEN;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return toBlob(canvas, "image/jpeg", 0.95);
}

// Makes green pixels see-through. "Greenness" is how much green beats the
// stronger of red and blue: clearly green → gone; a little green (edges,
// green light spilling onto skin) → partly see-through, with the green
// tint taken out.
export function removeGreen(data: Uint8ClampedArray) {
  const TINT = 12; // below this, leave the pixel alone
  const SOLID = 40; // below this, keep the pixel but remove green tint
  const GONE = 90; // above this, fully see-through
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const greenness = g - Math.max(r, b);
    if (greenness <= TINT) continue;
    if (greenness <= SOLID) {
      // Solid, but with a green edge glow: take the tint out.
      data[i + 1] = Math.max(r, b) + TINT;
      continue;
    }
    if (greenness >= GONE) {
      data[i + 3] = 0;
      continue;
    }
    // An edge pixel is part her, part green. Work out how much is her
    // (keep), and take the green share back out of its color.
    const keep = 1 - (greenness - SOLID) / (GONE - SOLID);
    const unmix = (value: number, key: number) =>
      Math.max(0, Math.min(255, (value - (1 - keep) * key) / keep));
    data[i] = unmix(r, SCREEN_GREEN.r);
    data[i + 1] = Math.min(
      unmix(g, SCREEN_GREEN.g),
      Math.max(data[i], unmix(b, SCREEN_GREEN.b)) + TINT,
    );
    data[i + 2] = unmix(b, SCREEN_GREEN.b);
    data[i + 3] = Math.round(data[i + 3] * keep);
  }
}

// Try-on picture on green → object URL of a see-through PNG.
export async function keyOutGreen(imageUrl: string): Promise<string> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Couldn't prepare the picture");
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  removeGreen(frame.data);
  ctx.putImageData(frame, 0, 0);
  return URL.createObjectURL(await toBlob(canvas, "image/png"));
}
