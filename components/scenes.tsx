import Image from "next/image";

// The backgrounds someone can stand in: pictures Sloane made with an image
// tool. Each account picks its own in Profile (saved on the account, so it
// follows them to any device). `rail` styles the closet the clothes hang in.
export type Scene = {
  id: string;
  label: string;
  image: string;
  rail: {
    wood: string; // cabinet colors, top to bottom
    grain: string;
    rod: string; // hanging rod, light to dark
    hook: string;
  };
};

export const SCENES: Scene[] = [
  {
    id: "ocean-closet",
    label: "Ocean closet",
    image: "/scenes/ocean-closet.webp",
    rail: {
      wood: "#fbf6ee, #f1e6d3",
      grain: "rgba(201, 178, 138, 0.18)",
      rod: "#f6d48a, #c8901f",
      hook: "#c8901f",
    },
  },
  {
    id: "city-closet",
    label: "City & ocean closet",
    image: "/scenes/city-closet.webp",
    rail: {
      wood: "#e3e1dd, #c9c5bf",
      grain: "rgba(90, 90, 90, 0.14)",
      rod: "#e6e8ea, #8d939a",
      hook: "#8d939a",
    },
  },
];

export function sceneFor(id: unknown): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

// The background picture, filling its box.
export function SceneImage({
  scene,
  priority = false,
}: {
  scene: Scene;
  priority?: boolean;
}) {
  return (
    <Image
      src={scene.image}
      alt=""
      fill
      priority={priority}
      sizes="(max-width: 448px) 100vw, 448px"
      className="object-cover"
    />
  );
}
