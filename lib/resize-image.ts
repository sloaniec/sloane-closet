// FASHN works at 864 × 1296, so anything bigger than 1600 px on the long
// edge is wasted upload time and storage.
const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.9;

// Shrinks a photo in the browser so its long edge is at most 1600 px,
// and re-saves it as JPEG.
export async function resizeToJpeg(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(
    1,
    MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the photo");
  // JPEG has no transparency, so fill with white first.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't prepare the photo")),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  );
}
