import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sahna, kamera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 5, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

// Yorug'lik
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 10, 5);
directional.castShadow = true;
scene.add(directional);

// Xona obyektlari uchun guruh
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Yordamchi funksiya: parallelepiped yaratish
function createBox(width, height, depth, color, x, y, z) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// Pol
function createFloor() {
    return createBox(6, 0.2, 6, 0x8a5a2b, 0, -0.1, 0);
}

// Devorlar (4 ta)
function createWalls() {
    const roomSize = 6;
    const wallHeight = 3;
    const thickness = 0.2;
    const color = 0xcccccc;
    const walls = [];

    const positions = [
        { x: 0, z: -roomSize/2, rotation: 0, width: roomSize },
        { x: 0, z: roomSize/2, rotation: 0, width: roomSize },
        { x: -roomSize/2, z: 0, rotation: Math.PI / 2, width: roomSize },
        { x: roomSize/2, z: 0, rotation: Math.PI / 2, width: roomSize }
    ];

    positions.forEach(p => {
        const geometry = new THREE.BoxGeometry(p.width, wallHeight, thickness);
        const material = new THREE.MeshStandardMaterial({ color });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(p.x, wallHeight / 2, p.z);
        wall.rotation.y = p.rotation;
        wall.castShadow = true;
        wall.receiveShadow = true;
        walls.push(wall);
    });

    return walls;
}

// Promptdan kalit so'zlarni tahlil qilish (oddiy qoidali parser)
function parsePrompt(text) {
    const lower = text.toLowerCase();
    const objects = [];

    if (lower.includes('divan') || lower.includes('sofa')) {
        objects.push({ type: 'sofa', position: [1.5, 0.5, 1.5] });
    }
    if (lower.includes('stol')) {
        objects.push({ type: 'table', position: [-1.5, 0.5, 1.5] });
    }
    if (lower.includes('karavot') || lower.includes('kravat')) {
        objects.push({ type: 'bed', position: [0, 0.5, 2] });
    }
    if (lower.includes('shkaf')) {
        objects.push({ type: 'wardrobe', position: [-2.5, 1.4, 0] });
    }
    if (lower.includes('gilam')) {
        objects.push({ type: 'rug', position: [0, 0.1, 0] });
    }
    if (lower.includes('televizor') || lower.includes('tv')) {
        objects.push({ type: 'tv', position: [0, 1.6, -2.9] });
    }

    return objects;
}

// Meblelni yaratish (qismlarga bo'lib)
function createObject(obj) {
    const parts = [];

    switch (obj.type) {
        case 'sofa':
            parts.push(createBox(2, 0.5, 1, 0x336699, obj.position[0], obj.position[1], obj.position[2]));
            parts.push(createBox(2, 0.8, 0.2, 0x336699, obj.position[0], obj.position[1] + 0.65, obj.position[2] - 0.4));
            parts.push(createBox(0.9, 0.4, 0.9, 0x4477aa, obj.position[0], obj.position[1] + 0.45, obj.position[2] + 0.2));
            break;

        case 'table':
            parts.push(createBox(1.5, 0.05, 0.8, 0x8b5a2b, obj.position[0], obj.position[1] + 0.25, obj.position[2]));
            for (let dx of [-0.6, 0.6]) {
                for (let dz of [-0.3, 0.3]) {
                    parts.push(createBox(0.1, 0.5, 0.1, 0x5c3a1a, obj.position[0] + dx, obj.position[1] - 0.25, obj.position[2] + dz));
                }
            }
            break;

        case 'bed':
            parts.push(createBox(1.6, 0.5, 2, 0x5c3a1a, obj.position[0], obj.position[1], obj.position[2]));
            parts.push(createBox(1.6, 0.2, 2, 0xffffff, obj.position[0], obj.position[1] + 0.35, obj.position[2]));
            parts.push(createBox(0.6, 0.15, 0.5, 0xffffff, obj.position[0], obj.position[1] + 0.5, obj.position[2] - 0.7));
            break;

        case 'wardrobe':
            parts.push(createBox(1.5, 2.4, 0.6, 0x8b5a2b, obj.position[0], obj.position[1], obj.position[2]));
            break;

        case 'rug':
            parts.push(createBox(2.5, 0.05, 1.8, 0xaa3333, obj.position[0], obj.position[1], obj.position[2]));
            break;

        case 'tv':
            parts.push(createBox(1.2, 0.8, 0.1, 0x111111, obj.position[0], obj.position[1], obj.position[2]));
            break;
    }

    return parts;
}

// Xonani yaratish (pol, devorlar, mebellar)
function generateRoom(prompt) {
    // Avvalgi obyektlarni tozalash
    roomGroup.clear();

    const objectsToAdd = [];
    objectsToAdd.push(createFloor());
    objectsToAdd.push(...createWalls());

    const parsedObjects = parsePrompt(prompt);
    parsedObjects.forEach(obj => {
        objectsToAdd.push(...createObject(obj));
    });

    objectsToAdd.forEach(obj => roomGroup.add(obj));

    controls.target.set(0, 1, 0);
    controls.update();
}

// Tugma bosilganda
document.getElementById('generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (prompt) {
        generateRoom(prompt);
    }
});

// Boshlang'ich sahna
generateRoom('yashash xonasi, divan, stol, gilam');

// Animatsiya sikli
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Oyna o'lchami o'zgarganda
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
  
