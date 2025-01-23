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
import { texture } from "three/webgpu";

export default class Level_3 {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  interactables: THREE.Mesh[] = [];
  mouse: THREE.Vector2;
  ambientLight: THREE.AmbientLight;
  pointLight: THREE.PointLight;
  //animations
  mixer = new THREE.AnimationMixer(this.scene);
  animationActions: { [key: string]: THREE.AnimationAction } = {};
  activeAction: THREE.AnimationAction = this.animationActions[""];
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

    //
    this.init();
  }

  init() {
    this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    this.createOutlines();
    //this.createPlatform();
    this.waypoints.splice(0, 0, this.originalEnemyPos);
    this.waypoints.forEach((wayPoint) => {
      this.createWayPoint(wayPoint);
    });
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
    // texture for button as a platform
    const starTexture = new THREE.TextureLoader().load("scene_3/img/star/Star_base.png");
    starTexture.premultiplyAlpha = false;
    starTexture.magFilter = THREE.NearestFilter;
    starTexture.minFilter = THREE.NearestFilter;
    starTexture.flipY = false;

    // create button as a platform
    new GLTFLoader().load("scene_3/models/Star.glb", (gltf) => {
      const starMesh = gltf.scene.getObjectByName("Star") as THREE.Mesh;
      const material = new THREE.MeshToonMaterial({ color: 0xffff00 });
      material.map = starTexture;
      starMesh.material = material;
      starMesh.position.set(position.x, position.y + starMesh.scale.y / 4, position.z);
      starMesh.scale.setScalar(0.15);
      this.scene.add(starMesh);
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
        //checks the click's number
        let object3D = intersects[0].object as THREE.Mesh;
        this.createStar(this.enemyIdleScene.position);
        this.enemyIdleScene.rotation.set(this.enemyStartRotation.x, this.enemyStartRotation.y, this.enemyStartRotation.z);
        // for better memory management and performance
        if (object3D.geometry) object3D.geometry.dispose();

        if (object3D.material) {
          if (object3D.material instanceof Array) {
            // for better memory management and performance
            object3D.material.forEach((material) => material.dispose());
          } else {
            // for better memory management and performance
            object3D.material.dispose();
          }
          console.log("dispose");
          object3D.removeFromParent();
        }
      }
    });
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
    const scalar = 0.2;
    const loader = new GLTFLoader();
    const [idle] = await Promise.all([loader.loadAsync("scene_4/enemy.glb")]);
    this.enemyIdleScene = idle.scene;
    // mesh texture
    this.enemyTexture = new THREE.TextureLoader().load("scene_4/enemy_base.png");
    this.enemyTexture.premultiplyAlpha = false;
    this.enemyTexture.flipY = false;
    this.enemyTexture.minFilter = THREE.NearestFilter;
    this.enemyTexture.magFilter = THREE.NearestFilter;

    // mesh material
    this.enemyMesh = this.enemyIdleScene.getObjectByName("enemy") as THREE.Mesh;
    this.enemyMeshToonMaterial.map = this.enemyTexture;
    this.enemyMesh.material = this.enemyMeshToonMaterial;

    // mesh animation
    this.mixer = new THREE.AnimationMixer(idle.scene);
    this.animationActions["idle"] = this.mixer.clipAction(idle.animations[0]);
    this.activeAction = this.animationActions["idle"];

    this.enemyIdleScene.scale.multiplyScalar(scalar);
    this.enemyIdleScene.position.set(this.originalEnemyPos.x, this.originalEnemyPos.y, this.originalEnemyPos.z);
    this.startEnemyAnimation();
    this.interactables.push(this.enemyMesh);
    this.enemyStartRotation = this.enemyIdleScene.rotation;
    //this.enemyIdleScene.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0);
    const axesHelper = new THREE.AxesHelper(2);
    this.enemyIdleScene.add(axesHelper);
    axesHelper.visible = true;
    this.setDirection();
    this.setRotation();
  }

  startEnemyAnimation() {
    this.scene.add(this.enemyIdleScene);
    this.activeAction.play();
  }

  createWayPoint(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.05, 32, 16);
    const material = new THREE.MeshToonMaterial({ color: 0xffff00 });
    let wayPoint = new THREE.Mesh(geometry, material);
    wayPoint.position.set(position.x, position.y, position.z);
    this.scene.add(wayPoint);
    const axesHelper = new THREE.AxesHelper(1);
    wayPoint.add(axesHelper);
    axesHelper.visible = true;
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
    this.mixer.update(delta);

    this.setDirection();
    let newPos = this.direction.multiplyScalar(1 * delta);

    // moving
    this.enemyIdleScene.position.x += newPos.x;
    this.enemyIdleScene.position.y += newPos.y;
    this.enemyIdleScene.position.z += newPos.z;
    if (this.enemyIdleScene.position.distanceTo(this.waypoints[this.currentWaypointIndex]) < 0.1) {
      this.currentWaypointIndex = this.currentWaypointIndex < this.waypoints.length - 1 ? ++this.currentWaypointIndex : 0;
      // rotates after updated position
      this.setRotation();
    }
  }

  setDirection() {
    let wayPointPos = this.waypoints[this.currentWaypointIndex].clone();
    let newDirection = wayPointPos.sub(this.enemyIdleScene.position);
    this.direction = (newDirection as unknown as THREE.Vector3).normalize();
  }
  setRotation() {
    this.enemyIdleScene.lookAt(this.direction);
    let rotationY = this.direction.y < 0 ? this.invertAngle(this.enemyIdleScene.rotation.y) : this.enemyIdleScene.rotation.y;
    this.enemyIdleScene.rotation.set(0, rotationY, 0);
  }

  invertAngle(angle: number) {
    return (angle + Math.PI) % (2 * Math.PI);
  }

  deactivateAllTexts() {}
}
