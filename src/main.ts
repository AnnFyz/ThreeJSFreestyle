import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import Level_1 from "./level_1";
import Level_2 from "./level_2";

// //Modules to implement outline pass
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
//Modules below are regarded to shader
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

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

let currentScene = scenes.FirstScene;

const level_1 = new Level_1(camera, renderer, raycaster, mouse);
const level_2 = new Level_2(camera, renderer, raycaster, mouse);
await level_1.loadAssync();
let activeScene = level_1.scene;

// -- shader effect scene 1
let renderPass_1 = new RenderPass(level_1.scene, camera); //THE PROBLEM
let outlinePass_1 = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
  level_1.scene,
  camera
);

let effectFXAA_1 = new ShaderPass(FXAAShader);
effectFXAA_1.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
const composer_1 = new EffectComposer(renderer);

// -- shader effect scene 2
let renderPass_2 = new RenderPass(level_2.scene, camera); //THE PROBLEM
let outlinePass_2 = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
  level_2.scene,
  camera
);
let effectFXAA_2 = new ShaderPass(FXAAShader);

effectFXAA_2.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);

const composer_2 = new EffectComposer(renderer);
document.onkeydown = function (e) {
  e = e || window.event;
  if (e.shiftKey) {
    currentScene = scenes.SecondScene;
    activeScene = level_2.scene;
  }
};

document.addEventListener("StartNewScene", () => {
  currentScene = scenes.SecondScene;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer_1.setSize(window.innerWidth, window.innerHeight);

  if (currentScene == scenes.FirstScene) {
    effectFXAA_1.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  } else if (currentScene == scenes.SecondScene) {
    effectFXAA_2.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  }
});

function createOutlines_1() {
  composer_1.addPass(renderPass_1);
  // -- parameter config
  outlinePass_1.edgeStrength = 3.0;
  outlinePass_1.edgeGlow = 0;
  outlinePass_1.edgeThickness = 3.0;
  outlinePass_1.pulsePeriod = 0;
  outlinePass_1.usePatternTexture = false; // patter texture for an object mesh
  outlinePass_1.visibleEdgeColor.set("#ffffff"); // set basic edge color
  outlinePass_1.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object
  composer_1.addPass(outlinePass_1);

  effectFXAA_1.renderToScreen = true;
  composer_1.addPass(effectFXAA_1);
}

function createOutlines_2() {
  composer_2.addPass(renderPass_2);
  // -- parameter config
  outlinePass_2.edgeStrength = 3.0;
  outlinePass_2.edgeGlow = 5;
  outlinePass_2.edgeThickness = 3.0;
  outlinePass_2.pulsePeriod = 0;
  outlinePass_2.usePatternTexture = false; // patter texture for an object mesh
  outlinePass_2.visibleEdgeColor.set("#ffffff"); // set basic edge color
  outlinePass_2.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object
  composer_2.addPass(outlinePass_2);

  effectFXAA_2.renderToScreen = true;
  composer_2.addPass(effectFXAA_2);
}

function addOutlines() {
  outlinePass_1.selectedObjects.push(level_1.popMesh);
  level_1.setOutlines(outlinePass_1);
  level_2.setOutlines(outlinePass_2);
  outlinePass_2.selectedObjects.push(level_2.textMesh);
  outlinePass_2.selectedObjects.push(level_2.cube);
}

createOutlines_1();
createOutlines_2();
addOutlines();

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
    composer_1.render();
    level_1.updateLoop(delta, clock);
  } else if (currentScene == scenes.SecondScene) {
    composer_2.render();
    level_1.updateLoop(delta, clock);
  }
  controls.update();

  stats.update();
}


animate();
