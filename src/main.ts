import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/addons/libs/stats.module.js";

const scene = new THREE.Scene();

const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

new RGBELoader().load("img/venice_sunset_1k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
  scene.backgroundBlurriness = 1;
});

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 1, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.75, 0);

const stats = new Stats();
document.body.appendChild(stats.dom);

let mixer: THREE.AnimationMixer;
let animationActions: { [key: string]: THREE.AnimationAction } = {};
let activeAction: THREE.AnimationAction;

async function loadEve() {
  const loader = new GLTFLoader();
  // const [eve, idle, run] = await Promise.all([
  //   loader.loadAsync("models/pop_skin_walk_1.glb"),
  //   loader.loadAsync("models/eve@idle.glb"),
  //   loader.loadAsync("models/eve@run.glb"),
  // ]);
  const [idle] = await Promise.all([
    loader.loadAsync("models/pop_skin_walk_1.glb"),
    loader.loadAsync("models/eve@idle.glb"),
    loader.loadAsync("models/eve@run.glb"),
  ]);

  mixer = new THREE.AnimationMixer(idle.scene);

  mixer.clipAction(idle.animations[2]).play();

  animationActions["idle"] = mixer.clipAction(idle.animations[2]);
  // animationActions["walk"] = mixer.clipAction(eve.animations[0]);
  // animationActions["run"] = mixer.clipAction(run.animations[0]);

  animationActions["idle"].play();
  activeAction = animationActions["idle"];

  scene.add(idle.scene);
  idle.scene.scale.multiplyScalar(0.5);
}
await loadEve();

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  controls.update();

  mixer.update(delta);

  renderer.render(scene, camera);

  stats.update();
}

animate();
