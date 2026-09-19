import './style.css';
import { createScene } from './3d/createScene';
import { loadAssets } from './3d/assetLoad';
import { buildCanopy } from './3d/buildCanopy.js';
import { createDimensionsForm } from './ui/dimensionsForm.js';

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

	const initialDimensions = createDimensionsForm(rebuildCanopy);
	rebuildCanopy(initialDimensions);
});
