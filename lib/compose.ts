// Mixing try-on pictures into a new outfit, in the browser, for free.
//
// Each layer is a try-on picture plus the picture it was made from. Where
// the two differ is the piece that was put on; that part is copied onto
// the outfit. Bottoms go first, so tops land over them.

import { loadImage, toBlob } from "./green-screen";
import { slotOf } from "./outfit";

export type Layer = {
  url: string; // the try-on picture
  baseUrl: string; // the picture it was made from
  kind: string | undefined;
};

type Fit = "stretch" | "contain" | "cover";
const FITS: Fit[] = ["stretch", "contain", "cover"];

// Masks are worked out on a small copy, then smoothly scaled up.
const SMALL_WIDTH = 72;
// How different a spot must be to count as the new piece (0 to 1).
const SAME = 0.08;
const DIFFERENT = 0.2;
// Where on her each kind of piece can be, as a share of the height from
// the top. Keeps her face and hair out of the copy.
const BANDS = {
  top: [0.14, 0.82],
  bottom: [0.4, 1],
  dress: [0.14, 1],
} as const;
const BAND_FADE = 0.04;

// Where a picture goes in a W × H frame. FASHN's pictures can be a
// different shape from her photo, so the best fit is picked by looking.
function placement(img: HTMLImageElement, W: number, H: number, fit: Fit) {
  if (fit === "stretch") return { x: 0, y: 0, w: W, h: H };
  const scale = (fit === "contain" ? Math.min : Math.max)(
    W / img.naturalWidth,
    H / img.naturalHeight,
  );
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Couldn't prepare the picture");
  return { c, ctx };
}

function small(img: HTMLImageElement, W: number, H: number, fit: Fit) {
  const sw = SMALL_WIDTH;
  const sh = Math.round((SMALL_WIDTH * H) / W);
  const { ctx } = canvas(sw, sh);
  const p = placement(img, W, H, fit);
  const k = sw / W;
  ctx.drawImage(img, p.x * k, p.y * k, p.w * k, p.h * k);
  return ctx.getImageData(0, 0, sw, sh).data;
}

// 0 (same) to 1 (very different), per small pixel. Blank spots count as
// the same.
function difference(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  const d = new Float32Array(a.length / 4);
  for (let i = 0; i < d.length; i++) {
    const j = i * 4;
    if (a[j + 3] < 128 || b[j + 3] < 128) continue;
    d[i] =
      Math.max(
        Math.abs(a[j] - b[j]),
        Math.abs(a[j + 1] - b[j + 1]),
        Math.abs(a[j + 2] - b[j + 2]),
      ) / 255;
  }
  return d;
}

function bestFit(
  img: HTMLImageElement,
  reference: Uint8ClampedArray,
  W: number,
  H: number,
): Fit {
  let best: Fit = "stretch";
  let bestScore = Infinity;
  for (const fit of FITS) {
    const d = difference(small(img, W, H, fit), reference);
    let sum = 0;
    for (const v of d) sum += v;
    const score = sum / d.length;
    if (score < bestScore) {
      best = fit;
      bestScore = score;
    }
  }
  return best;
}

function spread(m: Float32Array, w: number, h: number, grow: boolean) {
  const out = new Float32Array(m.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
          const s = m[yy * w + xx];
          if (grow) v = Math.max(v, s);
          else v += s;
          n++;
        }
      }
      out[y * w + x] = grow ? v : v / n;
    }
  }
  return out;
}

// How much of each small pixel to copy (0 to 1).
export function pieceMask(
  diff: Float32Array,
  w: number,
  h: number,
  kind: string | undefined,
) {
  let m = new Float32Array(diff.length);
  for (let i = 0; i < m.length; i++) {
    m[i] = Math.min(1, Math.max(0, (diff[i] - SAME) / (DIFFERENT - SAME)));
  }
  m = spread(m, w, h, true);
  m = spread(spread(m, w, h, false), w, h, false);
  const [from, to] = BANDS[slotOf(kind) ?? "dress"];
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const keep = Math.min(
      1,
      Math.max(0, (t - from) / BAND_FADE + 1),
      Math.max(0, (to - t) / BAND_FADE + 1),
    );
    for (let x = 0; x < w; x++) m[y * w + x] *= keep;
  }
  return m;
}

// The start picture with each layer's piece copied on → PNG.
export async function composeOutfit(
  startUrl: string,
  layers: Layer[],
): Promise<Blob> {
  const urls = [startUrl, ...layers.flatMap((l) => [l.url, l.baseUrl])];
  const loaded = new Map(
    await Promise.all(
      [...new Set(urls)].map(async (u) => [u, await loadImage(u)] as const),
    ),
  );
  const first = loaded.get(layers[0]?.url ?? startUrl)!;
  const W = first.naturalWidth;
  const H = first.naturalHeight;
  const sw = SMALL_WIDTH;
  const sh = Math.round((SMALL_WIDTH * H) / W);

  const out = canvas(W, H);
  const start = loaded.get(startUrl)!;
  const frame = small(first, W, H, "stretch");
  const startFit = bestFit(start, frame, W, H);
  const s = placement(start, W, H, startFit);
  out.ctx.drawImage(start, s.x, s.y, s.w, s.h);

  for (const layer of layers) {
    const piece = loaded.get(layer.url)!;
    const base = loaded.get(layer.baseUrl)!;
    const pieceFit = bestFit(piece, frame, W, H);
    const pieceSmall = small(piece, W, H, pieceFit);
    const baseSmall = small(base, W, H, bestFit(base, pieceSmall, W, H));
    const mask = pieceMask(
      difference(pieceSmall, baseSmall),
      sw,
      sh,
      layer.kind,
    );

    const m = canvas(sw, sh);
    const pixels = m.ctx.createImageData(sw, sh);
    for (let i = 0; i < mask.length; i++) {
      pixels.data[i * 4 + 3] = Math.round(mask[i] * 255);
    }
    m.ctx.putImageData(pixels, 0, 0);

    const cut = canvas(W, H);
    const p = placement(piece, W, H, pieceFit);
    cut.ctx.drawImage(piece, p.x, p.y, p.w, p.h);
    cut.ctx.globalCompositeOperation = "destination-in";
    cut.ctx.imageSmoothingEnabled = true;
    cut.ctx.imageSmoothingQuality = "high";
    cut.ctx.drawImage(m.c, 0, 0, W, H);
    out.ctx.drawImage(cut.c, 0, 0);
  }
  return toBlob(out.c, "image/png");
}
