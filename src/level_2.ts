import * as THREE from "three";
import "./style.css";
//import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

export default class Level_2 {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  raycaster: THREE.Raycaster;
  buttons: Button[] = [];
  mouse: THREE.Vector2;
  ambientLight: THREE.AmbientLight;
  pointLight: THREE.PointLight;
  outlinePass: any;
  textMesh = new THREE.Mesh();
  cube = new THREE.Mesh();
  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.pointLight = new THREE.PointLight(0xffffff, 500);
    this.scene.background = new THREE.Color(0x654321);
    this.init();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x123456 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  init() {
    //this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    this.createButton();
    this.createTextMesh();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial({ wireframe: true });

    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: true,
    };
    gridHelper.visible = isGridVisible.switch;
    this.scene.add(gridHelper);

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
    this.scene.environment = environmentTexture;
    this.scene.background = environmentTexture;
  }

  createLight() {
    const light = new THREE.PointLight(0xffffff, 500);
    light.position.set(10, 10, 10);
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambientLight);
  }

  setOutlines(outlinePass: OutlinePass) {
    this.outlinePass = outlinePass;
  }

  createTextMesh() {
    let textScale = 0.1;
    let textOffset = 3;
    let textGeo: TextGeometry;
    let textMesh = this.textMesh;
    let activeScene = this.scene;
    let outlinePass = this.outlinePass;
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
      //outlinePass.selectedObjects.push(textMesh);
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
      this.scene.add(button);
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
      }
    });
  }

  // update loop
  updateLoop(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });
  }
}
  
