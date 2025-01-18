import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import Level_1 from "./level_1";
import Level_2 from "./level_2";


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
  None: "None",
};


const level_1 = new Level_1(camera, renderer, raycaster, mouse);
const level_2 = new Level_2(camera, renderer, raycaster, mouse);
await level_1.loadAssync();
let currentScene = scenes.FirstScene;
let activeScene = level_1.scene;

document.onkeydown = function (e) {
  e = e || window.event;
  if (e.shiftKey) {
    currentScene = scenes.SecondScene;
    level_1.deactivateAllTexts();
    activeScene = level_2.scene;
    level_2.setupButtonInteractions();
    updateCamerandRenderer();
  }
};

document.addEventListener("StartNewScene", () => {
  currentScene = scenes.SecondScene;
});

window.addEventListener("resize", () => {
  updateCamerandRenderer();
});

function updateCamerandRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (currentScene == scenes.FirstScene) {
    level_1.composer.setSize(window.innerWidth, window.innerHeight);
    level_1.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  } else if (currentScene == scenes.SecondScene) {
    level_2.composer.setSize(window.innerWidth, window.innerHeight);
    level_2.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  }
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

  renderer.render(activeScene, camera);

  if (currentScene == scenes.FirstScene) {
    level_1.composer.render();
    level_1.updateLoop(delta, clock);
  } else if (currentScene == scenes.SecondScene) {
    level_2.composer.render();
    level_2.updateLoop(delta, clock);
  }

  controls.update();
  stats.update();
}


animate();
