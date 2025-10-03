// assets/index.ts
import { Asset } from "expo-asset";

export const IMAGES = {
  icon: require("./images/icon.png"),
  splash: require("./images/splash-icon.png"),   // using your current file name
  adaptiveIcon: require("./images/adaptive-icon.png"),
  favicon: require("./images/favicon.png"),
};

// (fonts/audio will come later)

export async function preloadAssets() {
  const imageAssets = Object.values(IMAGES).map((m) => Asset.loadAsync(m));
  await Promise.all(imageAssets);
}