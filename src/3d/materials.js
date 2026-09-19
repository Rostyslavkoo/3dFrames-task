import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadRepeatingTexture(path) {
	const texture = textureLoader.load(path);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return texture;
}

export function createMaterials() {
	const base = import.meta.env.BASE_URL;
	const woodMap = loadRepeatingTexture(`${base}assets/textures/texture_wood.jpg`);
	const woodNormalMap = loadRepeatingTexture(`${base}assets/textures/texture_wood_normal.jpg`);
	woodMap.colorSpace = THREE.SRGBColorSpace;

	const roofMap = loadRepeatingTexture(`${base}assets/textures/roof_texture.jpg`);
	const roofNormalMap = loadRepeatingTexture(`${base}assets/textures/roof_texture_normal_map.jpg`);
	roofMap.colorSpace = THREE.SRGBColorSpace;

	return {
		wood: new THREE.MeshStandardMaterial({
			map: woodMap,
			normalMap: woodNormalMap,
			roughness: 0.5,
			metalness: 0,
		}),
		roof: new THREE.MeshStandardMaterial({
			map: roofMap,
			normalMap: roofNormalMap,
			roughness: 0.72,
			metalness: 0,
		}),
		aluminium: new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			roughness: 0.27,
			metalness: 1,
		}),
	};
}
