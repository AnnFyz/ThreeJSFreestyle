import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

export default class Scene_1 extends THREE.Scene {
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
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: false,
    };
    gridHelper.visible = isGridVisible.switch;
    this.add(gridHelper);

    const axesHelper = new THREE.AxesHelper( 5 );
    this.add( axesHelper );
    axesHelper.visible = false;

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

    //cameraFolder.open();
  }

  createBackground() {
    const environmentTexture = new THREE.TextureLoader().load("scene_1/img/Background_scene_1.psd.png");
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
    const platformTexture = new THREE.TextureLoader().load(
      "scene_1/img/platform_1/Platform_Dynamic_1_2_blend_Material.001_AlbedoTransparency.png"
    );
    platformTexture.premultiplyAlpha = false;
    platformTexture.magFilter = THREE.NearestFilter;
    platformTexture.minFilter = THREE.NearestFilter;
    platformTexture.flipY = false;

    new GLTFLoader().load("scene_1/models/Platforms.glb", (gltf) => {
      const buttonMesh = gltf.scene.getObjectByName("platform_1") as THREE.Mesh;
      const button = new Button(
        buttonMesh.geometry,
        new THREE.MeshToonMaterial({ color: 0xffffff }),
        new THREE.Color(0x000000),
        platformTexture
      );
      button.setScale(1, 1, 1);
      //button.setPosition(-1, 1, -0.15);
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
        //this.switchPopAnimation();
      }
    });
  }

  // loading pop model and animations
  async loadAssync() {}

  // update loop
  animate(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });

    this.mixer.update(delta);
  }
}