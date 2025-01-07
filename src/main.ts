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
let activeScene = new Scene_1(camera, renderer, raycaster, mouse, composer);
await activeScene.loadAssync();

// // - render pass
// const renderPass = new RenderPass( activeScene, camera );
// composer.addPass( renderPass );

// const outlinePass= new OutlinePass(
//       new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
//       activeScene,
//       camera);

// // -- parameter config
// outlinePass.edgeStrength = 3.0;
// outlinePass.edgeGlow = 0;
// outlinePass.edgeThickness = 3.0;
// outlinePass.pulsePeriod = 0;
// outlinePass.usePatternTexture = false; // patter texture for an object mesh
// outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
// outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object
// composer.addPass(outlinePass);

// //shader
// const effectFXAA = new ShaderPass(FXAAShader);
// effectFXAA.uniforms["resolution"].value.set(
//   1 / window.innerWidth,
//   1 / window.innerHeight
// );
// effectFXAA.renderToScreen = true;
// composer.addPass(effectFXAA);

// activeScene.buttons.forEach(button => {
//   button.setOutlines(outlinePass);
// });
//outlinePass.selectedObjects = activeScene.buttons


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

    activeScene.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
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
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  activeScene.animate(delta, clock);

  controls.update();

  renderer.render(activeScene, camera);

  stats.update();

  composer.render();

}

animate();
