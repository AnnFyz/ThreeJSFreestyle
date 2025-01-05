import "./style.css";
import * as THREE from "three";
//import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
//import { Text } from "troika-three-text/dist/troika-three-text.umd.min.js";
//import Text from "troika-three-text/dist/troika-three-text.umd.min.js";
import { Text } from "troika-three-text";

export default class Scene_0 extends THREE.Scene {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  raycaster: THREE.Raycaster;
  buttons: Button[] = [];
  mouse: THREE.Vector2;
  mixer = new THREE.AnimationMixer(this);
  animationActions: { [key: string]: THREE.AnimationAction } = {};
  activeAction: THREE.AnimationAction = this.animationActions[""];
  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    super();
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    this.createButton();
    this.createTextMesh();
    this.createTroikaText();
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: true,
    };
    gridHelper.visible = isGridVisible.switch;
    this.add(gridHelper);

    // UI
    const gui = new GUI();
    const cameraFolder = gui.addFolder("Camera");
    cameraFolder
      .add(isGridVisible, "switch")
      .name("grid visibility")
      .onChange(() => {
        gridHelper.visible = isGridVisible.switch;
      });
    cameraFolder.add(this.camera.position, "x", -10, 10);
    cameraFolder.add(this.camera.position, "y", -10, 10);
    cameraFolder.add(this.camera.position, "z", -10, 10);
    cameraFolder.add(this.camera, "fov", 0, 180, 0.01).onChange(() => {
      this.camera.updateProjectionMatrix();
    });
    cameraFolder.add(this.camera, "aspect", 0.00001, 10).onChange(() => {
      this.camera.updateProjectionMatrix();
    });
    cameraFolder.add(this.camera, "near", 0.01, 10).onChange(() => {
      this.camera.updateProjectionMatrix();
    });
    cameraFolder.add(this.camera, "far", 0.01, 10).onChange(() => {
      this.camera.updateProjectionMatrix();
    });

    cameraFolder.open();
  }

  createBackground() {
    const environmentTexture = new THREE.TextureLoader().load("img/Background_1.png");
    this.environment = environmentTexture;
    this.background = environmentTexture;
  }

  createLight() {
    const light = new THREE.PointLight(0xffffff, 500);
    light.position.set(10, 10, 10);
    this.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.add(ambientLight);
  }

  createTextMesh() {
    let textScale = 0.1;
    let textOffset = 3;
    let textGeo: TextGeometry;
    let textMesh: THREE.Mesh;
    let activeScene = this;
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
      textMesh = new THREE.Mesh(textGeo, new THREE.MeshToonMaterial({ color: 0x3f54ff }));
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
  }

  createButton() {
    new GLTFLoader().load("models/Button_1.glb", (gltf) => {
      const buttonMesh = gltf.scene.getObjectByName("Button") as THREE.Mesh;
      const button = new Button(buttonMesh.geometry, new THREE.MeshToonMaterial({ color: 0x3f54ff }), new THREE.Color(0x0088ff));
      button.setScale(0.3, 0.3, 0.3);
      button.setPosition(-1, 1, -0.15);
      console.log(button);
      // @ts-ignore
      this.buttons.push(button);
      this.add(button);
    });

    this.renderer.domElement.addEventListener("mousemove", (e) => {
      const intersects = this.raycaster.intersectObjects(this.buttons, false);
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);

      this.buttons.forEach((p) => (p.hovered = false));
      if (intersects.length) {
        (intersects[0].object as Button).hovered = true;
      }
    });

    this.renderer.domElement.addEventListener("pointerdown", (e) => {
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      const intersects = this.raycaster.intersectObjects(this.buttons, false);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // toggles `clicked` property for only the Pickable closest to the camera
      if (intersects.length) {
        console.log("was clicked" + (intersects[0].object as Button).clicked);
        (intersects[0].object as Button).clicked = !(intersects[0].object as Button).clicked;
        this.switchPopAnimation();
      }
    });
  }

  // loading pop model and animations
  async loadAssync() {
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
    this.mixer = new THREE.AnimationMixer(idle.scene);
    this.animationActions["idle"] = this.mixer.clipAction(idle.animations[1]);
    this.animationActions["jump"] = this.mixer.clipAction(jump.animations[0]);
    this.animationActions["landing"] = this.mixer.clipAction(landing.animations[0]);
    this.activeAction = this.animationActions["landing"];
    this.activeAction.play();
    this.activeAction.setLoop(THREE.LoopOnce, 1);
    this.activeAction.clampWhenFinished = true;
    this.mixer.addEventListener("finished", () => {
      this.activeAction.fadeOut(0.5);
      this.animationActions["idle"].reset().fadeIn(0.25).play();
      this.activeAction = this.animationActions["idle"];
      console.log("idle again");
    });

    this.add(idle.scene);
    idle.scene.scale.multiplyScalar(scalar);
    const plattform = jump.scene.getObjectByName("Plattform") as THREE.Mesh;
    plattform.scale.multiplyScalar(scalar);
    plattform.position.set(0, 0, -0.1);
    this.add(plattform);
  }

  switchPopAnimation() {
    this.activeAction.fadeOut(0.5);
    this.animationActions["jump"].reset().fadeIn(0.25).play();
    this.activeAction = this.animationActions["jump"];
    this.activeAction.setLoop(THREE.LoopOnce, 1);
  }

  createTroikaText() {
    // Troika text
    const troikaText = new Text();
    this.add(troikaText);

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
  }

  // update loop
  animate(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });

    this.mixer.update(delta);
  }
}
