import Image from "next/image";

// Pictures Sloane made with an image tool. Each account picks a background
// (the room she stands in) and a set of closet shelves (where her clothes
// hang), saved on the account. The shelves default to the set that goes
// with the background.

export type Scene = {
  id: string;
  label: string;
  image: string;
  shelves: string; // the shelves that go with this background
  // Sloane's painted buttons for this background (round pictures).
  buttons?: { prev: string; next: string; add: string };
};

export type Shelves = {
  id: string;
  label: string;
  image: string; // the whole cabinet, for the Profile choice
  // Parts of the cabinet picture, one per closet section.
  parts: { hats: string; hanging: string; folded: string; shoes: string };
  rodTop: number; // where the gold rod runs in `hanging`, as % from the top
  hook: string;
};

export const SCENES: Scene[] = [
  {
    id: "ocean-closet",
    label: "Ocean closet",
    image: "/scenes/ocean-closet.webp",
    shelves: "ocean-shelves",
    buttons: {
      prev: "/buttons/ocean-prev.webp",
      next: "/buttons/ocean-next.webp",
      add: "/buttons/ocean-add.webp",
    },
  },
  {
    id: "city-closet",
    label: "City & ocean closet",
    image: "/scenes/city-closet.webp",
    shelves: "city-shelves",
  },
];

export const SHELVES: Shelves[] = [
  {
    id: "ocean-shelves",
    label: "Cream & gold",
    image: "/shelves/ocean-cabinet.webp",
    parts: {
      hats: "/shelves/ocean-hats-empty.webp",
      hanging: "/shelves/ocean-tops-empty.webp",
      folded: "/shelves/ocean-bottoms-empty.webp",
      shoes: "/shelves/ocean-shoes-empty.webp",
    },
    rodTop: 21,
    hook: "#c8901f",
  },
  {
    id: "city-shelves",
    label: "Grey & brass",
    image: "/shelves/city-cabinet.webp",
    parts: {
      hats: "/shelves/city-hats-empty.webp",
      hanging: "/shelves/city-tops-empty.webp",
      folded: "/shelves/city-bottoms-empty.webp",
      shoes: "/shelves/city-shoes-empty.webp",
    },
    rodTop: 18.5,
    hook: "#a8822f",
  },
];

export function sceneFor(id: unknown): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

export function shelvesFor(id: unknown, scene: Scene): Shelves {
  return (
    SHELVES.find((s) => s.id === id) ??
    SHELVES.find((s) => s.id === scene.shelves) ??
    SHELVES[0]
  );
}

// A picture filling its box.
export function FillImage({
  src,
  priority = false,
}: {
  src: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes="(max-width: 448px) 100vw, 448px"
      className="object-cover"
    />
  );
}

// One of the background's painted buttons, filling its round button.
export function ButtonArt({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={120}
      height={120}
      className="h-full w-full drop-shadow-md"
    />
  );
}
