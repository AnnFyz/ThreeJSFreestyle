import * as THREE from "three";

export default class Level_2 {
  scene = new THREE.Scene();

  constructor() {
    this.scene.background = new THREE.Color(0x654321);
  }
}
