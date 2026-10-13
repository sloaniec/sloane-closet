// Kinds of clothing, the closet section each one lives in, and the FASHN
// category used to try it on. FASHN v1.6 can't put on shoes or hats, so
// those are for looking at and shopping only (fashn: null).
export const KINDS = [
  { value: "top", label: "Top", fashn: "tops", section: "tops" },
  { value: "bottom", label: "Bottom", fashn: "bottoms", section: "bottoms" },
  { value: "dress", label: "Dress", fashn: "one-pieces", section: "dresses" },
  { value: "outerwear", label: "Outerwear", fashn: "tops", section: "dresses" },
  { value: "shoes", label: "Shoes", fashn: null, section: "shoes" },
  { value: "hat", label: "Hat", fashn: null, section: "hats" },
] as const;

export type Kind = (typeof KINDS)[number]["value"];
export type SectionId = (typeof KINDS)[number]["section"];

export function isKind(value: unknown): value is Kind {
  return KINDS.some((k) => k.value === value);
}

export function kindInfo(kind: unknown) {
  return KINDS.find((k) => k.value === kind) ?? KINDS[0];
}

export function canTryOn(kind: unknown) {
  return kindInfo(kind).fashn !== null;
}

// The FASHN category stored alongside the kind (shoes and hats keep
// "auto", since they're never tried on).
export function categoryForKind(kind: unknown) {
  return kindInfo(kind).fashn ?? "auto";
}
