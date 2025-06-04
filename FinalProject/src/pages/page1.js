import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let envTexture = null;

const loader = new THREE.TextureLoader();
const marbleTexture = loader.load('textures/cracked.jpg');
const whiteTexture = loader.load('textures/wood_table_worn_disp_1k.png');
const blackTexture = loader.load('textures/wood_table_worn_diff_1k.jpg');
const woodTexture = loader.load('textures/wood_table_worn_diff_1k.jpg');

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// === Lighting ===

scene.add(new THREE.AmbientLight(0xFEA707, 0.1));

const lampLight = new THREE.PointLight(0xFED383, 1000, 50);
lampLight.position.set(-1, 10, -10);
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(2048, 2048);
lampLight.shadow.bias = -0.005;
scene.add(lampLight);

const subLight = new THREE.PointLight(0xFEA707, 200, 30);
subLight.position.set(4, 4, 6);
subLight.shadow.mapSize.set(2048, 2048);
subLight.shadow.bias = -0.005;
scene.add(subLight);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Interaction ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPiece = null;
let offset = new THREE.Vector3();
let plane = new THREE.Plane();
let intersection = new THREE.Vector3();
const draggablePieces = [];

// === Load EXR Environment Map ===
new EXRLoader().load('textures/hi.exr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  envTexture = texture;
  setupScene();
});

// === Material Helper ===
function makeMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color,
      map: marbleTexture,
      roughness: 0.3,
      metalness: 0.25,
      envMap: envTexture,
      envMapIntensity: 1
    });
}

function loadMyChessPiece(filePath, position, color, pieceName) { // Tạo hàm để dễ quản lý
    const gltfLoader = new GLTFLoader();

    gltfLoader.load(filePath, (gltf) => {
        const model = gltf.scene; // Hoặc gltf.scenes tùy cách xuất file
        model.position.copy(position);
        // Cấu hình tỷ lệ nếu cần
        // model.scale.set(0.1, 0.1, 0.1); // Ví dụ: giảm kích thước

        // Cấu hình đổ bóng cho tất cả các mesh con
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                if (node.material && envTexture) {
                    node.material = node.material.clone();
                    node.material.envMap = envTexture;
                    node.material.needsUpdate = true;
                }

            }
        });

        // Đặt tên hoặc thuộc tính để nhận diện sau này nếu cần
        model.userData.pieceName = pieceName;

        scene.add(model); 
        draggablePieces.push(model);

        console.log(`Loaded ${pieceName} from ${filePath}`);
    }, undefined, (error) => {
        console.error(`An error occurred loading the model ${filePath}`, error);
    });
}



// === Chess Pieces ===
function createPawn(color) {
  const group = new THREE.Group();
  const mat = makeMaterial(color);
  const parts = [
    [new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), 0],
    [new THREE.CylinderGeometry(0.46, 0.55, 0.25, 32), 0.2],
    [new THREE.CylinderGeometry(0.22, 0.35, 0.55, 32), 0.5],
    [new THREE.CylinderGeometry(0.3, 0.3, 0.13, 32), 0.83],
    [new THREE.SphereGeometry(0.32, 32, 32), 1.16]
  ];
  parts.forEach(([geo, y]) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = y;
    mesh.castShadow = true;
    group.add(mesh);
  });
  return group;
}

function createRook(color) {
  const group = new THREE.Group();
  const mat = makeMaterial(color);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.7, 0.4, 32), mat);
  base.position.y = 0;
  group.add(base);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 32), mat);
  lower.position.y = 0.25;
  group.add(lower);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.5, 1.1, 32), mat);
  body.position.y = 0.95;
  group.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 16, 100), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.2;
  group.add(ring);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32), mat);
  collar.position.y = 1.55;
  group.add(collar);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 32), mat);
  top.position.y = 1.65;
  group.add(top);
  for (let i = 0; i < 6; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), mat);
    const angle = (i / 6) * Math.PI * 2;
    const radius = 0.45;
    block.position.set(Math.cos(angle) * radius, 1.85, Math.sin(angle) * radius);
    block.lookAt(0, 1.85, 0);
    group.add(block);
  }
  group.traverse(obj => obj.castShadow = true);
  return group;
}

// === Chess Board ===
function createChessBoard() {
  const board = new THREE.Group();
  const squareSize = 1.53;
  const boardSize = 8;
  const fullSize = squareSize * boardSize;
  const halfSize = fullSize / 2;
  const height = 0.8;

  const woodMaterial  = new THREE.MeshStandardMaterial({ map: woodTexture });
  const base = new THREE.Mesh(new THREE.BoxGeometry(fullSize + 1.5, height + 0.09, fullSize + 1.5), woodMaterial);
  base.position.y = height / 2;
  base.receiveShadow = true;
  board.add(base);
  const whiteMaterial = new THREE.MeshStandardMaterial({
    map: whiteTexture,
    color: 0xffffff, // pure white tint
    roughness: 0.5,
    metalness: 0.2
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    map: blackTexture,
    color: 0x222222, // dark tint over the same texture
    roughness: 0.5,
    metalness: 0.2
  });
  

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const material = (row + col) % 2 === 0 ? whiteMaterial : blackMaterial;
      const tile = new THREE.Mesh(new THREE.BoxGeometry(squareSize, 0.05, squareSize), material);
      tile.position.set(
        col * squareSize - halfSize + squareSize / 2,
        height + 0.025,
        row * squareSize - halfSize + squareSize / 2
      );
      tile.receiveShadow = true;
      board.add(tile);
    }
  }

  return board;
}

