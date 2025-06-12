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




// === Build Full Scene ===
function setupScene() {
  const squareSize = 1.53;
  
  // === Gọi hàm tải mô hình GLB (CẦN BỔ SUNG) ===

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

