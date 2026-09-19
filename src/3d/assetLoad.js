import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// import.meta.env.BASE_URL matches vite.config.js's `base` — "/" in dev,
// "/3dFrames-task/" in production build. Static files in public/ aren't
// rewritten by Vite automatically, so paths to them must be built from it.
const MODEL_PATHS = {
  column: `${import.meta.env.BASE_URL}assets/models/balk_150x150x2200.obj`,
  cornerBrace: `${import.meta.env.BASE_URL}assets/models/balk_corner.obj`,
  perimeterBeam: `${import.meta.env.BASE_URL}assets/models/balk_150x150x1000.obj`,
  frieze: `${import.meta.env.BASE_URL}assets/models/Lodge_20x200x1000.obj`,
  decking: `${import.meta.env.BASE_URL}assets/models/Lodge_20x190x1000_bevel.obj`,
  latticeBeamLong: `${import.meta.env.BASE_URL}assets/models/lodge_150x50x1000.obj`,
  latticeBeamShort: `${import.meta.env.BASE_URL}assets/models/lodge_150x50x200.obj`,
  roofCover: `${import.meta.env.BASE_URL}assets/models/ruberoid_1000x1000x2.obj`,
  perimeterProfile: `${import.meta.env.BASE_URL}assets/models/roof_edge/roof_edge_1m2.obj`,
  perimeterProfileCorner: `${import.meta.env.BASE_URL}assets/models/roof_edge/roof_edge_corner2.obj`,
};

function extractGeometry(group) {
  const geometries = [];
  group.traverse((child) => {
    if (child.isMesh) {
      geometries.push(child.geometry);
    }
  });

  return geometries[0];
}

export async function loadAssets() {
  const loader = new OBJLoader();

  const entries = Object.entries(MODEL_PATHS);
  const loaded = await Promise.all(
    entries.map(([key, path]) => loader.loadAsync(path).then((group) => [key, extractGeometry(group)])),
  );

  return Object.fromEntries(loaded);
}
