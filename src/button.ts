import * as THREE from "three";
import { MathUtils } from "three/src/math/MathUtils.js";

export default class Button extends THREE.Mesh {
  hovered = false;
  clicked = false;
  colorTo: THREE.Color;
  defaultColor: THREE.Color;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  v = new THREE.Vector3();
  defaultScale = new THREE.Vector3();
  defaultPosition = new THREE.Vector3();
  constructor(geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, colorTo: THREE.Color) {
    super();
    this.material = material;
    this.geometry = geometry;
    this.colorTo = colorTo;
    this.defaultColor = material.color.clone();
    this.castShadow = true;
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
    //this.rotation.y += delta / 20;
    //transform.Translate(new Vector3(0, Mathf.Sin(Time.time) * amplitude, 0) * speed * Time.deltaTime);
    this.position.y = Math.sin(clock.getElapsedTime()) * 0.05 + this.defaultPosition.y;
    this.hovered ? this.material.color.lerp(this.colorTo, delta * 10) : this.material.color.lerp(this.defaultColor, delta * 10);
    this.clicked
      ? this.scale.set(
          this.lerp(this.defaultScale.x, 1.5, delta * 5),
          this.lerp(this.defaultScale.y, 1.5, delta * 5),
          this.lerp(this.defaultScale.z, 1.5, delta * 5)
        )
      : this.scale.set(
          this.lerp(this.defaultScale.x, 1.0, delta),
          this.lerp(this.defaultScale.y, 1.0, delta),
          this.lerp(this.defaultScale.z, 1.0, delta)
        );
  }
}