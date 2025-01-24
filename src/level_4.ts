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
import Enemy from "./enemy";

export default class Level_3 {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  interactables: THREE.Mesh[] = [];
  mouse: THREE.Vector2;
  ambientLight: THREE.AmbientLight;
  pointLight: THREE.PointLight;

  //Button
  buttons: Button[] = [];
  //stars
  stars: THREE.Mesh[] = [];
  // enemy 1
  mixer_1 = new THREE.AnimationMixer(this.scene);
  animationActions_1: { [key: string]: THREE.AnimationAction } = {};
  activeAction_1: THREE.AnimationAction = this.animationActions_1[""];

  // enemy 2
  mixer_2 = new THREE.AnimationMixer(this.scene);
  animationActions_2: { [key: string]: THREE.AnimationAction } = {};
  activeAction_2: THREE.AnimationAction = this.animationActions_1[""];

  // enemy 3
  mixer_3 = new THREE.AnimationMixer(this.scene);
  animationActions_3: { [key: string]: THREE.AnimationAction } = {};
  activeAction_3: THREE.AnimationAction = this.animationActions_1[""];

  //
  enemiesAmount = 0;

  enemyIdleScene: THREE.Group<THREE.Object3DEventMap>;
  enemyStartRotation: any;
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

  enemyMeshToonMaterial = new THREE.MeshToonMaterial();
  enemyMesh = new THREE.Mesh();
  enemyTexture: any;

  bubbleMeshToonMaterial = new THREE.MeshToonMaterial();
  bubbleMesh = new THREE.Mesh();
  bubbleTexture: any;

