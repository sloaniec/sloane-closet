// Reads product details out of a store page's HTML: the Open Graph tags
// (og:image, og:title, og:site_name) and a price from JSON-LD Product data.

export type ProductPreview = {
  title: string | null;
  store: string | null;
  priceText: string | null;
  imageUrl: string | null;
};

export function parseProductPage(html: string, pageUrl: string): ProductPreview {
  const meta = readMetaTags(html);
  const product = findJsonLdProduct(html);

  const image =
    meta.get("og:image:secure_url") ??
    meta.get("og:image") ??
    meta.get("og:image:url") ??
    meta.get("twitter:image") ??
    productImage(product);

  const title =
    meta.get("og:title") ??
    meta.get("twitter:title") ??
    (typeof product?.name === "string" ? product.name : null) ??
    readTitleTag(html);

  return {
    title: clean(title),
    store: clean(meta.get("og:site_name")) ?? hostLabel(pageUrl),
    priceText:
      productPrice(product) ??
      formatPrice(
        meta.get("product:price:amount") ?? meta.get("og:price:amount"),
        meta.get("product:price:currency") ?? meta.get("og:price:currency"),
      ),
    imageUrl: absoluteHttpUrl(image, pageUrl),
  };
}

function readMetaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = readAttributes(tag);
    const key = (attrs.get("property") ?? attrs.get("name"))?.toLowerCase();
    const content = attrs.get("content");
    // Keep the first value: pages list their main image first.
    if (key && content && !tags.has(key)) tags.set(key, decodeEntities(content));
  }
  return tags;
}

function readAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const m of tag.matchAll(
    /([^\s=<>"'/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/g,
  )) {
    attrs.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

function readTitleTag(html: string): string | null {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]) : null;
}

type JsonObject = Record<string, unknown>;

function findJsonLdProduct(html: string): JsonObject | null {
  const scripts = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const [, text] of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(text.trim());
    } catch {
      continue;
    }
    const found = findProduct(data, 0);
    if (found) return found;
  }
  return null;
}

function findProduct(node: unknown, depth: number): JsonObject | null {
  if (depth > 6 || node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findProduct(child, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const obj = node as JsonObject;
  const types = ([] as unknown[]).concat(obj["@type"]);
  if (types.includes("Product") || types.includes("ProductGroup")) return obj;
  for (const key of ["@graph", "mainEntity", "itemListElement", "item"]) {
    const found = findProduct(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function productImage(product: JsonObject | null): string | null {
  const image = ([] as unknown[]).concat(product?.image ?? [])[0];
  if (typeof image === "string") return image;
  if (image && typeof image === "object") {
    const url = (image as JsonObject).url ?? (image as JsonObject).contentUrl;
    if (typeof url === "string") return url;
  }
  return null;
}

function productPrice(product: JsonObject | null): string | null {
  const offers = ([] as unknown[]).concat(
    product?.offers ?? (product?.hasVariant as JsonObject[] | undefined)?.[0]?.offers ?? [],
  );
  for (const offer of offers) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as JsonObject;
    const spec = ([] as unknown[]).concat(o.priceSpecification ?? [])[0] as
      | JsonObject
      | undefined;
    const amount = o.price ?? o.lowPrice ?? spec?.price;
    const currency = o.priceCurrency ?? spec?.priceCurrency;
    const text = formatPrice(amount, currency);
    if (text) return text;
  }
  return null;
}

function formatPrice(amount: unknown, currency: unknown): string | null {
  if (amount === undefined || amount === null || amount === "") return null;
  const value = Number(String(amount).replace(/,/g, ""));
  if (!Number.isFinite(value)) return clean(String(amount));
  if (typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(value);
    } catch {
      // Unknown currency code: fall through.
    }
  }
  return value.toFixed(2);
}

function absoluteHttpUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim(), base);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function hostLabel(pageUrl: string): string | null {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function clean(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 300) : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  trade: "™",
  reg: "®",
  copy: "©",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff
        ? String.fromCodePoint(n)
        : whole;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });
}
