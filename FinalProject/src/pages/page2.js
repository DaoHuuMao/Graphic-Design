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
function createPawn(color) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 });
  
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
function createRook(color) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color });
  
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
  
// Chessboard

function createChessBoard() {
    const board = new THREE.Group();
    const squareSize = 1.53; // Increased from 1 to fit the rook/pawn
    const boardHeight = 0.8;
    const boardSize = 8;
    const fullSize = squareSize * boardSize;
    const woodColor = 0x8b4513;
  
    const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const woodMaterial = new THREE.MeshStandardMaterial({ color: woodColor });
  
    // Create a solid base for the board
    const baseGeometry = new THREE.BoxGeometry(fullSize, boardHeight, fullSize);
    const base = new THREE.Mesh(baseGeometry, woodMaterial);
    base.position.y = boardHeight / 2;
    board.add(base);
  
    // Add squares on top of the base
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const material = (row + col) % 2 === 0 ? whiteMaterial : blackMaterial;
        const square = new THREE.Mesh(
          new THREE.BoxGeometry(squareSize, 0.05, squareSize),
          material
        );
        square.position.set(
          col * squareSize - fullSize / 2 + squareSize / 2,
          boardHeight + 0.025,
          row * squareSize - fullSize / 2 + squareSize / 2
        );
        board.add(square);
      }
    }
  
    // Add wooden frame
    const frameThickness = 0.4;
    const frameHeight = boardHeight + 0.05;
  
    const frameFront = new THREE.Mesh(
      new THREE.BoxGeometry(fullSize + frameThickness * 2, frameHeight, frameThickness),
      woodMaterial
    );
    frameFront.position.set(0, frameHeight / 2, -fullSize / 2 - frameThickness / 2);
    board.add(frameFront);
  
    const frameBack = frameFront.clone();
    frameBack.position.z *= -1;
    board.add(frameBack);
  
    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, fullSize),
      woodMaterial
    );
    frameLeft.position.set(-fullSize / 2 - frameThickness / 2, frameHeight / 2, 0);
    board.add(frameLeft);
  
    const frameRight = frameLeft.clone();
    frameRight.position.x *= -1;
    board.add(frameRight);
  
    return board;
  }
  


const rookb1 = createRook(0x000000);
scene.add(rookb1);
const rookb2 = createRook(0x000000);
scene.add(rookb2);
const rookw1 = createRook(0xffffff);
scene.add(rookw1);
const rookw2 = createRook(0xffffff);
scene.add(rookw2);

const chessBoard = createChessBoard();
scene.add(chessBoard);
const squareSize = 1.53;
const pawnRowBZ = 2.5 * squareSize;
const pawnRowWZ = -2.5* squareSize;
const baseBX = -3.5 * squareSize;
const baseWX = 3.5 * squareSize

for (let i = 0; i < 8; i++) {
  const pawn = createPawn(0x000000);
  pawn.position.set(baseBX + i * squareSize, 1.01, pawnRowBZ);
  scene.add(pawn);
}

for (let i = 0; i < 8; i++) {
    const pawn = createPawn(0xffffff);
    pawn.position.set(baseWX - i * squareSize, 1.01, pawnRowWZ);
    scene.add(pawn);
  }
rookb1.position.set(baseBX, 1.01, 3.5*1.53);  
rookb2.position.set(-baseBX, 1.01, 3.5*1.53);
rookw1.position.set(baseBX, 1.01, -3.5*1.53);  
rookw2.position.set(-baseBX, 1.01, -3.5*1.53);
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
