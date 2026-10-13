import { SketchRoom, type SketchTheme } from "./sketch-room";

// Sloane's closet: white built-ins, sea-glass and sand washes, gold knobs,
// a palm-leaf chandelier, and an arched window onto the ocean.
const OCEAN: SketchTheme = {
  id: "ocean",
  ink: "#3b4a48",
  wall: "#f3fbf8",
  sideWall: "#e4f3ee",
  ceiling: "#d6efe8",
  floor: "#f0e2c6",
  floorLine: "#c9b28a",
  cabinet: "#ffffff",
  cabinetShade: "#d9efe8",
  knob: "#e9a92b",
  rug: "#bfe3d6",
  rugBorder: "#f6c9b8",
  rugPattern: "#f28c38",
  garments: ["#bfe3d6", "#f6c9b8", "#f3e2bf", "#ffffff", "#9fd3cf", "#ffd75e"],
  shelfThings: ["#f6c9b8", "#9fd3cf", "#f3e2bf", "#ffd75e"],
  chandelier: "palm",
  window: "ocean",
};

// Her older brother's closet: modern greys, dark ink, a linear light, and a
// gridded window onto a city skyline and the ocean.
const CITY: SketchTheme = {
  id: "city",
  ink: "#23272b",
  wall: "#eef0f2",
  sideWall: "#dfe2e5",
  ceiling: "#d3d8dc",
  floor: "#cfd2d5",
  floorLine: "#9da3a8",
  cabinet: "#c9cdd2",
  cabinetShade: "#aab1b8",
  knob: "#2a2e33",
  rug: "#8e959c",
  rugBorder: "#6f7a86",
  rugPattern: "#c9cdd2",
  garments: ["#2f4a66", "#9aa3ad", "#ffffff", "#3a3f45", "#6f7a86", "#c9cdd2"],
  shelfThings: ["#3a3f45", "#2f4a66", "#9aa3ad", "#6f7a86"],
  chandelier: "linear",
  window: "city",
};

function OceanCloset() {
  return <SketchRoom theme={OCEAN} />;
}

function CityCloset() {
  return <SketchRoom theme={CITY} />;
}

// The backgrounds someone can stand in. Each account picks its own in
// Profile (saved on the account, so it follows them to any device).
export const SCENES = [
  { id: "ocean-closet", label: "Ocean closet", Art: OceanCloset },
  { id: "city-closet", label: "City & ocean closet", Art: CityCloset },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export function sceneFor(id: unknown) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
