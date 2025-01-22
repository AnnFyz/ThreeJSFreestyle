import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Enemy {
  scene = new THREE.Scene();
  //animations
  //mixer = new THREE.AnimationMixer(this.scene);
  mixer: any;
  animationActions: { [key: string]: THREE.AnimationAction } = {};
  activeAction: THREE.AnimationAction = this.animationActions[""];
  //animation
  enemyIdleScene = new THREE.Group<THREE.Object3DEventMap>();

  //materials
  outlineMaterial = new THREE.ShaderMaterial();

  enemyMeshToonMaterial = new THREE.MeshToonMaterial();
  enemyMesh = new THREE.Mesh();
  enemyTexture: any;

  //waypoints
  currentWaypointPos = new THREE.Vector3(-1, 0, 0);
  direction = new THREE.Vector3();
  waypoints: any[] = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -2)];
  currentWaypointIndex = 0;
  originalEnemyPos = new THREE.Vector3(-1.5, 0.2, 0);

  constructor(scene: THREE.Scene) {
    this.mixer = new THREE.AnimationMixer(scene);
  }
  // loading enemy model and animations
  async loadAssync() {
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
  }

  setEnemyAnimation() {
    const scalar = 0.2;
    // mesh animation
    this.mixer = new THREE.AnimationMixer(this.enemyIdleScene);
    this.animationActions["idle"] = this.mixer.clipAction(this.enemyIdleScene.animations[0]);
    this.activeAction = this.animationActions["idle"];

    this.enemyIdleScene.scale.multiplyScalar(scalar);
    this.enemyIdleScene.position.set(this.originalEnemyPos.x, this.originalEnemyPos.y, this.originalEnemyPos.z);
    this.startEnemyAnimation();
    //this.interactables.push(this.enemyMesh);

    //axes
    const axesHelper = new THREE.AxesHelper(2);
    this.enemyIdleScene.add(axesHelper);
    axesHelper.visible = false;
    this.setDirection();
    this.setRotation();
  }

  startEnemyAnimation() {
    this.scene.add(this.enemyIdleScene);
    this.activeAction.play();
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
}
