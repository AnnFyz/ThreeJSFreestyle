import * as THREE from "three";
import { MathUtils } from "three/src/math/MathUtils.js";

export default class Button {
  hovered = false;
  clicked = false;
  colorTo: THREE.Color;
  defaultColor: THREE.Color;
  mesh: THREE.Mesh;
  //geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  v = new THREE.Vector3();

  constructor(mesh: THREE.Mesh, material: THREE.MeshStandardMaterial, colorTo: THREE.Color) {
    this.mesh = mesh;
    this.material = material;

    this.colorTo = colorTo;
    this.defaultColor = material.color.clone();
    this.mesh.castShadow = true;
  }

  setPosition(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
  }

  setScale(x: number, y: number, z: number) {
    this.mesh.scale.set(x, y, z);
  }

  lerp(from: number, to: number, speed: number) {
    const amount = (1 - speed) * from + speed * to;
    return Math.abs(from - to) < 0.001 ? to : amount;
  }

  update(delta: number) {
    //this.rotation.x += delta / 2
    //this.rotation.y += delta / 2

    this.clicked
      ? (this.mesh.position.y = MathUtils.lerp(this.mesh.position.y, 1, delta * 5))
      : (this.mesh.position.y = MathUtils.lerp(this.mesh.position.y, 0, delta * 5));

    //console.log(this.position.y)
    this.clicked
      ? (this.mesh.position.y = this.lerp(this.mesh.position.y, 1, delta * 5))
      : (this.mesh.position.y = this.lerp(this.mesh.position.y, 0, delta * 5));

    // this.hovered
    //   ? this.material.color.lerp(this.colorTo, delta * 10)
    //   : this.material.color.lerp(this.defaultColor, delta * 10)

    // this.hovered
    //   ? (this.material.color.lerp(this.colorTo, delta * 10),
    //     (this.material.roughness = lerp(this.material.roughness, 0, delta * 10)),
    //     (this.material.metalness = lerp(this.material.metalness, 1, delta * 10))
    //     )
    //   : (this.material.color.lerp(this.defaultColor, delta),
    //     (this.material.roughness = lerp(this.material.roughness, 1, delta)),
    //     (this.material.metalness = lerp(this.material.metalness, 0, delta)))

    // this.clicked
    //   ? this.scale.set(
    //       MathUtils.lerp(this.scale.x, 1.5, delta * 5),
    //       MathUtils.lerp(this.scale.y, 1.5, delta * 5),
    //       MathUtils.lerp(this.scale.z, 1.5, delta * 5)
    //     )
    //   : this.scale.set(
    //       MathUtils.lerp(this.scale.x, 1.0, delta),
    //       MathUtils.lerp(this.scale.y, 1.0, delta),
    //       MathUtils.lerp(this.scale.z, 1.0, delta)
    //     )

    // this.clicked
    //   ? this.scale.set(
    //       lerp(this.scale.x, 1.5, delta * 5),
    //       lerp(this.scale.y, 1.5, delta * 5),
    //       lerp(this.scale.z, 1.5, delta * 5)
    //     )
    //   : this.scale.set(
    //       lerp(this.scale.x, 1.0, delta),
    //       lerp(this.scale.y, 1.0, delta),
    //       lerp(this.scale.z, 1.0, delta)
    //     )

    // this.clicked ? this.v.set(1.5, 1.5, 1.5) : this.v.set(1.0, 1.0, 1.0)
    // this.scale.lerp(this.v, delta * 5)
  }
}
