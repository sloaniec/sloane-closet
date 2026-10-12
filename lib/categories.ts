// FASHN's garment categories, with the labels Sloane chose.
export const CATEGORIES = [
  { value: "auto", label: "Let the app guess" },
  { value: "tops", label: "Top" },
  { value: "bottoms", label: "Bottom" },
  { value: "one-pieces", label: "Dress or one-piece" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.value === value);
}
