import * as THREE from "three";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
//import { MathUtils } from "three/src/math/MathUtils.js";

export default class Button extends THREE.Mesh {
  hovered = false;
  clicked = false;
  colorTo: THREE.Color;
  defaultColor: THREE.Color;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshToonMaterial;
  texture: THREE.Texture;
  wireframe: THREE.LineSegments;
  v = new THREE.Vector3();
  defaultScale = new THREE.Vector3();
  defaultPosition = new THREE.Vector3();
  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.MeshToonMaterial,
    colorTo: THREE.Color,
    texture = THREE.Texture.DEFAULT_IMAGE
  ) {
    super();
    this.material = material;
    this.geometry = geometry;
    this.colorTo = colorTo;
    this.defaultColor = material.color.clone();
    this.castShadow = true;
    this.texture = texture;
    this.material.map = this.texture;
    var geo = new THREE.EdgesGeometry(this.geometry); // or WireframeGeometry( geometry )
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 100 });
    this.wireframe = new THREE.LineSegments(geo, edgesMaterial);
    //this.wireframe.scale.addScalar(1);
    this.material.colorWrite = false;
    this.material.polygonOffset = true;
    this.material.polygonOffsetFactor = 1;
    this.material.polygonOffsetUnits = 1;
  }

  lerp(from: number, to: number, speed: number) {
    const amount = (1 - speed) * from + speed * to;
    return Math.abs(from - to) < 0.001 ? to : amount;
  }

  setScale(x: number, y: number, z: number) {
    this.scale.set(x, y, z);
    this.defaultScale = new THREE.Vector3(x, y, z);
  }

  setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.defaultPosition = new THREE.Vector3(x, y, z);
  }

  update(delta: number, clock: THREE.Clock) {
    this.hovered ? this.material.color.lerp(this.colorTo, delta * 10) : this.material.color.lerp(this.defaultColor, delta * 10);
    this.clicked ? this.v.set(1.25, 1.25, 1.25) : this.v.set(1.0, 1.0, 1.0);
    this.clicked ? (this.material.colorWrite = true) : (this.material.colorWrite = false);
    this.scale.lerp(
      new THREE.Vector3(this.v.x * this.defaultScale.x, this.v.y * this.defaultScale.y, this.v.z * this.defaultScale.z),
      delta * 5
    );
    this.wireframe.scale.lerp(
      new THREE.Vector3(this.v.x * this.defaultScale.x, this.v.y * this.defaultScale.y, this.v.z * this.defaultScale.z),
      delta * 5
    );

    this.position.y = Math.sin(clock.getElapsedTime()) * 0.05 + this.defaultPosition.y;
    this.wireframe.position.y = Math.sin(clock.getElapsedTime()) * 0.05 + this.defaultPosition.y;
  }
}