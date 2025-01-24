import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import Button from "./button";
//Modules to implement outline pass
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
//Modules below are regarded to shader
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export default class Level_3 {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  buttons: Button[] = [];
  mouse: THREE.Vector2;
  ambientLight: THREE.AmbientLight;
  pointLight: THREE.PointLight;
  //animations
  mixer = new THREE.AnimationMixer(this.scene);
  animationActions: { [key: string]: THREE.AnimationAction } = {};
  activeAction: THREE.AnimationAction = this.animationActions[""];
  idleScene: THREE.Group<THREE.Object3DEventMap>;

  mouseClickEvent = {
    FirstClickEvent: "FirstClickEvent",
    SecondClickEvent: "SecondClickEvent",
    ThirdClickEvent: "ThirdClickEvent",
    None: "None",
  };
  currentMouseClickEvent = this.mouseClickEvent.FirstClickEvent;

  //shader effect
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  effectFXAA = new ShaderPass(FXAAShader);

  outlinePass_2: OutlinePass;

  //materials
  outlineMaterial = new THREE.ShaderMaterial();

  catMeshToonMaterial = new THREE.MeshToonMaterial();
  catMesh = new THREE.Mesh();
  catTexture: any;

  bubbleMeshToonMaterial = new THREE.MeshToonMaterial();
  bubbleMesh = new THREE.Mesh();
  bubbleTexture: any;

  starButton: any;
  //events
  event = new Event("StartNewScene");

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.pointLight = new THREE.PointLight(0xffffff, 500);

    //animation
    this.idleScene = new THREE.Group<THREE.Object3DEventMap>();

    //post processing
    this.renderPass = new RenderPass(this.scene, camera); //THE PROBLEM
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
      this.scene,
      camera
    );

    this.outlinePass_2 = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
      this.scene,
      camera
    );

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    this.composer = new EffectComposer(renderer);

    //
    this.init();
  }

  init() {
    //this.createGridCameraUI();
    this.createBackground();
    this.createStarButton();
    this.createLight();
    this.createOutlines();
    this.createBubbleSpeech();
  }

  //outline as a postprocessing
  createOutlines() {
    this.composer.addPass(this.renderPass);
    // -- parameter config
    this.outlinePass.edgeStrength = 7.0;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = 7.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
    //this.outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object

    this.composer.addPass(this.outlinePass);
    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);
  }

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: true,
    };
    gridHelper.visible = isGridVisible.switch;
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
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
    cameraFolder.open();
  }

  createBackground() {
    const environmentTexture = new THREE.TextureLoader().load("scene_1/img/Background_scene_1.psd.png");
    this.scene.environment = environmentTexture;
    this.scene.background = environmentTexture;
  }

  createLight() {
    this.pointLight.position.set(10, 10, 10);
    this.scene.add(this.ambientLight);
    this.scene.add(this.pointLight);
  }

  setLightIntensity(intensity: number) {
    this.ambientLight.intensity = intensity;
  }

  //here are set all button interactions
  createStarButton() {
    // texture for button as a platform
    const starTexture = new THREE.TextureLoader().load("scene_3/img/star/Star_base.png");
    starTexture.premultiplyAlpha = false;
    starTexture.magFilter = THREE.NearestFilter;
    starTexture.minFilter = THREE.NearestFilter;
    starTexture.flipY = false;

    // create button as a platform
    new GLTFLoader().load("scene_3/models/Star.glb", (gltf) => {
      const starMesh = gltf.scene.getObjectByName("Star") as THREE.Mesh;
      this.starButton = new Button(
        "Star",
        this.scene,
        starMesh.geometry,
        new THREE.MeshToonMaterial({ color: 0xffff00 }),
        new THREE.Color(0xeeeeee),
        false,
        true,
        0.045,
        false,
        starTexture
      );
      this.starButton.setScale(0.35, 0.35, 0.35);
      this.starButton.setPosition(2, 0, 1);
      this.buttons.push(this.starButton);
      this.scene.add(this.starButton);
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

      //if there no mouse raycast on the button, don't outline it
      this.buttons.forEach((p) => {
        p.hovered = false;
        const index = this.outlinePass.selectedObjects.indexOf(p);
        if (index > -1) {
          // only splice array when item is found
          this.outlinePass.selectedObjects.splice(index, 1); // 2nd parameter means remove one item only
        }
        document.body.style.cursor = "default";
      });
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
        //checks the click's number
        this.checkButtonInteractions();
      }
    });
  }

  checkButtonInteractions() {
    if (this.currentMouseClickEvent == this.mouseClickEvent.FirstClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.SecondClickEvent;
      this.applyTextureOnMaterial(
        this.bubbleMesh,
        this.bubbleMeshToonMaterial,
        this.bubbleTexture,
        "scene_3/img/bubbleSpeech/BubbleSpeech_2.png"
      );
      this.applyTextureOnMaterial(this.catMesh, this.catMeshToonMaterial, this.catTexture, "scene_3/img/cat/Face_BaseColor_neutral.png");
    } else if (this.currentMouseClickEvent == this.mouseClickEvent.SecondClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.ThirdClickEvent;
      this.applyTextureOnMaterial(
        this.bubbleMesh,
        this.bubbleMeshToonMaterial,
        this.bubbleTexture,
        "scene_3/img/bubbleSpeech/BubbleSpeech_3.png"
      );
      this.applyTextureOnMaterial(this.catMesh, this.catMeshToonMaterial, this.catTexture, "scene_3/img/cat/Face_BaseColor_smiling.png");
    } else if (this.currentMouseClickEvent == this.mouseClickEvent.ThirdClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.None;
      this.startNewScene();
    }
  }
  // loading pop model and animations
  async loadAssync() {
    const scalar = 0.35;
    const loader = new GLTFLoader();
    const [idle] = await Promise.all([loader.loadAsync("scene_3/models/cat/cat_anim.glb")]);
    this.idleScene = idle.scene;
    // mesh texture
    this.catTexture = new THREE.TextureLoader().load("scene_3/img/cat/Face_BaseColor_smiling.png");
    this.catTexture.premultiplyAlpha = false;
    this.catTexture.flipY = false;
    this.catTexture.minFilter = THREE.NearestFilter;
    this.catTexture.magFilter = THREE.NearestFilter;

    // mesh material
    this.catMesh = this.idleScene.getObjectByName("Head") as THREE.Mesh;
    this.catMeshToonMaterial.map = this.catTexture;
    this.catMesh.material = this.catMeshToonMaterial;

    // mesh animation
    this.mixer = new THREE.AnimationMixer(idle.scene);
    this.animationActions["idle"] = this.mixer.clipAction(idle.animations[0]);
    this.activeAction = this.animationActions["idle"];

    this.idleScene.scale.multiplyScalar(scalar);
    this.idleScene.position.set(-1.5, 0.2, 0);
    this.startCatAnimation();
  }

  createBubbleSpeech() {
    // mesh texture
    this.bubbleTexture = new THREE.TextureLoader().load("scene_3/img/bubbleSpeech/BubbleSpeech_1.png");
    this.bubbleTexture.premultiplyAlpha = false;
    this.bubbleTexture.flipY = false;
    this.bubbleTexture.minFilter = THREE.NearestFilter;
    this.bubbleTexture.magFilter = THREE.NearestFilter;

    //loads model
    new GLTFLoader().load("scene_3/models/bubbleSpeech/BubbleSpeech.glb", (gltf) => {
      const bubbleMeshParent = gltf.scene.getObjectByName("BubbleSpeech") as THREE.Mesh;
      this.bubbleMesh = bubbleMeshParent.children[1] as THREE.Mesh;
      // mesh material
      this.bubbleMeshToonMaterial.map = this.bubbleTexture;
      this.bubbleMesh.material = this.bubbleMeshToonMaterial;
      gltf.scene.scale.multiplyScalar(0.35);
      gltf.scene.position.set(1, 1.6, 0.5);
      this.scene.add(gltf.scene);
    });
  }

  applyTextureOnMaterial(mesh: THREE.Mesh, material: any, texture: THREE.Texture, path: string) {
    texture = new THREE.TextureLoader().load(path);
    texture.premultiplyAlpha = false;
    texture.flipY = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    material.map = texture;
    mesh.material = material;
  }
  startCatAnimation() {
    this.scene.add(this.idleScene);
    this.activeAction.play();
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

  // update loop
  updateLoop(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });

    this.mixer.update(delta);
    this.starButton.rotation.y += 0.25 * delta;
    this.starButton.rotation.z += 0.25 * delta;
    this.idleScene.position.y = Math.sin(clock.getElapsedTime()) * 0.1;
  }

  deactivateAllTexts() {
    this.buttons = [];
  }
}
