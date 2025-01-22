import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import Level_1 from "./level_1";
import Level_2 from "./level_2";
import Level_3 from "./level_3";
import Level_4 from "./level_4";

//Project setup
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 2, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Scene setup
const scenes = {
  FirstScene: "FirstScene",
  SecondScene: "SecondScene",
  ThirdScene: "ThirdScene",
  None: "None",
};

const level_1 = new Level_1(camera, renderer, raycaster, mouse);
const level_2 = new Level_2(camera, renderer, raycaster, mouse);
const level_3 = new Level_3(camera, renderer, raycaster, mouse);
const level_4 = new Level_4(camera, renderer, raycaster, mouse);
await level_1.loadAssync();
await level_3.loadAssync();
await level_4.loadAssync();

// Scene setup
const levels = [level_1, level_2, level_3, level_4];
let currentLevelIndex = 3;
levels[currentLevelIndex].setupButtonInteractions();
//let currentScene = scenes.ThirdScene;
//let activeScene = level_3.scene;

document.onkeydown = function (e) {
  e = e || window.event;
  if (e.shiftKey) {
    levels[currentLevelIndex].deactivateAllTexts();
    currentLevelIndex = currentLevelIndex < levels.length-1? ++currentLevelIndex : 0;
    levels[currentLevelIndex].setupButtonInteractions();
    updateCamerandRenderer();
  }
};

document.addEventListener("StartNewScene", () => {
  levels[currentLevelIndex].deactivateAllTexts();
  currentLevelIndex = currentLevelIndex < levels.length-1? ++currentLevelIndex : 0;
  levels[currentLevelIndex].setupButtonInteractions();
  updateCamerandRenderer();
});

window.addEventListener("resize", () => {
  updateCamerandRenderer();
});

function updateCamerandRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

    levels[currentLevelIndex].composer.setSize(window.innerWidth, window.innerHeight);
    levels[currentLevelIndex].effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
}

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
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  renderer.render(levels[currentLevelIndex].scene, camera);

  levels[currentLevelIndex].composer.render();
  levels[currentLevelIndex].updateLoop(delta, clock);
 
  controls.update();
  stats.update();
}


animate();
