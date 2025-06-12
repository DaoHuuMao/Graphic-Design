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
const rockTexture = loader.load('textures/Rock.jpg');

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


const roofTexture = loader.load('textures/wood_table_worn_disp_1k.png');

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

function createFurnitureTable() {
  const group = new THREE.Group();

  const tableTopGeometry = new THREE.BoxGeometry(23, 1.2, 23);
  const legGeometry = new THREE.BoxGeometry(3, 10, 3);
  const legGeometry2 = new THREE.BoxGeometry(15, 0.8, 15);

  const material = new THREE.MeshStandardMaterial({ map: rockTexture });

  // Mặt bàn
  const top = new THREE.Mesh(tableTopGeometry, material);
  top.position.y = -0.1;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 4 chân bàn
  const offsets = [
    [0, 0, 0],
  ];
  offsets.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(x, -4.3, z); // chân bàn từ mặt đất lên
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  });

  // 4 chân bàn
  const offset2 = [
    [0, 0, 0],
  ];
  offset2.forEach(([x, y, z]) => {
    const leg2 = new THREE.Mesh(legGeometry2, material);
    leg2.position.set(x, -9.3, z);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    group.add(leg2);
  });

  return group;
}



// Hàm tạo đồng hồ cờ
function createChessClockModel() {
  const group = new THREE.Group();

  const clockWidth = 3;
  const clockHeight = 1.5;
  const clockDepth = 1;

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.1 });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const handMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

  // Thân đồng hồ
  const body = new THREE.Mesh(new THREE.BoxGeometry(clockWidth, clockHeight, clockDepth), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Mặt đồng hồ 1
  const face1 = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), faceMat);
  face1.position.set(-0.8, 0.2, clockDepth / 2 + 0.01);
  group.add(face1);

  // Mặt đồng hồ 2
  const face2 = face1.clone();
  face2.position.set(0.8, 0.2, clockDepth / 2 + 0.01);
  group.add(face2);

  // Kim giây và phút cho đồng hồ 1
  const secondHand1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), handMat);
  secondHand1.position.set(-0.8, 0.2, clockDepth / 2 + 0.02);
  secondHand1.geometry.translate(0, 0.2, 0); // Đặt gốc xoay ở đáy kim
  group.add(secondHand1);

  const minuteHand1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), handMat);
  minuteHand1.position.set(-0.8, 0.2, clockDepth / 2 + 0.03);
  minuteHand1.geometry.translate(0, 0.15, 0);
  group.add(minuteHand1);

  // Kim giây và phút cho đồng hồ 2
  const secondHand2 = secondHand1.clone();
  secondHand2.position.set(0.8, 0.2, clockDepth / 2 + 0.02);
  group.add(secondHand2);

  const minuteHand2 = minuteHand1.clone();
  minuteHand2.position.set(0.8, 0.2, clockDepth / 2 + 0.03);
  group.add(minuteHand2);

  // Nút bấm
  const buttonGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const button1 = new THREE.Mesh(buttonGeo, buttonMat);
  const button2 = button1.clone();
  button1.position.set(-0.8, clockHeight / 2 + 0.1, 0);
  button2.position.set(0.8, clockHeight / 2 + 0.1, 0);
  button1.rotation.x = Math.PI / 2;
  button2.rotation.x = Math.PI / 2;
  button1.userData.isButton = true;
  button1.userData.player = 'white';
  button2.userData.isButton = true;
  button2.userData.player = 'black';
  group.add(button1, button2);

  // Lưu trữ kim và nút
  group.userData.hands = {
    white: { second: secondHand1, minute: minuteHand1 },
    black: { second: secondHand2, minute: minuteHand2 }
  };
  group.userData.buttons = [button1, button2];

  return group;
}


