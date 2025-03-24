// AUTHOR: DO DAI DOANH - ID: 20233837
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd3d3d3);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Lights ===
// Ambient Light 
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Directional Light 
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);
//  Controls 
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Material 
const material = new THREE.MeshStandardMaterial({ color: 0x444444 });

//Pawn
function createPawn() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), material);
  group.add(base);

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.55, 0.25, 32), material);
  lower.position.y = 0.2;
  group.add(lower);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.55, 32), material);
  body.position.y = 0.5;
  group.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.13, 32), material);
  neck.position.y = 0.83;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 32), material);
  head.position.y = 1.16;
  group.add(head);

  return group;
}

//Rook 
function createRook() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.7, 0.4, 32), material);
  group.add(base);

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 32), material);
  lower.position.y = 0.25;
  group.add(lower);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.5, 1.1, 32), material);
  body.position.y = 0.95;
  group.add(body);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 16, 100), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.2;
  group.add(ring);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32), material);
  collar.position.y = 1.55;
  group.add(collar);

  const battlementTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 32), material);
  battlementTop.position.y = 1.65;
  group.add(battlementTop);

  const notches = 6;
  for (let i = 0; i < notches; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), material);
    const angle = (i / notches) * Math.PI * 2;
    const radius = 0.45;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    block.position.set(x, 1.85, z);
    block.lookAt(0, 1.85, 0); // make it face outward
    group.add(block);
  }

  return group;
}

const pawn = createPawn();
pawn.position.x = -2;
scene.add(pawn);

const rook = createRook();
rook.position.x = 2;
scene.add(rook);


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