// === Build Full Scene ===
function setupScene() {
  const squareSize = 1.53;
  const pawnRowBZ = 2.5 * squareSize;
  const pawnRowWZ = -2.5 * squareSize;
  const baseBX = -3.5 * squareSize;
  const baseWX = 3.5 * squareSize;

  scene.add(createChessBoard());

  const rookb1 = createRook(0x212121); rookb1.position.set(baseBX, 1.01, 3.5 * squareSize);
  const rookb2 = createRook(0x212121); rookb2.position.set(-baseBX, 1.01, 3.5 * squareSize);
  const rookw1 = createRook(0xffffff); rookw1.position.set(baseBX, 1.01, -3.5 * squareSize);
  const rookw2 = createRook(0xffffff); rookw2.position.set(-baseBX, 1.01, -3.5 * squareSize);

  [rookb1, rookb2, rookw1, rookw2].forEach(r => {
    scene.add(r);
    draggablePieces.push(r);
  });

  for (let i = 0; i < 8; i++) {
    const bp = createPawn(0x212121);
    bp.position.set(baseBX + i * squareSize, 1.01, pawnRowBZ);
    scene.add(bp);
    draggablePieces.push(bp);

    const wp = createPawn(0xffffff);
    wp.position.set(baseWX - i * squareSize, 1.01, pawnRowWZ);
    scene.add(wp);
    draggablePieces.push(wp);
  }

  // === Gọi hàm tải mô hình GLB (CẦN BỔ SUNG) ===
    const WhiteQueenPosition = new THREE.Vector3(-0.06, 0.8, -5.4); 
    loadMyChessPiece('blender_models/chess_piece_queen_dark.glb', WhiteQueenPosition, 0x555555, 'WQueen');

    const DarkQueenPosition = new THREE.Vector3(1.55, 0.8, 5.4); 
    loadMyChessPiece('blender_models/chess_piece_queen_white.glb', DarkQueenPosition, 0x555555, 'DQueen');

    const WhiteKingPosition = new THREE.Vector3(-0.85, 0.65, -5.5); 
    loadMyChessPiece('blender_models/chess_piece_king_white.glb', WhiteKingPosition, 0x555555, 'WKing');

    const DarkKingPosition = new THREE.Vector3(-0.95, 0.8, 5.4); 
    loadMyChessPiece('blender_models/chess_piece_king_black.glb', DarkKingPosition, 0x555555, 'DKing');


    const WhiteKnightPosition1 = new THREE.Vector3(-3.8, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WhiteKnight.glb', WhiteKnightPosition1, 0x555555, 'WKnight1');

    const WhiteKnightPosition2 = new THREE.Vector3(3.8, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WhiteKnight.glb', WhiteKnightPosition2, 0x555555, 'WKnight2');

    const DarkKnightPosition1 = new THREE.Vector3(-3.8, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BlackKnight.glb', DarkKnightPosition1, 0x555555, 'DKnight1');

    const DarkKnightPosition2 = new THREE.Vector3(3.8, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BlackKnight.glb', DarkKnightPosition2, 0x555555, 'DKnight2');


    const WhiteBishopPosition1 = new THREE.Vector3(-2.2, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WBishop.glb', WhiteBishopPosition1, 0x555555, 'WBishop1');

    const WhiteBishopPosition2 = new THREE.Vector3(2.5, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WBishop.glb', WhiteBishopPosition2, 0x555555, 'WBishop2');

    const DarkBishopPosition1 = new THREE.Vector3(-2.3, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BBishop.glb', DarkBishopPosition1, 0x555555, 'DBishop1');

    const DarkBishopPosition2 = new THREE.Vector3(2.3, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BBishop.glb', DarkBishopPosition2, 0x555555, 'DBishop2');

}

// === Drag Logic ===
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mousemove', onHoverCheck);

function getIntersects(event, objects) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, true);
}

function onMouseDown(event) {
  const intersects = getIntersects(event, draggablePieces);
  if (intersects.length > 0) {
    controls.enabled = false;
    selectedPiece = intersects[0].object;
    while (selectedPiece.parent && !draggablePieces.includes(selectedPiece)) {
      selectedPiece = selectedPiece.parent;
    }
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), selectedPiece.position);
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      offset.copy(intersection).sub(selectedPiece.position);
    }
  }
}

function onMouseMove(event) {
  if (!selectedPiece) return;
  getIntersects(event, []);
  if (raycaster.ray.intersectPlane(plane, intersection)) {
    selectedPiece.position.copy(intersection.sub(offset));
    selectedPiece.position.y = 1.01;
  }
}

function onMouseUp() {
  selectedPiece = null;
  controls.enabled = true;
}

function onHoverCheck(event) {
  if (selectedPiece) return;
  const intersects = getIntersects(event, draggablePieces);
  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}


// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
