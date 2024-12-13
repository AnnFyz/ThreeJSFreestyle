import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from 'dat.gui'
import Button from "./button";

// Scene setup
const scene = new THREE.Scene();

const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

new RGBELoader().load("img/venice_sunset_1k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
  scene.backgroundBlurriness = 1;
});

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 2, 6);

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

// UI
const gui = new GUI();

const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "x", -10, 10);
cameraFolder.add(camera.position, "y", -10, 10);
cameraFolder.add(camera.position, "z", -10, 10);
cameraFolder.add(camera, "fov", 0, 180, 0.01).onChange(() => {
  camera.updateProjectionMatrix();
});
cameraFolder.add(camera, "aspect", 0.00001, 10).onChange(() => {
  camera.updateProjectionMatrix();
});
cameraFolder.add(camera, "near", 0.01, 10).onChange(() => {
  camera.updateProjectionMatrix();
});
cameraFolder.add(camera, "far", 0.01, 10).onChange(() => {
  camera.updateProjectionMatrix();
});
cameraFolder.open();

// Interactions
// UI Interactions

const raycaster = new THREE.Raycaster();
const buttons: Button[] = [];
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("mousemove", (e) => {
  const intersects = raycaster.intersectObjects(buttons, false);
  mouse.set((e.clientX / renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / renderer.domElement.clientHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);

  buttons.forEach((p) => (p.hovered = false));
  if (intersects.length) {
    (intersects[0].object as Button).hovered = true;
  }
});

renderer.domElement.addEventListener("pointerdown", (e) => {
  mouse.set((e.clientX / renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / renderer.domElement.clientHeight) * 2 + 1);
  const intersects = raycaster.intersectObjects(buttons, false);
  raycaster.setFromCamera(mouse, camera);

  //   // toggles `clicked` property for only the Pickable closest to the camera
  intersects.length && ((intersects[0].object as Button).clicked = !(intersects[0].object as Button).clicked);

  //   // toggles `clicked` property for all overlapping Pickables detected by the raycaster at the same time
  //   // intersects.forEach((i) => {
  //   //   (i.object as Button).clicked = !(i.object as Button).clicked;
  //   // });
  if (intersects.length) console.log("was clicked" + (intersects[0].object as Button).clicked);
});

// Meshes loading
new GLTFLoader().load("models/Button_1.glb", (gltf) => {
  const buttonMesh = gltf.scene.getObjectByName("Button") as THREE.Mesh;
  const button = new Button(buttonMesh.geometry, new THREE.MeshStandardMaterial({ color: 0x888888 }), new THREE.Color(0x0088ff));
  button.position.set(0, 1.5, -0.15);

  button.setScale(0.3, 0.3, 0.3);
  console.log(button);
  // @ts-ignore
  buttons.push(button);
  scene.add(button);
});

// Animations
let mixer: THREE.AnimationMixer;
let animationActions: { [key: string]: THREE.AnimationAction } = {};
let activeAction: THREE.AnimationAction;

async function loadPup() {
  const loader = new GLTFLoader();
  const [idle, exitmentIdle] = await Promise.all([
    loader.loadAsync("models/pop_skin_idle_1.glb"),
    loader.loadAsync("models/pop_skin_exitment_idle_1.glb"),
    loader.loadAsync("models/eve@run.glb"),
  ]);

  mixer = new THREE.AnimationMixer(idle.scene);

  //mixer.clipAction(idle.animations[2]).play();

  animationActions["idle"] = mixer.clipAction(idle.animations[2]);
  animationActions["exitmentIdle"] = mixer.clipAction(exitmentIdle.animations[0]);

  // animationActions["exitmentIdle"].play();
  // activeAction = animationActions["exitmentIdle"];

  animationActions["idle"].play();
  activeAction = animationActions["idle"];

  scene.add(idle.scene);
  idle.scene.scale.multiplyScalar(0.5);
  console.log(idle);
}
await loadPup();

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  controls.update();

  mixer.update(delta);

  renderer.render(scene, camera);

  stats.update();

  buttons.forEach((p) => {
    p.update(delta);
  });
}

animate();
