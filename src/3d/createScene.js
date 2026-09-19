import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createScene(canvas) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xdfe7ec);
	scene.add(new THREE.AxesHelper(5));

	const camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		100,
	);
	camera.position.set(6, 5, 8);

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	const ambient = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambient);

	const sun = new THREE.DirectionalLight(0xffffff, 1.2);
	sun.castShadow = true;
	sun.position.set(8, 10, 6);
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.left = -10;
	sun.shadow.camera.right = 10;
	sun.shadow.camera.top = 10;
	sun.shadow.camera.bottom = -10;
	scene.add(sun);

	const floor = new THREE.Mesh(
		new THREE.PlaneGeometry(40, 40),
		new THREE.MeshStandardMaterial({ color: 0xb9c4b0 }),
	);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);
	
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	function renderLoop() {
		controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(renderLoop);
	}
	renderLoop();
	return { scene, camera, renderer };
}
