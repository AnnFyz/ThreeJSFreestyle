import * as THREE from "three";
import "./style.css";
//import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
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

export default class Level_2 {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  interactableObj: any[] = [];
  mouse: THREE.Vector2;
  isActiveScene = false;
  //light
  ambientLight = new THREE.AmbientLight(0xffffff, 2);
  pointLight = new THREE.PointLight(0xffffff, 50);
  //Make a pivot
  pivot = new THREE.Object3D();

  textMesh = new THREE.Mesh();
  universalController_parent = new THREE.Mesh();
  universalController_1_1 = new THREE.Mesh();
  universalController_1_2 = new THREE.Mesh();
  universalController_wire_1_1 = new THREE.LineSegments();
  universalController_wire_1_2 = new THREE.LineSegments();
  controller_1_1_texture: any;
  controller_1_2_texture: any;
  //materials
  outlineMaterial = new THREE.ShaderMaterial();

  //shader effect
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  effectFXAA = new ShaderPass(FXAAShader);

  // events
  buttons: Button[] = [];
  mouseClickEvent = {
    FirstClickEvent: false,
    SecondClickEvent: false,
    ThirdClickEvent: false,
    EndClickEvent: false,
  };
  currentMouseClickEvent = this.mouseClickEvent.FirstClickEvent;
  //
  buttonNames = {
    UniversalControllerRight: "UniversalControllerRight",
    UniversalControllerLeft: "UniversalControllerLeft",
    TextMesh: "TextMesh",
    Continue: "Continue",
  };
  event = new Event("StartNewScene");
  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.scene.background = new THREE.Color(0x654321);

