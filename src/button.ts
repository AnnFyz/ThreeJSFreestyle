import * as THREE from "three";

export default class Button extends THREE.Mesh {
  name: string;
  scene: THREE.Scene;
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
  //outline object
  outlineMaterial = new THREE.ShaderMaterial();
  outlineObject = new THREE.Mesh();
  secondOutlineObject = new THREE.Mesh();
  outlineThickness = 0.015;
  // second mesh
  hasTwoMeshes = false;
  secondMesh = new THREE.Mesh();
  wireframeSecondMesh: any;
  textureSecondMesh: any;
  materialSecondMesh = new THREE.MeshToonMaterial();
  //floating
  randomNumber = Math.floor(Math.random() * 0.25);
  isFloating = false;
  //callback functions
  firstCallbackFunction = () => {};
  secondCallbackFunction = () => {};
  thirdCallbackFunction = () => {};

  constructor(
    name = "",
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.MeshToonMaterial,
    colorTo: THREE.Color,
    hasTwoMeshes: boolean,
    hasOnlyOutline: boolean,
    outlineThickness: number,
    isFloating = false,
    texture = THREE.Texture.DEFAULT_IMAGE
  ) {
    super();
    if (!hasTwoMeshes) {
      geometry.center();
    }
    this.name = name;
    this.scene = scene;
    this.material = material;
    this.geometry = geometry;
    this.colorTo = colorTo;
    this.defaultColor = material.color.clone();
    this.castShadow = true;
    this.texture = texture;
    this.material.map = this.texture;

    //line object
    var geo = new THREE.EdgesGeometry(this.geometry); // or WireframeGeometry( geometry )
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 100 });
    this.wireframe = new THREE.LineSegments(geo, edgesMaterial);
    this.material.colorWrite = false;
    this.material.polygonOffset = true;
    this.material.polygonOffsetFactor = 1;
    this.material.polygonOffsetUnits = 1;

    //
    this.setScale(1, 1, 1);
    this.scene.add(this);
    this.hasTwoMeshes = hasTwoMeshes;
    this.outlineThickness = outlineThickness;
    if (hasTwoMeshes) {
      //outline object
      this.outlineObject = this.solidify(this);
      this.add(this.outlineObject);
    } else if (hasOnlyOutline) {
      this.outlineObject = this.solidify(this);
      this.add(this.outlineObject);
    } else {
      //outline post processing
      this.add(this.wireframe);
    }

    this.isFloating = isFloating;
    this.setRandomNumber();
  }

  setRandomNumber() {
    //for floating
    this.randomNumber = Math.floor(Math.random() * 0.15);
  }

  setSecondMesh(secondMesh: THREE.Mesh, texture = THREE.Texture.DEFAULT_IMAGE) {
    this.secondMesh = secondMesh;
    this.add(this.secondMesh);

    //line object
    var geo = new THREE.EdgesGeometry(this.secondMesh.geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 100 });
    this.wireframeSecondMesh = new THREE.LineSegments(geo, edgesMaterial);
    this.add(this.wireframeSecondMesh);

    // second mesh material
    this.materialSecondMesh.map = texture;
    this.materialSecondMesh.colorWrite = true;
    this.materialSecondMesh.polygonOffset = true;
    this.materialSecondMesh.polygonOffsetFactor = 1;
    this.materialSecondMesh.polygonOffsetUnits = 1;

    this.secondMesh.material = this.materialSecondMesh;
    //outline object
    this.secondOutlineObject = this.solidify(secondMesh);
    this.add(this.secondOutlineObject);
  }

  lerp(from: number, to: number, speed: number) {
    const amount = (1 - speed) * from + speed * to;
    return Math.abs(from - to) < 0.001 ? to : amount;
  }

  setScale(x: number, y: number, z: number) {
    this.scale.set(x, y, z);
    this.defaultScale = new THREE.Vector3(x, y, z);
    if (this.hasTwoMeshes) {
    }
  }

  setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.defaultPosition = new THREE.Vector3(x, y, z);
    if (this.hasTwoMeshes) {
    }
  }

  //outline as a mesh
  solidify = (mesh: THREE.Mesh) => {
    const THICKNESS = this.outlineThickness;
    const geometry = mesh.geometry;
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
            void main() { 
              vec3 newPosition = position + normal  * ${THICKNESS};
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1);
            }
          `,
      fragmentShader: /* glsl */ `
            void main() { 
              gl_FragColor = vec4(0,0,0,1);
            }
          `,

      side: THREE.BackSide,
    });

    return new THREE.Mesh(geometry, this.outlineMaterial);
  };

  update(delta: number, clock: THREE.Clock) {
    this.hovered ? this.material.color.lerp(this.colorTo, delta * 10) : this.material.color.lerp(this.defaultColor, delta * 10);
    this.clicked ? this.v.set(1.25, 1.25, 1.25) : this.v.set(1.0, 1.0, 1.0);
    this.clicked ? (this.material.colorWrite = true) : (this.material.colorWrite = false);
    if (this.hasTwoMeshes) {
      this.clicked ? (this.wireframeSecondMesh.visible = false) : (this.wireframeSecondMesh.visible = true);
      this.clicked ? (this.materialSecondMesh.colorWrite = true) : (this.materialSecondMesh.colorWrite = false);
    }

    this.scale.lerp(
      new THREE.Vector3(this.v.x * this.defaultScale.x, this.v.y * this.defaultScale.y, this.v.z * this.defaultScale.z),
      delta * 5
    );
  }
}