// === Build Full Scene ===
function setupScene() {
  const squareSize = 1.53;
  const pawnRowBZ = 2.5 * squareSize;
  const pawnRowWZ = -2.5 * squareSize;
  const baseBX = -3.5 * squareSize;
  const baseWX = 3.5 * squareSize;

  scene.add(createFurnitureTable());

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



    const clock = createChessClockModel();
    clock.position.set(-8, 1.15, 0); // Đặt lên bàn, phía sau quân cờ trắng
    clock.rotation.y = Math.PI / 2;   // Quay mặt đồng hồ hướng về bên phải

    scene.add(clock);
    scene.userData.chessClock = clock;

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
  const intersects = getIntersects(event, [...draggablePieces, ...scene.userData.chessClock.userData.buttons]);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.userData.isButton) {
      // Chuyển lượt người chơi
      activePlayer = obj.userData.player === 'white' ? 'black' : 'white';
      console.log(`Switched to ${activePlayer}'s turn`);
    } else {
      controls.enabled = false;
      selectedPiece = obj;
      while (selectedPiece.parent && !draggablePieces.includes(selectedPiece)) {
        selectedPiece = selectedPiece.parent;
      }
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(plane.normal), selectedPiece.position);
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        offset.copy(intersection).sub(selectedPiece.position);
      }
    }
  }
}

function onMouseMove(event) {
  if (!selectedPiece) return;
  getIntersects(event, []);
  if (raycaster.ray.intersectPlane(plane, intersection)) {
    selectedPiece.position.copy(intersection.sub(offset));
    selectedPiece.position.y = 1.01;

    // Giới hạn kéo trong vùng bàn đá
    const squareSize = 1.53;
    const boardSize = 15;
    const half = (squareSize * boardSize) / 2;

    selectedPiece.position.x = Math.max(-half + squareSize / 2, Math.min(half - squareSize / 2, selectedPiece.position.x));
    selectedPiece.position.z = Math.max(-half + squareSize / 2, Math.min(half - squareSize / 2, selectedPiece.position.z));
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

//=====================

function createFireShaderMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;

      // Hàm nhiễu (Noise)
      float rand(vec2 n) { 
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      // Hàm nhiễu mịn (Smooth Noise)
      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u * u * (3.0 - 2.0 * u);
        
        float res = mix(
          mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
          mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), 
          u.y
        );
        return res;
      }

      void main() {
        vec2 uv = vUv;
        uv.y -= time * 0.5; // Tốc độ cháy
        
        // Tạo hiệu ứng lửa
        float n = noise(uv * 5.0 + time * 2.0);
        float n2 = noise(uv * 10.0 - time * 3.0);
        float flame = smoothstep(0.3, 1.0, n * n2);
        
        // Màu lửa (đỏ cam -> vàng -> trắng)
        vec3 col = mix(
          vec3(1.0, 0.3, 0.0), 
          vec3(1.0, 0.8, 0.2), 
          flame
        );
        col = mix(col, vec3(1.0), pow(flame, 3.0)); // Lõi trắng
        
        gl_FragColor = vec4(col, flame * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending // Làm lửa sáng hơn
  });
}
function createFireParticles(count = 500, position = new THREE.Vector3()) {
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Vị trí ngẫu nhiên xung quanh lửa
    positions[i * 3] = (Math.random() - 0.5) * 2.0;
    positions[i * 3 + 1] = Math.random() * 3.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

    // Kích thước ngẫu nhiên
    sizes[i] = 0.1 + Math.random() * 0.3;

    // Màu (đỏ -> cam -> vàng)
    colors[i * 3] = 1.0; // R
    colors[i * 3 + 1] = 0.3 + Math.random() * 0.5; // G
    colors[i * 3 + 2] = 0.0; // B
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png');

  const material = new THREE.PointsMaterial({
    size: 0.2,
    map: particleTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const particleSystem = new THREE.Points(particles, material);
  particleSystem.position.copy(position);
  scene.add(particleSystem);

  return particleSystem;
}
function createSmokeParticles(count = 100, position = new THREE.Vector3()) {
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4.0;
    positions[i * 3 + 1] = Math.random() * 2.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    sizes[i] = 1.0 + Math.random() * 2.0;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const textureLoader = new THREE.TextureLoader();
  const smokeTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/smoke.png');

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: smokeTexture,
    transparent: true,
    opacity: 0.4,
    blending: THREE.NormalBlending,
    depthWrite: false,
    color: 0x888888
  });

  const smokeSystem = new THREE.Points(particles, material);
  smokeSystem.position.copy(position);
  scene.add(smokeSystem);

  return smokeSystem;
}
function setupFireEffect() {
  const firePosition = new THREE.Vector3(-8, 1.6, -10); // Vị trí lò

  // Lửa chính (Shader)
  const fireMat = createFireShaderMaterial();
  const fireMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 4),
    fireMat
  );
  fireMesh.position.copy(firePosition);
  fireMesh.rotation.y = Math.PI;
  scene.add(fireMesh);

  // Tàn lửa bay (Particles)
  const embers = createFireParticles(300, firePosition);

  // Khói (Particles)
  const smoke = createSmokeParticles(100, firePosition);

  const lamp = createRectangularLamp(firePosition);
  scene.add(lamp);

  const fireLight = new THREE.PointLight(0xFFFF00, 500, 15);
  fireLight.position.copy(firePosition).setY(firePosition.y + 2);
  fireLight.castShadow = true;
  scene.add(fireLight);

  // Animation
  function animateFire() {
    requestAnimationFrame(animateFire);
    fireMat.uniforms.time.value += 0.02;

    // Di chuyển tàn lửa bay lên
    const positions = embers.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += 0.02 + Math.random() * 0.01;
      if (positions[i] > 5.0) {
        positions[i] = 0;
      }
    }
    embers.geometry.attributes.position.needsUpdate = true;

    // Di chuyển khói bay lên
    const smokePositions = smoke.geometry.attributes.position.array;
    for (let i = 1; i < smokePositions.length; i += 3) {
      smokePositions[i] += 0.01;
      if (smokePositions[i] > 3.0) {
        smokePositions[i] = 0;
      }
    }
    smoke.geometry.attributes.position.needsUpdate = true;
  }
  animateFire();
}

