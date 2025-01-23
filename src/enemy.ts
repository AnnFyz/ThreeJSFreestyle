import * as THREE from "three";

export default class Enemy {
  name: string;
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
  waypoints: THREE.Vector3[] = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -2)];
  currentWaypointIndex = 0;
  originalEnemyPos = new THREE.Vector3(1.5, 0.2, 0);
  wayPointColor: THREE.Color;
  constructor(
    name: string,
    scene: THREE.Scene,
    activeAction: THREE.AnimationAction,
    mixerScene: THREE.Group<THREE.Object3DEventMap>,
    originalPos: THREE.Vector3,
    wayPointColor: THREE.Color,
    waypoints: THREE.Vector3[]
  ) {
    this.name = name;
    this.scene = scene;
    this.enemyIdleScene = mixerScene;
    this.activeAction = activeAction;
    this.originalEnemyPos = originalPos;
    this.wayPointColor = wayPointColor;
    this.waypoints = waypoints;
    this.waypoints.splice(0, 0, this.originalEnemyPos);
    this.waypoints.splice(0, 0, this.originalEnemyPos);
    this.waypoints.forEach((wayPoint) => {
      this.createWayPoint(wayPoint);
    });

    this.init();
  }

  init() {
    this.setEnemy();
    this.setEnemyAnimation();
    this.startEnemyAnimation();
  }

  createWayPoint(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.05, 32, 16);
    const material = new THREE.MeshToonMaterial({ color: 0xabff3d });
    material.color = this.wayPointColor;
    material.colorWrite = false;
    let wayPoint = new THREE.Mesh(geometry, material);
    wayPoint.position.set(position.x, position.y, position.z);
    const axesHelper = new THREE.AxesHelper(1);
    wayPoint.add(axesHelper);
    axesHelper.visible = false;
    this.scene.add(wayPoint);
  }

  // loading enemy model and animations
  setEnemy() {
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

    this.setDirection();
    this.setRotation();
  }

  handleDeath() {}
  setEnemyAnimation() {
    const scalar = 0.15;
    // mesh animation
    this.enemyIdleScene.scale.multiplyScalar(scalar);
    this.enemyIdleScene.position.set(this.originalEnemyPos.x, this.originalEnemyPos.y, this.originalEnemyPos.z);

    //axes
    const axesHelper = new THREE.AxesHelper(2);
    this.enemyIdleScene.add(axesHelper);
    axesHelper.visible = false;
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
    this.enemyIdleScene.rotation.x = 0;
    this.enemyIdleScene.rotation.z = 0;
    const enemyFacing = this.enemyIdleScene.getWorldDirection(new THREE.Vector3());
    let dotProduct = enemyFacing.dot(this.direction);
    let rotationY = dotProduct < 0 ? this.invertAngle(this.enemyIdleScene.rotation.y) : this.enemyIdleScene.rotation.y;
    this.enemyIdleScene.rotation.y = rotationY;
  }

  invertAngle(angle: number) {
    return (angle + Math.PI) % (2 * Math.PI);
  }

  updateLoop(delta: number) {
    this.setDirection();
    let newPos = this.direction.multiplyScalar(0.5 * delta);

    // moving
    this.enemyIdleScene.position.x += newPos.x;
    this.enemyIdleScene.position.y += newPos.y;
    this.enemyIdleScene.position.z += newPos.z;
    if (this.enemyIdleScene.position.distanceTo(this.waypoints[this.currentWaypointIndex]) < 0.005) {
      if (this.currentWaypointIndex < this.waypoints.length - 1) {
        this.currentWaypointIndex++;
        this.waypoints.reverse();
      } else {
        this.currentWaypointIndex = 0;
      }
      // rotates after updated position
      this.setDirection();
      this.setRotation();
    }
  }
}
