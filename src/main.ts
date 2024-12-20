import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from 'dat.gui'
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { Text } from "troika-three-text";

// Scene setup
const scene = new THREE.Scene();

const gridHelper = new THREE.GridHelper(100, 100);
let isGridVisible = {
  switch: false,
};
gridHelper.visible = isGridVisible.switch;
scene.add(gridHelper);
const gridGui = new GUI();
const gridGuiFolder = gridGui
  .add(isGridVisible, "switch")
  .name("grid visibility")
  .onChange(() => {
    gridHelper.visible = isGridVisible.switch;
  });

// new RGBELoader().load("img/venice_sunset_1k.hdr", (texture) => {
//   texture.mapping = THREE.EquirectangularReflectionMapping;
//   scene.environment = texture;
//   scene.background = texture;
//   scene.backgroundBlurriness = 1;
// });

//const environmentTexture = new THREE.CubeTextureLoader().load(["img/Background_1.png"]);
const environmentTexture = new THREE.TextureLoader().load("img/Background_1.png");
scene.environment = environmentTexture;
scene.background = environmentTexture;

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
cameraFolder
  .add(isGridVisible, "switch")
  .name("grid visibility")
  .onChange(() => {
    gridHelper.visible = isGridVisible.switch;
  });
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
}); //gridHelper.visible

//cameraFolder.open();

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

  // toggles `clicked` property for only the Pickable closest to the camera
  if (intersects.length) {
    console.log("was clicked" + (intersects[0].object as Button).clicked);
    (intersects[0].object as Button).clicked = !(intersects[0].object as Button).clicked;
    switchPopAnimation();
  }
});

// Troika text
const troikaText = new Text();
scene.add(troikaText);

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
  scene.add(textMesh);
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
  scene.add(button);
});

// Lights
const light = new THREE.PointLight(0xffffff, 500);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

// Animations
let mixer: THREE.AnimationMixer;
let animationActions: { [key: string]: THREE.AnimationAction } = {};
let activeAction: THREE.AnimationAction;

async function loadPup() {
  const loader = new GLTFLoader();
  const [idle, exitmentIdle] = await Promise.all([
    loader.loadAsync("models/pop_skin_idle_1.glb"),
    loader.loadAsync("models/pop_skin_exitment_idle_1.glb"),
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
  animationActions["exitmentIdle"] = mixer.clipAction(exitmentIdle.animations[0]);
  activeAction = animationActions["idle"];
  activeAction.play();

  scene.add(idle.scene);
  idle.scene.scale.multiplyScalar(0.5);
}
await loadPup();

function switchPopAnimation() {
  if (activeAction != animationActions["exitmentIdle"]) {
    activeAction.fadeOut(0.5);
    animationActions["exitmentIdle"].reset().fadeIn(0.25).play();
    activeAction = animationActions["exitmentIdle"];
    console.log("exitmentIdle");
  } else {
    activeAction.fadeOut(0.5);
    animationActions["idle"].reset().fadeIn(0.25).play();
    activeAction = animationActions["idle"];
    console.log("idle");
  }
  activeAction.play();
}

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
    p.update(delta, clock);
  });
}

animate();
