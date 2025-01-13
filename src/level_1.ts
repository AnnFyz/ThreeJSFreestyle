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

export default class Level_1 {
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
  idleLoop = this.OnFinishedAnimation.bind(this);

  mouseClickEvent = {
    FirstClickEvent: "FirstClickEvent",
    SecondClickEvent: "SecondClickEvent",
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
  meshToonMaterial = new THREE.MeshToonMaterial();
  outlineMaterial = new THREE.ShaderMaterial();
  popMesh = new THREE.Mesh();

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
    this.createButton();
    this.createLight();
    this.createOutlines();
  }

    //outline as a postprocessing
  createOutlines() {
    this.composer.addPass(this.renderPass);
    // -- parameter config
    this.outlinePass.edgeStrength = 3.0;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = 3.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
    //this.outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object

    this.composer.addPass( this.outlinePass);
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

  createButton() {
    const platformTexture = new THREE.TextureLoader().load("scene_1/img/Platform_1_3.png");
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
        new THREE.MeshToonMaterial({ color: 0xffffff }),
        new THREE.Color(0xeeeeee),
        platformTexture
      );
      button.setScale(1, 1, 1);
      //button.setPosition(-1, 1, -0.15);
      console.log(button);
      // @ts-ignore
      this.buttons.push(button);
      this.scene.add(button);
      this.scene.add(button.wireframe);
    });

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
        if (index > -1) { // only splice array when item is found
          this.outlinePass.selectedObjects.splice(index, 1); // 2nd parameter means remove one item only
        }
        
        
        document.querySelector(".intro")?.classList.remove("highlighted");
        document.querySelector(".fade-out")?.classList.remove("fade-out");
        document.body.style.cursor = "default";
      });
      if (intersects.length) {
        (intersects[0].object as Button).hovered = true;
        //this.outlinePass.selectedObjects.push(intersects[0].object);
        this.outlinePass.selectedObjects.push(intersects[0].object);
        document.querySelector(".intro")?.classList.add("highlighted");
        document.body.style.cursor = "pointer";

        document.querySelector(".fade-in-slide")?.classList.remove("fade-in-slide");
        document.querySelector(".intro")?.classList.add("fade-out");
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
        document.querySelector(".intro")?.classList.add("hidden");
        if (this.currentMouseClickEvent == this.mouseClickEvent.FirstClickEvent) {
          this.startPopAnimation();
          this.currentMouseClickEvent = this.mouseClickEvent.SecondClickEvent;
        } else if (this.currentMouseClickEvent == this.mouseClickEvent.SecondClickEvent) {
          this.switchPopAnimation();
          this.currentMouseClickEvent = this.mouseClickEvent.None;
        }
      }
    });
  }

  //outline as a mesh 
  solidify = (mesh: THREE.Mesh) => {
    const geometry = mesh.geometry;
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        void main() { 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        void main() { 
          gl_FragColor = vec4(1,0,0,1);
        }
      `,
    });

    const outline = new THREE.Mesh(geometry, this.outlineMaterial);
    //this.scene.add(outline);
  };

  // loading pop model and animations
  async loadAssync() {
    const scalar = 0.5;
    const loader = new GLTFLoader();
    const [idle, jump, landing] = await Promise.all([
      loader.loadAsync("models/pop_skin_idle.glb"),
      loader.loadAsync("models/pop_jumping.glb"),
      loader.loadAsync("scene_1/models/FallinPopAnimation_3.glb"),
    ]);

    this.idleScene = idle.scene;

    // mesh texture
    const popTexture = new THREE.TextureLoader().load("scene_1/img/VintagePupTex_5.png");
    popTexture.premultiplyAlpha = false;
    popTexture.flipY = false;
    popTexture.minFilter = THREE.NearestFilter;
    popTexture.magFilter = THREE.NearestFilter;

    // mesh material
    this.popMesh = this.idleScene.getObjectByName("Pop") as THREE.Mesh;
    this.popMesh.material = this.meshToonMaterial;
    this.meshToonMaterial.map = popTexture;
    //popMesh.material = this.meshToonMaterial;

    // mesh animation
    this.mixer = new THREE.AnimationMixer(idle.scene);
    this.animationActions["idle"] = this.mixer.clipAction(idle.animations[1]);
    this.animationActions["jump"] = this.mixer.clipAction(jump.animations[0]);
    this.animationActions["landing"] = this.mixer.clipAction(landing.animations[0]);
    this.activeAction = this.animationActions["landing"];

    this.idleScene.scale.multiplyScalar(scalar);
    this.idleScene.position.set(0, 0.2, 0);
  }

  startPopAnimation() {
    this.scene.add(this.idleScene);
    this.activeAction.play();
    this.activeAction.setLoop(THREE.LoopOnce, 1);
    this.activeAction.clampWhenFinished = true;
    this.mixer.addEventListener("finished", this.idleLoop);
  }

  switchPopAnimation() {
    this.mixer.removeEventListener("finished", this.idleLoop);
    this.activeAction.fadeOut(0.5);
    this.animationActions["jump"].reset().fadeIn(0.25).play();
    this.activeAction = this.animationActions["jump"];
    this.activeAction.setLoop(THREE.LoopOnce, 1);
    this.activeAction.clampWhenFinished = true;
    this.mixer.addEventListener("finished", () => {
      this.popMesh.visible = false;
      this.StartNewScene();
    });
  }

  OnFinishedAnimation() {
    this.activeAction.fadeOut(1);
    this.animationActions["idle"].reset().fadeIn(0.25).play();
    this.activeAction = this.animationActions["idle"];
    console.log("idle again");
  }

  StartNewScene() {
    console.log("Start new scene");
    document.dispatchEvent(this.event);
  }

  // update loop
  updateLoop(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });

    this.mixer.update(delta);
  }
}
