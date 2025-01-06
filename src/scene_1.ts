import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import Button from "./button";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

//Modules to implement outline pass
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
//Modules below are regarded to shader
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
//dithering
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


export default class Scene_1 extends THREE.Scene {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  raycaster: THREE.Raycaster;
  buttons: Button[] = [];
  mouse: THREE.Vector2;
  ambientLight: THREE.AmbientLight;

  //animations
  mixer = new THREE.AnimationMixer(this);
  animationActions: { [key: string]: THREE.AnimationAction } = {};
  activeAction: THREE.AnimationAction = this.animationActions[""];

  //shader effect
  composer : EffectComposer;
  renderPass : RenderPass;
  outlinePass: OutlinePass;
  effectFXAA: ShaderPass;

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2, composer : EffectComposer) {
    super();
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.createGridCameraUI();
    this.createBackground();
    this.createButton();

    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 4);
    this.add(this.ambientLight);

    //outline
    this.composer = composer;
    this.renderPass = new RenderPass( this, this.camera );
    this.composer.addPass( this.renderPass );
    this.outlinePass= new OutlinePass(
          new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
          this,
          camera);
          // -- parameter config
          this.outlinePass.edgeStrength = 3.0;
          this.outlinePass.edgeGlow = 0;
          this.outlinePass.edgeThickness = 3.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
    this.outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object
    composer.addPass(this.outlinePass);

    //shader
    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.effectFXAA.renderToScreen = true;
    composer.addPass(this.effectFXAA);
    
  
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: false,
    };
    gridHelper.visible = isGridVisible.switch;
    this.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    this.add(axesHelper);
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

    gui.hide();
    //cameraFolder.open();
  }

  createBackground() {
    const environmentTexture = new THREE.TextureLoader().load("scene_1/img/Background_scene_1.psd.png");
    this.environment = environmentTexture;
    this.background = environmentTexture;
  }

  setLightIntensity(intensity : number) {
  this.ambientLight.intensity = intensity;
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
      "scene_1/img/Platform_1_3.png"
    );
    platformTexture.premultiplyAlpha = false;
    platformTexture.magFilter = THREE.NearestFilter;
    platformTexture.minFilter = THREE.NearestFilter;
    platformTexture.flipY = false;
    //platformTexture.map.premultiplyAlpha = false;
    //platformTexture.map.needsUpdate = true;

    new GLTFLoader().load("scene_1/models/Platform_1_3.glb", (gltf) => {
      const buttonMesh = gltf.scene.getObjectByName("platform_1") as THREE.Mesh;
      const button = new Button(
        buttonMesh.geometry,
        new THREE.MeshToonMaterial({ color: 0xffffff}),
        new THREE.Color(0xeeeeee),
        platformTexture
      );
      button.setScale(1, 1, 1);
      //button.setPosition(-1, 1, -0.15);
      console.log(button);
      // @ts-ignore
      this.buttons.push(button);
      this.add(button);
      this.add(button.wireframe);
    });


    this.renderer.domElement.addEventListener("mousemove", (e) => {
      const intersects = this.raycaster.intersectObjects(this.buttons, false);
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);

      this.buttons.forEach((p) => {(p.hovered = false); this.outlinePass.selectedObjects = [];} );
      if (intersects.length) {
        (intersects[0].object as Button).hovered = true;
         this.outlinePass.selectedObjects[0] = intersects[0].object;
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
        document.querySelector(".intro")?.classList.add('hidden');
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