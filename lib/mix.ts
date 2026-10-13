// Free mix-and-match. Every finished try-on is a picture of her wearing a
// set of pieces. Each piece is paid for once; after that, any outfit made
// of paid pieces can be shown for free, either as a saved picture of
// exactly that outfit or by mixing pictures together (lib/compose.ts).
// This file only plans; it never draws or calls FASHN.

import { slotOf, wornItems } from "./outfit";

export type Finished = {
  id: string;
  itemId: string;
  baseTryOnId: string | null;
  resultUrl: string;
};

type KindOf = (id: string) => string | undefined;

const MAX_LAYERS = 12;

export class Wardrobe {
  private looks = new Map<string, Finished>();

  private kindOf: KindOf;

  constructor(looks: Finished[], kindOf: KindOf) {
    this.kindOf = kindOf;
    looks.forEach((l) => this.add(l));
  }

  add(look: Finished) {
    this.looks.set(look.id, look);
  }

  get(id: string) {
    return this.looks.get(id);
  }

  // The try-ons that built this look, first to last. Null if one is missing.
  chainOf(id: string): string[] | null {
    const chain: string[] = [];
    let at: string | null = id;
    while (at) {
      const look = this.looks.get(at);
      if (!look || chain.length > MAX_LAYERS) return null;
      chain.unshift(look.id);
      at = look.baseTryOnId;
    }
    return chain;
  }

  // Every piece put on to make this look, in order.
  itemIdsOf(id: string): string[] | null {
    return this.chainOf(id)?.map((c) => this.looks.get(c)!.itemId) ?? null;
  }

  // The pieces still showing in this look.
  wornIn(id: string): string[] | null {
    const itemIds = this.itemIdsOf(id);
    return itemIds ? wornItems(itemIds, this.kindOf) : null;
  }

  private complete() {
    return [...this.looks.values()].flatMap((look) => {
      const chain = this.chainOf(look.id);
      return chain
        ? [
            {
              look,
              chain,
              worn: wornItems(this.itemIdsOf(look.id)!, this.kindOf),
            },
          ]
        : [];
    });
  }

  // A saved picture of exactly this outfit. Prefers one built on `near`
  // (usually the look she's in now), then the simplest.
  exact(outfit: string[], near: string | null = null): Finished | null {
    const matches = this.complete().filter((c) => sameSet(c.worn, outfit));
    matches.sort(
      (a, b) =>
        Number(b.look.baseTryOnId === near && near !== null) -
          Number(a.look.baseTryOnId === near && near !== null) ||
        a.chain.length - b.chain.length,
    );
    return matches[0]?.look ?? null;
  }

  // The saved look wearing the most of this outfit and nothing else.
  closest(outfit: string[]): Finished | null {
    const fits = this.complete().filter((c) =>
      c.worn.every((id) => outfit.includes(id)),
    );
    fits.sort(
      (a, b) =>
        b.worn.length - a.worn.length || a.chain.length - b.chain.length,
    );
    return fits[0]?.look ?? null;
  }

  // The picture that shows this piece best: the try-on that put it on,
  // built on the fewest other pieces.
  sourceFor(itemId: string): Finished | null {
    const sources = this.complete().filter((c) => c.look.itemId === itemId);
    sources.sort((a, b) => a.chain.length - b.chain.length);
    return sources[0]?.look ?? null;
  }

  // How to show an outfit for free, or null if a piece hasn't been paid
  // for yet. `start` is the picture underneath (the closest saved look,
  // else her starting outfit, else her photo as null); each layer copies
  // one piece out of its own picture, bottoms first so tops go over them.
  mixPlan(
    outfit: string[],
    startingLookId: string | null,
  ): { start: string | null; layers: Finished[] } | null {
    const sources = outfit.map((id) => this.sourceFor(id));
    if (sources.some((s) => !s)) return null;
    const closest = this.closest(outfit);
    const start = closest?.id ?? startingLookId;
    const covered = closest ? this.wornIn(closest.id)! : [];
    const order = wearOrder(outfit, this.kindOf);
    const missing = order.filter((id) => !covered.includes(id));
    // A top already in the start picture goes over any bottoms added.
    const coveredTop = order.find(
      (id) => covered.includes(id) && slotOf(this.kindOf(id)) === "top",
    );
    if (
      coveredTop &&
      missing.some((id) => slotOf(this.kindOf(id)) === "bottom")
    ) {
      missing.push(coveredTop);
    }
    return {
      start,
      layers: missing.map((id) => this.sourceFor(id)!),
    };
  }

  // How to make a real picture of this outfit: start from the closest
  // saved look (or her starting outfit) and put the rest on one at a time,
  // bottoms first. `runs` is how many of those steps aren't saved yet
  // (each one uses a credit).
  exactPlan(
    outfit: string[],
    startingLookId: string | null,
  ): { start: string | null; itemIds: string[]; runs: number } {
    const closest = this.closest(outfit);
    const start = closest?.id ?? startingLookId;
    const covered = closest ? this.wornIn(closest.id)! : [];
    const itemIds = wearOrder(outfit, this.kindOf).filter(
      (id) => !covered.includes(id),
    );
    let base = start;
    let runs = 0;
    for (const itemId of itemIds) {
      // Once one step is new, every step after it is new too.
      const saved = runs === 0 ? this.step(base, itemId) : null;
      if (saved) base = saved.id;
      else runs++;
    }
    return { start, itemIds, runs };
  }

  // The saved look made by putting `itemId` on `base` (null = her photo).
  step(base: string | null, itemId: string): Finished | null {
    for (const look of this.looks.values()) {
      if (look.baseTryOnId === base && look.itemId === itemId) return look;
    }
    return null;
  }
}

export function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

// Bottoms, then tops and outerwear, then dresses: the order she'd dress.
export function wearOrder(itemIds: string[], kindOf: KindOf): string[] {
  const rank = (id: string) =>
    ({ bottom: 0, top: 1, dress: 2 })[slotOf(kindOf(id)) ?? "dress"];
  return [...itemIds].sort((a, b) => rank(a) - rank(b));
}

// The outfit after putting this piece on what she's wearing now.
export function outfitWith(
  wearing: string[],
  itemId: string,
  kindOf: KindOf,
): string[] {
  return wornItems([...wearing, itemId], kindOf);
}