// Gọi hàm setup
setupFireEffect();

function createRectangularLamp(position) {
  const lampGeometry = new THREE.BoxGeometry(4, 6, 4); // Kích thước: rộng 4, cao 6, sâu 4
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.1,
    roughness: 0.5,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    envMap: envTexture,
    envMapIntensity: 0.8
  });
  const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
  lamp.position.copy(position).setY(4.55); // Điều chỉnh độ cao để bao quanh cột lửa (1.6 + 3)
  lamp.castShadow = true;
  lamp.receiveShadow = true;

  // Thêm một mặt đáy để trông giống đèn bàn
  const baseGeometry = new THREE.BoxGeometry(5, 0.5, 4);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.copy(lamp.position).setY(1.6); // Đặt đáy trên mặt bàn
  base.castShadow = true;
  base.receiveShadow = true;

  const lampGroup = new THREE.Group();
  lampGroup.add(lamp);
  lampGroup.add(base);
  return lampGroup;
}

//========================
function createChair() {
  const chair = new THREE.Group();
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Dark wood color

  // Seat: 8x0.5x8 units
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.5, 8),
    woodMaterial
  );
  seat.position.y = 3.75; // Seat height aligns with table top (~0.6) after y-adjustment
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  // Backrest: 8x8x0.5 units
  const backrestHeight = 8; // Adjusted for proportion
  const backrest = new THREE.Mesh(
    new THREE.BoxGeometry(8, backrestHeight, 0.5),
    woodMaterial
  );

  // Legs: 0.5x7.5x0.5 units
  const legHeight = 7.5;
  const legGeometry = new THREE.BoxGeometry(0.5, legHeight, 0.5);
  const legPositions = [
    [-3.75, -0.25, -3.75], // Front-left
    [3.75, -0.25, -3.75],  // Front-right
    [-3.75, -0.25, 3.75],  // Back-left
    [3.75, -0.25, 3.75],   // Back-right
  ];

  for (let i = 0; i < legPositions.length; i++) {
    const [x, y, z] = legPositions[i];
    const isBackLeg = z > 0;
    const height = isBackLeg ? legHeight + backrestHeight : legHeight; // Back legs support backrest
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, height, 0.5),
      woodMaterial
    );
    leg.position.set(x, y + height / 2 - legHeight / 2, z); // Align legs with seat base
    leg.castShadow = true;
    leg.receiveShadow = true;
    chair.add(leg);
  }

  backrest.position.set(0, legHeight / 2 + backrestHeight / 2, 3.75); // Backrest at rear edge
  backrest.castShadow = true;
  backrest.receiveShadow = true;
  chair.add(backrest);

  return chair;
}

  const chair = createChair();
  chair.position.set(-0.8, -5.25, 12); // Right edge of table (x=11.5+0.5), y aligns seat with table top, z centers
  scene.add(chair);

  const chair2 = createChair();
  chair2.position.set(-0.8, -5.25, -12); // Mirrored across z-axis
  chair2.rotation.y = Math.PI; // Rotate 180 degrees to face the table
  scene.add(chair2);



