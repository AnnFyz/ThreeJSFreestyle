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
import { glsl } from "three/webgpu";

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
  idleScene: THREE.Group<THREE.Object3DEventMap>;
  idleLoop = this.OnFinishedAnimation.bind(this);

  //shader effect
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  effectFXAA = new ShaderPass(FXAAShader);

  mouseClickEvent = {
    FirstClickEvent: "FirstClickEvent",
    SecondClickEvent: "SecondClickEvent",
    None: "None",
  };

  currentMouseClickEvent = this.mouseClickEvent.FirstClickEvent;
  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
    raycaster: THREE.Raycaster,
    mouse: THREE.Vector2,
    composer: EffectComposer
  ) {
    super();
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.createGridCameraUI();
    this.createBackground();
    this.createButton();

    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.add(this.ambientLight);

    const light = new THREE.PointLight(0xffffff, 500);
    light.position.set(10, 10, 10);
    this.add(light);

    //outline
    this.composer = composer;
    this.renderPass = new RenderPass(this, this.camera);
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
      this,
      this.camera
    );
    this.effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    this.createOutlines();

    //animation
    this.idleScene = new THREE.Group<THREE.Object3DEventMap>();
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
    this.composer.addPass(this.outlinePass);

    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);
  }

  setLightIntensity(intensity: number) {
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

      this.buttons.forEach((p) => {
        p.hovered = false;
        this.outlinePass.selectedObjects = [];
        document.querySelector(".intro")?.classList.remove("highlighted");
      });
      if (intersects.length) {
        (intersects[0].object as Button).hovered = true;
        this.outlinePass.selectedObjects[0] = intersects[0].object;
        document.querySelector(".intro")?.classList.add("highlighted");
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

  //outline
  solidify = (mesh: THREE.Mesh) => {
    const geometry = mesh.geometry;
    const material = new THREE.ShaderMaterial({
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

    const outline = new THREE.Mesh(geometry, material);
    this.add(outline);
  };

  vertexShader() {
    return `
      varying vec3 vUv; 
  
      void main() {
        vUv = position; 
  
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition; 
      }
    `;
  }
  fragmentShader() {
    return `
    uniform vec3 colorA; 
    uniform vec3 colorB; 
    varying vec3 vUv;

    void main() {
      gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
    }
`;
  }
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
    const popMesh = idle.scene.getObjectByName("Pop") as THREE.Mesh;
    // mesh texture
    const popTexture = new THREE.TextureLoader().load("scene_1/img/VintagePupTex_5.png");
    //const gradientTexture = new THREE.TextureLoader().load("scene_1/img/VintagePupTex_6.png");
    popTexture.premultiplyAlpha = false;
    popTexture.flipY = false;
    popTexture.minFilter = THREE.NearestFilter;
    popTexture.magFilter = THREE.NearestFilter;

    // mesh material
    const toonMaterial = new THREE.MeshToonMaterial(); //{ color: 0xfffff }
    toonMaterial.map = popTexture;
    //toonMaterial.gradientMap = popTexture;
    popMesh.material = toonMaterial;
    //popMesh.material.colorWrite = false;
    // popMesh.material.polygonOffset = true;
    // popMesh.material.polygonOffsetFactor = 1;
    // popMesh.material.polygonOffsetUnits = 1;

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
    this.add(this.idleScene);
    const outline = this.solidify(this.idleScene.getObjectByName("Pop") as THREE.Mesh);
    //
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
  }

  OnFinishedAnimation() {
    this.activeAction.fadeOut(1);
    this.animationActions["idle"].reset().fadeIn(0.25).play();
    this.activeAction = this.animationActions["idle"];
    console.log("idle again");
  }

  // update loop
  animate(delta: number, clock: THREE.Clock) {
    this.buttons.forEach((p) => {
      p.update(delta, clock);
    });

    this.mixer.update(delta);
  }
}