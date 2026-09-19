import './style.css';
import * as THREE from 'three';
import { createScene } from './3d/createScene';
import { loadAssets } from './3d/assetLoad';
import { buildCanopy } from './3d/buildCanopy.js';

const canvas = document.getElementById('scene-canvas');
const { scene } = createScene(canvas);
let canopyGroup = null;
loadAssets().then(assets => {
	function rebuildCanopy(dimensions) {
		if (canopyGroup) {
			scene.remove(canopyGroup);
		}
		canopyGroup = buildCanopy(dimensions, assets);
		scene.add(canopyGroup);
	}

  const initialDimensions = { width: 4, depth: 3 , height: 2.5 };

  rebuildCanopy(initialDimensions);
});