    //post processing
    this.renderPass = new RenderPass(this.scene, camera); //THE PROBLEM
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
      this.scene,
      camera
    );

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    this.composer = new EffectComposer(renderer);

    this.init();
  }

  init() {
    //this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    this.createTextMesh("Meta Quest\n          3", 1, this.buttonNames.TextMesh, new THREE.Vector3(0, 1, 0), 0.25);
    this.createOutlines();
    this.createImage();
    this.createControllers(this.buttonNames.UniversalControllerRight, new THREE.Vector3(2, 0, 0));
    this.createControllers(this.buttonNames.UniversalControllerLeft, new THREE.Vector3(-2, 0, 0));
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);
    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: false,
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
    const environmentTexture = new THREE.TextureLoader().load("scene_1/img/Background_scene_1.psd.png");
    this.scene.environment = environmentTexture;
    this.scene.background = environmentTexture;
  }

  createImage() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("scene_2/MetaQuest.png"); // Path to your image
    texture.colorSpace = THREE.SRGBColorSpace;
    // Create the sprite material
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff, // White color, ensuring no color multiplication
      transparent: true,
    });

    // Create the sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2, -2);
    sprite.scale.set(2.2, 1.25, 1);
    // Add the sprite to your scene, etc.
    this.scene.add(sprite);
  }

  createLight() {
    this.pointLight = new THREE.PointLight(0xffffff, 500);
    this.pivot.position.set(10, 10, 10);
    this.pivot.add(this.pointLight);
    this.scene.add(this.pivot);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(this.ambientLight);
  }

  //outline as a postprocessing
  createOutlines() {
    this.composer.addPass(this.renderPass);
    // -- parameter config
    this.outlinePass.edgeStrength = 6.0;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = 4.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
    //this.outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object

    this.composer.addPass(this.outlinePass);
    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);
  }

  //outline as a mesh
  solidify = (mesh: THREE.Mesh) => {
    const THICKNESS = 0.015;
    const geometry = mesh.geometry;
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
          void main() { 
            vec3 newPosition = position + normal  * ${THICKNESS};
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1);
          }
        `,
      fragmentShader: /* glsl */ `
          void main() { 
            gl_FragColor = vec4(0,0,0,1);
          }
        `,

      side: THREE.BackSide,
    });

    const outline = new THREE.Mesh(geometry, this.outlineMaterial);
    //outline.scale.addScalar(1);
    this.scene.add(outline);
  };

  createControllers(name: string, position: THREE.Vector3) {
    this.controller_1_1_texture = new THREE.TextureLoader().load("scene_2/UniversalController_1.png");
    this.controller_1_1_texture.premultiplyAlpha = false;
    this.controller_1_1_texture.magFilter = THREE.NearestFilter;
    this.controller_1_1_texture.minFilter = THREE.NearestFilter;
    this.controller_1_1_texture.flipY = false;

    this.controller_1_2_texture = new THREE.TextureLoader().load("scene_2/UniversalController_2.png");
    this.controller_1_2_texture.premultiplyAlpha = false;
    this.controller_1_2_texture.magFilter = THREE.NearestFilter;
    this.controller_1_2_texture.minFilter = THREE.NearestFilter;
    this.controller_1_2_texture.flipY = false;

    new GLTFLoader().load("scene_2/UniversalController.glb", (gltf) => {
      this.universalController_parent = gltf.scene.getObjectByName("Controller") as THREE.Mesh;
      this.universalController_1_1 = this.universalController_parent.children[1] as THREE.Mesh;
      this.universalController_1_2 = this.universalController_parent.children[0] as THREE.Mesh;

      const button = new Button(
        name,
        this.scene,
        this.universalController_1_2.geometry,
        new THREE.MeshToonMaterial({ color: 0xffffff }),
        new THREE.Color(0xeeeeee),
        true,
        false,
        0.015,
        true,
        this.controller_1_2_texture
      );

      button.setSecondMesh(this.universalController_1_1, this.controller_1_1_texture);
      button.setPosition(position.x, position.y, position.z);
      this.buttons.push(button);
    });
  }

  createTextMesh(text: string, size: number, buttonName: string, position: THREE.Vector3, scale: number) {
    let textGeo: TextGeometry;
    let textMesh = this.textMesh;
    let activeScene = this.scene;
    let buttons = this.buttons;
    const loader = new FontLoader();
    loader.load("fonts/Play_Regular.json", function (font) {
      textGeo = new TextGeometry(text, {
        font: font,
        size: size,
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
      const button = new Button(
        buttonName,
        activeScene,
        textMesh.geometry,
        new THREE.MeshToonMaterial({ color: 0xeae3c4 }),
        new THREE.Color(0xeeeeee),
        false,
        false,
        0.015,
        true
      );
      buttons.push(button);
      button.setScale(scale, scale, scale);
      button.setPosition(position.x, position.y, position.z);
    });
  }

  setupButtonInteractions() {
    this.renderer.domElement.addEventListener("mousemove", (e) => {
      const intersects = this.raycaster.intersectObjects(this.buttons, false);
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);

      this.buttons.forEach((p) => {
        p.hovered = false;
        const index = this.outlinePass.selectedObjects.indexOf(p);
        if (index > -1) {
          // only splice array when item is found
          this.outlinePass.selectedObjects.splice(index, 1); // 2nd parameter means remove one item only
        }
        // actions when the buttons are not hovered
        document.body.style.cursor = "default";
      });

      // actions when the buttons are hovered
      if (intersects.length) {
        (intersects[0].object as Button).hovered = true;
        this.outlinePass.selectedObjects.push(intersects[0].object);
        document.body.style.cursor = "pointer";
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
        (intersects[0].object as Button).clicked = !(intersects[0].object as Button).clicked;
        this.setupButtonOnClick((intersects[0].object as Button).clicked, (intersects[0].object as Button).name);
      }
    });
  }

  setupTextOnClick(buttonClicked: boolean, buttonClass: string) {
    if (!buttonClicked) {
      document.querySelector(buttonClass)?.classList.remove("fade-in-slide");
      document.querySelector(buttonClass)?.classList.add("fade-out");
    } else {
      document.querySelector(buttonClass)?.classList.remove("hidden");
      document.querySelector(buttonClass)?.classList.remove("fade-out");
      document.querySelector(buttonClass)?.classList.add("fade-in-slide");
    }
  }

  setupButtonOnClick(buttonClicked: boolean, name: string) {
    if (name == this.buttonNames.UniversalControllerRight) {
      this.setupTextOnClick(buttonClicked, ".right");
      this.mouseClickEvent.FirstClickEvent = true;
    } else if (name == this.buttonNames.UniversalControllerLeft) {
      this.setupTextOnClick(buttonClicked, ".left");
      this.mouseClickEvent.SecondClickEvent = true;
    } else if (name == this.buttonNames.TextMesh) {
      this.setupTextOnClick(buttonClicked, ".center");
      this.mouseClickEvent.ThirdClickEvent = true;
    }
    this.checkIfAllButtonsAreClicked();
    if (name == this.buttonNames.Continue) {
      this.startNewScene();
    }
  }

  checkIfAllButtonsAreClicked() {
    if (
      this.mouseClickEvent.FirstClickEvent &&
      this.mouseClickEvent.SecondClickEvent &&
      this.mouseClickEvent.ThirdClickEvent &&
      !this.mouseClickEvent.EndClickEvent
    ) {
      this.mouseClickEvent.EndClickEvent = true;
      this.createTextMesh("continue", 2, this.buttonNames.Continue, new THREE.Vector3(0, -0.5, 0), 0.1);
    }
  }

  startNewScene() {
    console.log("Start new scene");
    document.querySelector(".end")?.classList.add("overlay-fade-in");
    document.querySelector(".start")?.classList.remove("overlay-fade-out");
    setTimeout(this.startEvent, 1500);
  }
  startEvent = () => {
    this.deactivateAllTexts();
    document.dispatchEvent(this.event);
    document.querySelector(".end")?.classList.remove("overlay-fade-in");
    document.querySelector(".start")?.classList.add("overlay-fade-out");
  };
  deactivateAllTexts() {
    const texts = document.querySelectorAll(".level_2");
    texts.forEach((text) => {
      text?.classList.add("hidden");
    });
    this.buttons = [];
  }

  // update loop
  updateLoop(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
      p.position.y = Math.sin(clock.getElapsedTime()) * 0.1 + p.defaultPosition.y;
    });
  }
}
  
