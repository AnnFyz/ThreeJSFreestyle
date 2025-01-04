import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
//import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from 'dat.gui'
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { Text } from "troika-three-text";
import Scene_0 from "./scene_0";
import Scene_1 from "./scene_1";

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.1, 2, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const buttons: Button[] = [];
const mouse = new THREE.Vector2();

// Scene setup
let activeScene = new Scene_0(camera, renderer, raycaster);

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

// Interactions
// UI Interactions

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

  // toggles `clicked` property for only the Pickable closest to the camera
  if (intersects.length) {
    console.log("was clicked" + (intersects[0].object as Button).clicked);
    (intersects[0].object as Button).clicked = !(intersects[0].object as Button).clicked;
    switchPopAnimation();
  }
});

// Troika text
const troikaText = new Text();
activeScene.add(troikaText);

// Set properties to configure:
troikaText.text =
  "The puppy's mother was kidnapped\n by an evil cat wizard,\n your task is to help the puppy on his way\n to find his mother";
troikaText.fontSize = 0.1;
troikaText.font = "public/fonts/Lato/Lato-Italic.ttf";
troikaText.position.set(1, 0.2, 0);
troikaText.rotation.y = -Math.PI * 0.1;
troikaText.color = 0xffffff;

// Update the rendering:
troikaText.sync();

//Text
let textScale = 0.1;
let textOffset = 3;
let textGeo: TextGeometry;
const loader = new FontLoader();
loader.load("fonts/Play_Regular.json", function (font) {
  textGeo = new TextGeometry("Welcome to the magic world \n of the Adventure Pup !", {
    font: font,
    size: 1,
    height: 0.25,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.125,
    bevelSize: 0.025,
    bevelOffset: 0,
    bevelSegments: 4,
  });
  textGeo.computeBoundingBox();
  const textMesh = new THREE.Mesh(textGeo, new THREE.MeshToonMaterial({ color: 0x3f54ff }));
  if (textGeo.boundingBox != null) {
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) * textScale;
    textMesh.position.x = centerOffset * textOffset;
    textMesh.position.y = 2;
    textMesh.position.z = 0;

    textMesh.rotation.x = 0;
    textMesh.rotation.y = Math.PI * 0.1;
    textMesh.scale.set(textScale, textScale, textScale);
  }
  activeScene.add(textMesh);
});

// Meshes loading
new GLTFLoader().load("models/Button_1.glb", (gltf) => {
  const buttonMesh = gltf.scene.getObjectByName("Button") as THREE.Mesh;
  const button = new Button(buttonMesh.geometry, new THREE.MeshToonMaterial({ color: 0x3f54ff }), new THREE.Color(0x0088ff));
  button.setScale(0.3, 0.3, 0.3);
  button.setPosition(-1, 1, -0.15);
  console.log(button);
  // @ts-ignore
  buttons.push(button);
  activeScene.add(button);
});

// Lights
const light = new THREE.PointLight(0xffffff, 500);
light.position.set(10, 10, 10);
activeScene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
activeScene.add(ambientLight);

// Animations
let mixer: THREE.AnimationMixer;
let animationActions: { [key: string]: THREE.AnimationAction } = {};
let activeAction: THREE.AnimationAction;

async function loadPup() {
  const scalar = 0.5;
  const loader = new GLTFLoader();
  const [idle, jump, landing] = await Promise.all([
    loader.loadAsync("models/pop_skin_idle.glb"),
    loader.loadAsync("models/pop_jumping.glb"),
    loader.loadAsync("models/pop_landing.glb"),
  ]);

  const popMesh = idle.scene.getObjectByName("Pop") as THREE.Mesh;
  const popTexture = new THREE.TextureLoader().load("img/pup_texture_1.png");
  popTexture.premultiplyAlpha = false;
  popTexture.magFilter = THREE.NearestFilter;
  popTexture.minFilter = THREE.NearestFilter;
  popTexture.flipY = false;
  const toonMaterial = new THREE.MeshToonMaterial();
  toonMaterial.map = popTexture;
  //toonMaterial.color = new THREE.Color(0x3f54ff);
  popMesh.material = toonMaterial;
  mixer = new THREE.AnimationMixer(idle.scene);
  animationActions["idle"] = mixer.clipAction(idle.animations[1]);
  animationActions["jump"] = mixer.clipAction(jump.animations[0]);
  animationActions["landing"] = mixer.clipAction(landing.animations[0]);
  activeAction = animationActions["landing"];
  activeAction.play();
  activeAction.setLoop(THREE.LoopOnce, 1);
  activeAction.clampWhenFinished = true;
  mixer.addEventListener("finished", function () {
    activeAction.fadeOut(0.5);
    animationActions["idle"].reset().fadeIn(0.25).play();
    activeAction = animationActions["idle"];
    console.log("idle again");
  });

  activeScene.add(idle.scene);
  idle.scene.scale.multiplyScalar(scalar);
  const plattform = jump.scene.getObjectByName("Plattform") as THREE.Mesh;
  plattform.scale.multiplyScalar(scalar);
  plattform.position.set(0, 0, -0.1);
  activeScene.add(plattform);
}
await loadPup();

function switchPopAnimation() {
  // if (activeAction != animationActions["jump"]) {
  activeAction.fadeOut(0.5);
  animationActions["jump"].reset().fadeIn(0.25).play();
  activeAction = animationActions["jump"];
  activeAction.setLoop(THREE.LoopOnce, 1);
  // } else {
  //   activeAction.fadeOut(0.5);
  //   animationActions["idle"].reset().fadeIn(0.25).play();
  //   activeAction = animationActions["idle"];
  // }
  //activeAction.play();
}

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();

  controls.update();

  mixer.update(delta);

  renderer.render(activeScene, camera);

  stats.update();

  buttons.forEach((p) => {
    p.update(delta, clock);
  });
}

animate();