function createWoodHouse() {
  const house = new THREE.Group();

  const scale = 0.05; // tỉ lệ thu nhỏ (1/5)

  const woodMaterial = new THREE.MeshStandardMaterial({ map : woodTexture });
  const wallHeight = 25.6 * scale;
  const houseWidth = 56 * scale;
  const houseDepth = 72 * scale;
  const wallThickness = 1.6 * scale;

  const doorWidth = 12.8 * scale;

  // Floor
  const floorHeight = 1.2 * scale;
  const floorWidth = (houseWidth + 20 * scale);
  const floorDepth = (houseDepth + 20 * scale);
  const floorGeometry = new THREE.BoxGeometry(floorWidth, floorHeight, floorDepth);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: whiteTexture });
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.y = floorHeight / 2;
  house.add(floorMesh);

  function createWoodenWall(start, end, wallHeight, gap = 1.6 * scale) {
    const wallGroup = new THREE.Group();
    const wallLength = start.distanceTo(end);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const count = Math.floor(wallLength / gap);
    const geometry = new THREE.CylinderGeometry(wallThickness / 2, wallThickness / 2, wallHeight, 16);
    for (let i = 0; i <= count; i++) {
      const position = new THREE.Vector3().copy(direction).multiplyScalar(i * gap).add(start);
      const cyl = new THREE.Mesh(geometry, woodMaterial);
      cyl.position.set(position.x, floorHeight + wallHeight / 2, position.z);
      wallGroup.add(cyl);
    }
    return wallGroup;
  }

  const p1 = new THREE.Vector3(-houseWidth / 2, 0, houseDepth / 2);
  const p2 = new THREE.Vector3(houseWidth / 2, 0, houseDepth / 2);
  const p3 = new THREE.Vector3(houseWidth / 2, 0, -houseDepth / 2);
  const p4 = new THREE.Vector3(-houseWidth / 2, 0, -houseDepth / 2);

  const doorLeftEnd = new THREE.Vector3(-doorWidth / 2, 0, houseDepth / 2);
  const doorLeftStart = p1;
  const frontLeftWall = createWoodenWall(doorLeftStart, doorLeftEnd, wallHeight);
  const doorRightStart = new THREE.Vector3(doorWidth / 2, 0, houseDepth / 2);
  const doorRightEnd = p2;
  const frontRightWall = createWoodenWall(doorRightStart, doorRightEnd, wallHeight);

  house.add(frontLeftWall);
  house.add(frontRightWall);
  house.add(createWoodenWall(p4, p3, wallHeight));
  house.add(createWoodenWall(p4, p1, wallHeight));
  house.add(createWoodenWall(p2, p3, wallHeight));

  // Roof
  const roofHeight = 20 * scale;
  const roofOverhang = 8 * scale;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-(houseWidth / 2 + roofOverhang), 0);
  roofShape.lineTo(0, roofHeight);
  roofShape.lineTo(houseWidth / 2 + roofOverhang, 0);
  roofShape.lineTo(-(houseWidth / 2 + roofOverhang), 0);
  const extrudeSettings = { depth: houseDepth + 2 * roofOverhang, bevelEnabled: false };
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
  const roofMaterial = new THREE.MeshStandardMaterial({ map: roofTexture });
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
  roofMesh.position.set(0, wallHeight + floorHeight, houseDepth / 2 + roofOverhang);
  roofMesh.rotation.y = Math.PI;
  house.add(roofMesh);

  // Railing
  const railingHeight = 4 * scale;
  const railingThickness = 0.3 * scale;
  const railingMaterial = new THREE.MeshStandardMaterial({ map: woodTexture });
  const railingGroup = new THREE.Group();

  function createRailingSegment(length, cutStart = null, cutEnd = null) {
    const segments = [];
    const totalLength = length;
    if (cutStart === null && cutEnd === null) {
      const segment = new THREE.Mesh(new THREE.BoxGeometry(length, railingThickness, railingThickness), railingMaterial);
      segments.push({ mesh: segment, offset: 0 });
    } else {
      if (cutStart > 0) {
        const leftLength = cutStart;
        const leftSegment = new THREE.Mesh(new THREE.BoxGeometry(leftLength, railingThickness, railingThickness), railingMaterial);
        segments.push({ mesh: leftSegment, offset: -(totalLength / 2) + leftLength / 2 });
      }
      if (cutEnd < totalLength) {
        const rightLength = totalLength - cutEnd;
        const rightSegment = new THREE.Mesh(new THREE.BoxGeometry(rightLength, railingThickness, railingThickness), railingMaterial);
        segments.push({ mesh: rightSegment, offset: -(totalLength / 2) + cutEnd + rightLength / 2 });
      }
    }
    return segments;
  }

  const frontSegments = createRailingSegment(floorWidth, (floorWidth - doorWidth) / 2, (floorWidth + doorWidth) / 2);
  const sideLengths = [floorDepth, floorWidth, floorDepth];
  const sidePositions = [
    [floorWidth / 2, floorHeight + railingHeight, 0],
    [0, floorHeight + railingHeight, -floorDepth / 2],
    [-floorWidth / 2, floorHeight + railingHeight, 0]
  ];
  const sideRotations = [Math.PI / 2, 0, Math.PI / 2];
  frontSegments.forEach(seg => {
    seg.mesh.position.set(seg.offset, floorHeight + railingHeight, floorDepth / 2);
    railingGroup.add(seg.mesh);
  });
  for (let i = 0; i < 3; i++) {
    const railingBar = new THREE.Mesh(new THREE.BoxGeometry(sideLengths[i], railingThickness, railingThickness), railingMaterial);
    railingBar.position.set(...sidePositions[i]);
    railingBar.rotation.y = sideRotations[i];
    railingGroup.add(railingBar);
  }

  function createPostsAlongX(zPos, width, cutStart = null, cutEnd = null) {
    const posts = [];
    const spacing = 2 * scale;
    const count = Math.floor(width / spacing) + 1;
    const startX = -width / 2;
    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      if (cutStart !== null && cutEnd !== null && x > cutStart - width / 2 && x < cutEnd - width / 2) continue;
      const post = new THREE.Mesh(new THREE.BoxGeometry(railingThickness, railingHeight, railingThickness), railingMaterial);
      post.position.set(x, floorHeight + railingHeight / 2, zPos);
      posts.push(post);
    }
    return posts;
  }

  function createPostsAlongZ(xPos, depth) {
    const posts = [];
    const spacing = 2 * scale;
    const count = Math.floor(depth / spacing) + 1;
    const startZ = -depth / 2;
    for (let i = 0; i < count; i++) {
      const z = startZ + i * spacing;
      const post = new THREE.Mesh(new THREE.BoxGeometry(railingThickness, railingHeight, railingThickness), railingMaterial);
      post.position.set(xPos, floorHeight + railingHeight / 2, z);
      posts.push(post);
    }
    return posts;
  }

  createPostsAlongX(floorDepth / 2, floorWidth, (floorWidth - doorWidth) / 2, (floorWidth + doorWidth) / 2).forEach(p => railingGroup.add(p));
  createPostsAlongX(-floorDepth / 2, floorWidth).forEach(p => railingGroup.add(p));
  createPostsAlongZ(floorWidth / 2, floorDepth).forEach(p => railingGroup.add(p));
  createPostsAlongZ(-floorWidth / 2, floorDepth).forEach(p => railingGroup.add(p));

  house.add(railingGroup);
  return house;
}

const house = createWoodHouse();
house.position.set(15, 1, 0);
scene.add(house);



// === Animate ===
let whiteTime = 600; // 10 phút (giây)
let blackTime = 600;
let activePlayer = 'white';

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (scene.userData.chessClock) {
    const delta = 1 / 60; // Giả sử 60 FPS
    if (activePlayer === 'white') {
      whiteTime = Math.max(0, whiteTime - delta);
    } else {
      blackTime = Math.max(0, blackTime - delta);
    }

    const { white, black } = scene.userData.chessClock.userData.hands;

    // Cập nhật đồng hồ trắng
    white.second.rotation.z = -(whiteTime % 60) * (Math.PI / 30); // 360°/60s
    white.minute.rotation.z = -(Math.floor(whiteTime / 60)) * (Math.PI / 30); // 360°/60m

    // Cập nhật đồng hồ đen
    black.second.rotation.z = -(blackTime % 60) * (Math.PI / 30);
    black.minute.rotation.z = -(Math.floor(blackTime / 60)) * (Math.PI / 30);
  }

  renderer.render(scene, camera);
}
animate();

