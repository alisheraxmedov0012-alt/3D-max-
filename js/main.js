import { createScene } from './scene.js';
import { parsePrompt } from './parser.js';
import { buildHouse, getHouseBoundingBox } from './roomBuilder.js';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const container = document.getElementById('canvas-container');
const { scene, camera, renderer, controls } = createScene(container);

let houseGroup = null;
let loadingIndicator = null;

// ---------- Yordamchi funksiyalar ----------
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor(list) {
    return list[getRandomInt(0, list.length - 1)];
}

// Tasodifiy uy ma'lumotlarini yaratish
function createRandomHouseData() {
    const roomTypes = ['living', 'kitchen', 'bedroom', 'kids', 'bathroom', 'garage', 'corridor'];
    const rooms = [];
    const roomCount = getRandomInt(2, 5);

    // Xonalarni tanlash (birinchi xona living bo'lishi kerak)
    rooms.push({ type: 'living' });
    const available = roomTypes.filter(t => t !== 'living');
    for (let i = 1; i < roomCount; i++) {
        const idx = getRandomInt(0, available.length - 1);
        rooms.push({ type: available[idx] });
    }

    // Tasodifiy mebellar
    const furnitureTypes = [
        'sofa', 'table', 'chair', 'bed', 'wardrobe', 'rug', 'tv',
        'bookshelf', 'fridge', 'fireplace', 'lamp', 'painting',
        'cabinet', 'sink', 'toilet', 'shower', 'car'
    ];
    const furniturePositions = {
        'sofa': [1.5, 0.5, 1.5],
        'table': [-1.5, 0.5, 1.5],
        'chair': [2, 0.5, 2],
        'bed': [0, 0.5, 2],
        'wardrobe': [-2.5, 1.3, 0],
        'rug': [0, 0.1, 0],
        'tv': [0, 1.6, -2.9],
        'bookshelf': [-2, 1.5, -2],
        'fridge': [-2, 1.2, -2],
        'fireplace': [0, 0.3, -2.8],
        'lamp': [0, 0.3, 0],
        'painting': [2, 1.8, -2.95],
        'cabinet': [1.5, 0.45, -1.5],
        'sink': [0, 0.5, -1.5],
        'toilet': [-1, 0.4, 1.5],
        'shower': [0, 0.9, -1.5],
        'car': [0, 0.25, 0]
    };

    // 3-6 ta mebel tanlaymiz
    const furnitureCount = getRandomInt(3, 6);
    const shuffledFurniture = [...furnitureTypes].sort(() => Math.random() - 0.5);
    const furniture = [];
    for (let i = 0; i < furnitureCount && i < shuffledFurniture.length; i++) {
        const type = shuffledFurniture[i];
        if (furniturePositions[type]) {
            furniture.push({ type, position: furniturePositions[type].slice() });
        }
    }

    // Ranglar
    const wallColors = [0xffffff, 0xeeeeee, 0xdddddd, 0xcccccc, 0xbbbbbb, 0xe0c0a0, 0xd3c5b5];
    const floorColors = [0x8a5a2b, 0x5c3a1a, 0x999999, 0xbb5533, 0x886633, 0xcccc99];
    const roofColors = [0xaa5555, 0x885533, 0x666666, 0x995544, 0x774433];

    const materials = {
        wall: getRandomColor(wallColors),
        floor: getRandomColor(floorColors),
        roof: getRandomColor(roofColors)
    };

    return {
        rooms,
        furniture,
        materials,
        style: 'random',
        landscape: Math.random() > 0.4,
        roof: true,
        floors: getRandomInt(1, 3),
        hasWindows: true,
        hasDoors: true,
        windowsCount: 0,
        doorsCount: 0,
        roomDimensions: {},
        random: true
    };
}

// Yuklanish ko'rsatkichi
function showLoading() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.background = 'rgba(0,0,0,0.7)';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.padding = '12px 24px';
        loadingIndicator.style.borderRadius = '6px';
        loadingIndicator.style.zIndex = '20';
        loadingIndicator.textContent = 'Yaratilmoqda...';
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

// Kamerani uyga moslashtirish
function fitCameraToHouse(group) {
    const box = getHouseBoundingBox(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.2;

    camera.position.set(center.x + distance * 0.8, center.y + distance * 0.6, center.z + distance * 0.8);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
}

// Sahna yaratish
function generateHouse(prompt) {
    showLoading();

    setTimeout(() => {
        if (houseGroup) {
            scene.remove(houseGroup);
        }

        const parsed = parsePrompt(prompt);
        // Agar promptda "tasodifiy" bo'lsa, tasodifiy ma'lumotlardan foydalanamiz
        const data = parsed.random ? createRandomHouseData() : parsed;

        houseGroup = buildHouse(data);
        scene.add(houseGroup);

        fitCameraToHouse(houseGroup);
        hideLoading();
    }, 100);
}

// GLTF/GLB formatda yuklab olish
function downloadGLB() {
    if (!houseGroup) {
        alert('Avval uy yarating!');
        return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
        houseGroup,
        (result) => {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'house.glb';
            link.click();
            URL.revokeObjectURL(link.href);
        },
        { binary: true }
    );
}

// ---------- Tugmalar ----------
document.getElementById('generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (prompt) {
        generateHouse(prompt);
    }
});

document.getElementById('random-btn').addEventListener('click', () => {
    generateHouse('tasodifiy uy');
});

document.getElementById('download-btn').addEventListener('click', downloadGLB);

// Boshlang'ich sahna
generateHouse("2 qavatli uy, mehmonxona, oshxona, yotoqxona, garaj, tom, maysa, oq devor, yog'och pol, divan, stol, kamin");

// Animatsiya
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Oyna o'lchami
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
