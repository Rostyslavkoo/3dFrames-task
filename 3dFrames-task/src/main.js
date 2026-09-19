import './style.css';
import * as THREE from 'three';
import { createScene } from './3d/createScene';
import { loadAssets } from './3d/assetLoad';

const canvas = document.getElementById('scene-canvas');
const { scene } = createScene(canvas);

loadAssets().then(assets => {
	const material = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
	const beam = new THREE.Mesh(assets.perimeterBeam, material);
	scene.add(beam);
});
