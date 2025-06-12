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


  scene.add(createFurnitureTable());


  // === Gọi hàm tải mô hình GLB (CẦN BỔ SUNG) ===
    const WhiteQueenPosition = new THREE.Vector3(-0.06, 0.8, -5.4); 
    loadMyChessPiece('blender_models/chess_piece_queen_dark.glb', WhiteQueenPosition, 0x555555, 'WQueen');

    const DarkQueenPosition = new THREE.Vector3(1.55, 0.8, 5.4); 
    loadMyChessPiece('blender_models/chess_piece_queen_white.glb', DarkQueenPosition, 0x555555, 'DQueen');




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