  starButton: any;
  //events
  event = new Event("StartNewScene");
  //waypoints
  currentWaypointPos = new THREE.Vector3(-1, 0, 0);
  direction = new THREE.Vector3();
  waypoints: any[] = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -2)];
  currentWaypointIndex = 0;
  originalEnemyPos = new THREE.Vector3(-1.5, 0.2, 0);

  //enemies
  enemies: Enemy[] = [];
  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.pointLight = new THREE.PointLight(0xffffff, 500);

    //animation
    this.enemyIdleScene = new THREE.Group<THREE.Object3DEventMap>();

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

    this.init();
  }

  init() {
    //this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    this.createOutlines();
    this.createPlatform();
  }

  //outline as a postprocessing
  createOutlines() {
    this.composer.addPass(this.renderPass);
    // -- parameter config
    this.outlinePass.edgeStrength = 4.0;
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

  createGridCameraUI() {
    this.camera.position.set(0.1, 2, 6);

    const gridHelper = new THREE.GridHelper(100, 100);
    let isGridVisible = {
      switch: true,
    };
    gridHelper.visible = isGridVisible.switch;
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);
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

    //gui.hide();
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
  createStar(position: THREE.Vector3) {
    // texture for star
    const starTexture = new THREE.TextureLoader().load("scene_3/img/star/Star_base.png");
    starTexture.premultiplyAlpha = false;
    starTexture.magFilter = THREE.NearestFilter;
    starTexture.minFilter = THREE.NearestFilter;
    starTexture.flipY = false;

    // create a star
    new GLTFLoader().load("scene_3/models/Star.glb", (gltf) => {
      const starMesh = gltf.scene.getObjectByName("Star") as THREE.Mesh;
      const material = new THREE.MeshToonMaterial({ color: 0xffff00 });
      material.map = starTexture;
      starMesh.material = material;
      starMesh.position.set(position.x, position.y + starMesh.scale.y / 4, position.z);
      starMesh.scale.setScalar(0.15);
      this.scene.add(starMesh);
      this.stars.push(starMesh);
    });
  }

  setupButtonInteractions() {
    this.renderer.domElement.addEventListener("mousemove", (e) => {
      const intersects = this.raycaster.intersectObjects(this.interactables, false);
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);

      //if there no mouse raycast on the button, don't outline it
      this.interactables.forEach((p) => {
        const index = this.outlinePass.selectedObjects.indexOf(p);
        if (index > -1) {
          // only splice array when item is found
          this.outlinePass.selectedObjects.splice(index, 1); // 2nd parameter means remove one item only
        }
        document.body.style.cursor = "default";
      });
      if (intersects.length) {
        this.outlinePass.selectedObjects.push(intersects[0].object);
        document.body.style.cursor = "pointer";
      }
    });

    this.renderer.domElement.addEventListener("pointerdown", (e) => {
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      const intersects = this.raycaster.intersectObjects(this.interactables, false);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // toggles `clicked` property for only the Pickable closest to the camera
      if (intersects.length) {
        this.buttons.forEach((button) => {
          if ((intersects[0].object as THREE.Mesh) === (button as THREE.Mesh)) {
            button.clicked = !button.clicked;
            this.createLinkToGame();
          }
        });

        //checks the click's number
        this.enemies.forEach((enemy) => {
          if ((intersects[0].object as THREE.Mesh) === enemy.enemyMesh) {
            // makes enemy element uninteractable
            const index = this.enemies.indexOf(enemy);
            this.enemies.splice(index, 1);
            const index_2 = this.interactables.indexOf(enemy.enemyMesh);
            this.interactables.splice(index_2, 1);

            this.createStar(enemy.enemyIdleScene.position);
            this.destroyMesh(intersects[0].object as THREE.Mesh);
            if (this.enemiesAmount > 1) {
              this.enemiesAmount--;
            } else {
              this.createTextMesh("Play", 2, "Play", new THREE.Vector3(0, 2, 0), 0.1);
              document.querySelector(".level_1")?.classList.remove("hidden");
            }
          }
        });
      }
    });
  }

  destroyMesh(object3D: THREE.Mesh) {
    // for better memory management and performance
    if (object3D.geometry) object3D.geometry.dispose();
    if (object3D.material) {
      if (object3D.material instanceof Array) {
        object3D.material.forEach((material) => material.dispose());
      } else {
        object3D.material.dispose();
      }
      object3D.removeFromParent();
    }
  }

  checkButtonInteractions() {
    if (this.currentMouseClickEvent == this.mouseClickEvent.FirstClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.SecondClickEvent;
    } else if (this.currentMouseClickEvent == this.mouseClickEvent.SecondClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.ThirdClickEvent;
    } else if (this.currentMouseClickEvent == this.mouseClickEvent.ThirdClickEvent) {
      this.currentMouseClickEvent = this.mouseClickEvent.None;
      this.startNewScene();
    }
  }

  createTextMesh(text: string, size: number, buttonName: string, position: THREE.Vector3, scale: number) {
    let textGeo: TextGeometry;
    //let textMesh = this.textMesh;
    let activeScene = this.scene;
    let interactables = this.interactables;
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
      const textMesh = new THREE.Mesh(textGeo, new THREE.MeshToonMaterial({ color: 0x3f54ff }));
      const textButton = new Button(
        buttonName,
        activeScene,
        textMesh.geometry,
        new THREE.MeshToonMaterial({ color: 0xd0cfd3 }),
        new THREE.Color(0xeeeeee),
        false,
        false,
        0.015,
        true
      );
      interactables.push(textButton);
      buttons.push(textButton);
      textButton.setScale(scale, scale, scale);
      textButton.setPosition(position.x, position.y, position.z);
    });
  }

  createLinkToGame() {
    console.log("createLinkToGame");
    window.open("https://annfyz.itch.io/the-little-heros-big-adventure")?.addEventListener("click", function (event) {
      event.stopPropagation();
      event.preventDefault();

      return false;
    });
  }
  createPlatform() {
    const scalar = 0.22;
    // texture for button as a platform
    const platformTexture = new THREE.TextureLoader().load("scene_4/platform_base.png");
    platformTexture.premultiplyAlpha = false;
    platformTexture.magFilter = THREE.NearestFilter;
    platformTexture.minFilter = THREE.NearestFilter;
    platformTexture.flipY = false;
    const platformNormalTexture = new THREE.TextureLoader().load("scene_4/platform_normal.png");
    platformNormalTexture.premultiplyAlpha = false;
    platformNormalTexture.magFilter = THREE.NearestFilter;
    platformNormalTexture.minFilter = THREE.NearestFilter;
    platformNormalTexture.flipY = false;
    // create button as a platform
    new GLTFLoader().load("scene_4/platform.glb", (gltf) => {
      const platformMesh = gltf.scene.getObjectByName("platform") as THREE.Mesh;
      const material = new THREE.MeshToonMaterial({ color: 0xffffff });
      material.map = platformTexture;
      material.normalMap = platformNormalTexture;
      platformMesh.material = material;
      gltf.scene.scale.multiplyScalar(scalar);
      gltf.scene.position.set(-2, -12, -2);
      this.scene.add(gltf.scene);
    });
  }
  // loading enemy model and animations
  async loadAssync() {
    const loader = new GLTFLoader();
    const [idle_1, idle_2, idle_3] = await Promise.all([
      loader.loadAsync("scene_4/enemy.glb"),
      loader.loadAsync("scene_4/enemy.glb"),
      loader.loadAsync("scene_4/enemy.glb"),
    ]);

    // enemy 1
    this.mixer_1 = new THREE.AnimationMixer(idle_1.scene);
    this.animationActions_1["idle_1"] = this.mixer_1.clipAction(idle_1.animations[0]);
    this.activeAction_1 = this.animationActions_1["idle_1"];
    const wayPoints_1 = [new THREE.Vector3(-0.75, 0.3, 0), new THREE.Vector3(-0.65, 0.3, -1.15), new THREE.Vector3(-1.55, 0.3, -1.1)];
    const enemy_1 = new Enemy(
      "enemy_1",
      this.scene,
      this.activeAction_1,
      idle_1.scene,
      new THREE.Vector3(-1.5, 0.3, 0),
      new THREE.Color(0xabff3d),
      wayPoints_1
    );
    this.enemies.push(enemy_1);
    this.interactables.push(enemy_1.enemyMesh);
    this.enemiesAmount++;
    // enemy 2
    this.mixer_2 = new THREE.AnimationMixer(idle_2.scene);
    this.animationActions_2["idle_2"] = this.mixer_2.clipAction(idle_2.animations[0]);
    this.activeAction_2 = this.animationActions_2["idle_2"];
    const wayPoints_2 = [
      new THREE.Vector3(1.15, 0.35, -1.5),
      new THREE.Vector3(1.5, 0.85, -1.5),
      new THREE.Vector3(2, 0.85, -1.5),
      // new THREE.Vector3(2.5, 0.85, -1.5),
    ];
    const enemy_2 = new Enemy(
      "enemy_2",
      this.scene,
      this.activeAction_2,
      idle_2.scene,
      new THREE.Vector3(0.5, 0.35, -1.5),
      new THREE.Color(0xffff00),
      wayPoints_2
    );
    this.enemies.push(enemy_2);
    this.interactables.push(enemy_2.enemyMesh);
    this.enemiesAmount++;

    // enemy 3
    this.mixer_3 = new THREE.AnimationMixer(idle_3.scene);
    this.animationActions_3["idle_3"] = this.mixer_3.clipAction(idle_3.animations[0]);
    this.activeAction_3 = this.animationActions_3["idle_3"];
    const wayPoints_3 = [new THREE.Vector3(-0.1, 0.5, -1.5)];
    const enemy_3 = new Enemy(
      "enemy_3",
      this.scene,
      this.activeAction_3,
      idle_3.scene,
      new THREE.Vector3(-0.1, 0.5, 0.45),
      new THREE.Color(0xe397ff),
      wayPoints_3
    );
    this.enemies.push(enemy_3);
    this.interactables.push(enemy_3.enemyMesh);
    this.enemiesAmount++;
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
    if (!document.hidden) {
      this.buttons.forEach((p) => {
        p.update(delta, clock);
      });

      this.mixer_1.update(delta);
      this.mixer_2.update(delta);
      this.mixer_3.update(delta);
      this.enemies.forEach((enemy) => {
        enemy.updateLoop(delta);
      });

      this.stars.forEach((star) => {
        star.rotation.y += 0.25 * delta;
        star.rotation.z += 0.25 * delta;
      });
    }
  }

  deactivateAllTexts() {}
}
