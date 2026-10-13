import { CityClosetArt } from "./city-closet-art";
import { ClosetSceneArt } from "./closet-scene-art";

// The backgrounds someone can stand in. Each account picks its own in
// Profile (saved on the account, so it follows them to any device).
export const SCENES = [
  { id: "ocean-closet", label: "Ocean closet", Art: ClosetSceneArt },
  { id: "city-closet", label: "City & ocean closet", Art: CityClosetArt },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export function sceneFor(id: unknown) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
