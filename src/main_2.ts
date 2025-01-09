import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import Scene_0 from "./scene_0";
import Scene_1 from "./scene_1";

//Modules to implement outline pass
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
//Modules below are regarded to shader
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 2, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// -- shader effect
// - composer
const composer = new EffectComposer(renderer);
// Scene setup
const scenes = {
  FirstScene: "FirstScene",
  SecondScene: "SecondScene",
  None: "None",
};
let currentScene = scenes.FirstScene;

//let scene_1 = new Scene_1(camera, renderer, raycaster, mouse, composer);
let scene_0 = new Scene_0(camera, renderer, raycaster, mouse);

//scene_1.init();
scene_0.init();
//await scene_1.loadAssync();
await scene_0.loadAssync();

document.addEventListener("StartNewScene", () => {
  currentScene = scenes.SecondScene;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  // if (currentScene == scenes.FirstScene) {
  //   scene_1.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  // }
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
//document.body.appendChild(stats.dom);

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  renderer.clearColor();
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  scene_0.updateLoop(delta, clock);
  renderer.render(scene_0, camera);

  // if (currentScene == scenes.FirstScene) {
  //   scene_1.animate(delta, clock);
  //   renderer.render(scene_1, camera);
  // } else if (currentScene == scenes.SecondScene) {
  //   scene_0.animate(delta, clock);
  //   renderer.render(scene_0, camera);
  // }
  controls.update();

  stats.update();

  composer.render();
}

animate();
