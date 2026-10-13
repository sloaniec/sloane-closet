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
};

export type Shelves = {
  id: string;
  label: string;
  image: string; // cropped to the hanging section
  // Where the gold rod runs, as % of the picture.
  rod: { top: number; left: number; right: number };
  hook: string;
};

export const SCENES: Scene[] = [
  {
    id: "ocean-closet",
    label: "Ocean closet",
    image: "/scenes/ocean-closet.webp",
    shelves: "ocean-shelves",
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
    image: "/shelves/ocean-shelves.webp",
    rod: { top: 14.4, left: 3, right: 9 },
    hook: "#c8901f",
  },
  {
    id: "city-shelves",
    label: "Grey & brass",
    image: "/shelves/city-shelves.webp",
    rod: { top: 13, left: 3, right: 6 },
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
