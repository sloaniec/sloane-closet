// Working out what she's actually wearing from the pieces she put on, in
// order. FASHN swaps clothes by type: a new top replaces the old top, a new
// bottom replaces the old bottom, and a dress replaces both (a top or
// bottom put on after a dress replaces the dress).

type Slot = "top" | "bottom" | "dress";

export function slotOf(kind: string | undefined): Slot | null {
  if (kind === "top" || kind === "outerwear") return "top";
  if (kind === "bottom") return "bottom";
  if (kind === "dress") return "dress";
  return null;
}

// The pieces still showing after everything she put on.
export function wornItems(
  itemIds: string[],
  kindOf: (id: string) => string | undefined,
): string[] {
  const slots = new Map<Slot, string>();
  const unknown: string[] = [];
  for (const id of itemIds) {
    const slot = slotOf(kindOf(id));
    if (!slot) {
      unknown.push(id);
    } else if (slot === "dress") {
      slots.delete("top");
      slots.delete("bottom");
      slots.set("dress", id);
    } else {
      slots.delete("dress");
      slots.set(slot, id);
    }
  }
  return [...unknown, ...slots.values()];
}
