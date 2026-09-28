// Solo le parti di Three.js usate dal modello 3D di Guglielmo (tree-shaking con esbuild).
// Rigenerare con: tools/build-three.sh
export {
  WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight,
  DataTexture, RGBAFormat, NearestFilter, SRGBColorSpace, BackSide,
  MeshToonMaterial, MeshBasicMaterial, Mesh, Group,
  SphereGeometry, ConeGeometry, CapsuleGeometry, CylinderGeometry, CircleGeometry
} from 'three';
