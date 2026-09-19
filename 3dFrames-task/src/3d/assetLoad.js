import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const MODEL_PATHS = {
  column: "/assets/models/balk_150x150x2200.obj",
  cornerBrace: "/assets/models/balk_corner.obj",
  perimeterBeam: "/assets/models/balk_150x150x1000.obj",
  frieze: "/assets/models/Lodge_20x200x1000.obj",
  decking: "/assets/models/Lodge_20x190x1000_bevel.obj",
  latticeBeamLong: "/assets/models/lodge_150x50x1000.obj",
  latticeBeamShort: "/assets/models/lodge_150x50x200.obj",
  roofCover: "/assets/models/ruberoid_1000x1000x2.obj",
  perimeterProfile: "/assets/models/roof_edge/roof_edge_1m2.obj",
  perimeterProfileCorner: "/assets/models/roof_edge/roof_edge_corner2.obj",
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
