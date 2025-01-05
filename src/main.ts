import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import Scene_0 from "./scene_0";
import Scene_1 from "./scene_1";

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 2, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Scene setup
let activeScene = new Scene_1(camera, renderer, raycaster, mouse);
await activeScene.loadAssync();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.75, 0);
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.1;
controls.minPolarAngle = 0.8;
controls.maxPolarAngle = Math.PI / 2;

const stats = new Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  activeScene.animate(delta, clock);

  controls.update();

  renderer.render(activeScene, camera);

  stats.update();
}

animate();
