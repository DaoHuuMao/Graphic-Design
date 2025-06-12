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



// === Build Full Scene ===
function setupScene() {
  const squareSize = 1.53;


  // === Gọi hàm tải mô hình GLB (CẦN BỔ SUNG) ===

    const WhiteKnightPosition1 = new THREE.Vector3(-3.8, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WhiteKnight.glb', WhiteKnightPosition1, 0x555555, 'WKnight1');

    const WhiteKnightPosition2 = new THREE.Vector3(3.8, 0.85, -5.4); 
    loadMyChessPiece('blender_models/WhiteKnight.glb', WhiteKnightPosition2, 0x555555, 'WKnight2');

    const DarkKnightPosition1 = new THREE.Vector3(-3.8, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BlackKnight.glb', DarkKnightPosition1, 0x555555, 'DKnight1');

    const DarkKnightPosition2 = new THREE.Vector3(3.8, 0.85, 5.4); 
    loadMyChessPiece('blender_models/BlackKnight.glb', DarkKnightPosition2, 0x555555, 'DKnight2');



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

