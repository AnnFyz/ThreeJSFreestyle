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
  ambientLight: THREE.AmbientLight;
  pointLight: THREE.PointLight;
  textMesh = new THREE.Mesh();
  cube = new THREE.Mesh();
  universalController_parent = new THREE.Mesh();
  universalController_1_1 = new THREE.Mesh();
  universalController_1_2 = new THREE.Mesh();
  universalController_wire_1_1 = new THREE.LineSegments();
  universalController_wire_1_2 = new THREE.LineSegments();

  //shader effect
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  effectFXAA = new ShaderPass(FXAAShader);


  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, raycaster: THREE.Raycaster, mouse: THREE.Vector2) {
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.mouse = mouse;
    //light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.pointLight = new THREE.PointLight(0xffffff, 50);
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

    //

    this.init();
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0x123456 });
    // this.cube = new THREE.Mesh(geometry, material);
    // this.scene.add(this.cube);
  }

  init() {
    this.createGridCameraUI();
    this.createBackground();
    this.createLight();
    // this.createButton();
    this.createTextMesh();
    this.createOutlines();
    this.createControllers();
    this.createInteractions();
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);
  }

   //outline as a postprocessing
   createOutlines() {
    this.composer.addPass(this.renderPass);
    // -- parameter config
    this.outlinePass.edgeStrength = 15.0;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.edgeThickness = 1.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffffff"); // set basic edge color
    //this.outlinePass.hiddenEdgeColor.set("#1abaff"); // set edge color when it hidden by other object

    this.composer.addPass( this.outlinePass);
    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);

  }

  createControllers() {
    const controller_1_1_texture = new THREE.TextureLoader().load("scene_2/UniversalController_1.png");
    controller_1_1_texture.premultiplyAlpha = false;
    controller_1_1_texture.magFilter = THREE.NearestFilter;
    controller_1_1_texture.minFilter = THREE.NearestFilter;
    controller_1_1_texture.flipY = false;

    const controller_1_2_texture = new THREE.TextureLoader().load("scene_2/UniversalController_2.png");
    controller_1_2_texture.premultiplyAlpha = false;
    controller_1_2_texture.magFilter = THREE.NearestFilter;
    controller_1_2_texture.minFilter = THREE.NearestFilter;
    controller_1_2_texture.flipY = false;

    new GLTFLoader().load("scene_2/UniversalController.glb", (gltf) => {
      this.universalController_parent = gltf.scene.getObjectByName("Controller") as THREE.Mesh;
      this.universalController_1_1 = this.universalController_parent.children[1] as THREE.Mesh;
      this.universalController_1_2 = this.universalController_parent.children[0] as THREE.Mesh;

      let material_1 = new THREE.MeshToonMaterial({ color: 0xffffff });
      material_1.map = controller_1_1_texture;
      this.universalController_1_1.material = material_1;

      let material_2 = new THREE.MeshToonMaterial({ color: 0xffffff });
      material_2.map = controller_1_2_texture;
      this.universalController_1_2.material = material_2;

      this.universalController_1_1.scale.setScalar(10);
      this.universalController_1_2.scale.setScalar(10);
      this.scene.add(this.universalController_1_1);
      this.scene.add(this.universalController_1_2);

      let geo_1 = new THREE.EdgesGeometry(this.universalController_1_1.geometry);
      const edgesMaterial_1 = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 10 });
      this.universalController_wire_1_1 = new THREE.LineSegments(geo_1, edgesMaterial_1);
      this.universalController_wire_1_1.scale.addScalar(9);
      material_1.colorWrite = false;
      material_1.polygonOffset = true;
      material_1.polygonOffsetFactor = 1;
      material_1.polygonOffsetUnits = 1;
      this.scene.add(this.universalController_wire_1_1);

      let geo_2 = new THREE.EdgesGeometry(this.universalController_1_2.geometry);
      const edgesMaterial_2 = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 10 });
      this.universalController_wire_1_2 = new THREE.LineSegments(geo_2, edgesMaterial_2);
      this.universalController_wire_1_2.scale.addScalar(9);
      material_2.colorWrite = false;
      material_2.polygonOffset = true;
      material_2.polygonOffsetFactor = 1;
      material_2.polygonOffsetUnits = 1;
      this.scene.add(this.universalController_wire_1_2);

      this.interactableObj.push(this.universalController_1_1);
      this.interactableObj.push(this.universalController_1_2);
      //this.interactableObj.push(this.universalController_wire_1_1);
      //this.interactableObj.push(this.universalController_wire_1_2);
      //this.outlinePass.selectedObjects.push( this.interactableObj[0]);
      //this.outlinePass.selectedObjects.push( this.interactableObj[1]);
    });
  }

  createInteractions() {
    this.renderer.domElement.addEventListener("mousemove", (e) => {
      const intersects = this.raycaster.intersectObjects(this.interactableObj, false);
      this.mouse.set(
        (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
        -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);
      console.log("MOUSE MOVE");
      this.interactableObj.forEach((o) => {
        const index = this.outlinePass.selectedObjects.indexOf(o);
        if (index > -1) {
          // only splice array when item is found
          this.outlinePass.selectedObjects.splice(index, 1); // 2nd parameter means remove one item only
        }
     });
      if (intersects.length) {
        console.log("intersects.length ", intersects.length);
        this.outlinePass.selectedObjects.push(intersects[0].object);
      }
    });
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
      outlinePass.selectedObjects.push(textMesh);
    });
  }

  // update loop
  updateLoop(delta: number, clock: THREE.Clock) {}
}
  
