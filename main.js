import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { createScene } from './scene.js';
import { parsePrompt } from './parser.js';
import { buildHouse, getHouseBoundingBox } from './roomBuilder.js';

// DOM Elementlari
const container = document.getElementById('canvas-container');
const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const randomBtn = document.getElementById('random-btn');
const downloadBtn = document.getElementById('download-btn');
const editModeBtn = document.getElementById('edit-mode-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');

const wallColorInput = document.getElementById('wall-color');
const floorColorInput = document.getElementById('floor-color');
const roofColorInput = document.getElementById('roof-color');

const statsContent = document.getElementById('stats-content');
const exampleBtns = document.querySelectorAll('.example-btn');

// 3D Sahna va Boshqaruv elementlari
const { scene, camera, renderer, controls } = createScene(container);

let houseGroup = null;
let currentHouseData = null;
let loadingIndicator = null;

// Tahrir rejimi (Edit Mode) va Raycaster
let editMode = false;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// TransformControls (Obyektlarni surish/burish uchun)
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value; // Surish paytida kamerani to'xtatib turamiz
});
scene.add(transformControls);

// Yordamchi tasodifiy ma'lumotlar yaratuvchisi
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor(list) {
    return list[getRandomInt(0, list.length - 1)];
}

function createRandomHouseData() {
    const roomTypes = ['living', 'kitchen', 'bedroom', 'kids', 'bathroom', 'garage', 'corridor'];
    const rooms = [{ type: 'living' }];
    const roomCount = getRandomInt(2, 5);

    const available = roomTypes.filter(t => t !== 'living');
    for (let i = 1; i < roomCount; i++) {
        rooms.push({ type: available[getRandomInt(0, available.length - 1)] });
    }

    const wallColors = [0xffffff, 0xeeeeee, 0xdddddd, 0xcccccc, 0xe0c0a0, 0xd3c5b5];
    const floorColors = [0x8a5a2b, 0x5c3a1a, 0x999999, 0xbb5533, 0x886633];
    const roofColors = [0xaa5555, 0x885533, 0x666666, 0x995544];

    return {
        floors: getRandomInt(1, 3),
        rooms,
        materials: {
            wall: wallColorInput ? parseInt(wallColorInput.value.replace('#', '0x')) : getRandomColor(wallColors),
            floor: floorColorInput ? parseInt(floorColorInput.value.replace('#', '0x')) : getRandomColor(floorColors),
            roof: roofColorInput ? parseInt(roofColorInput.value.replace('#', '0x')) : getRandomColor(roofColors)
        },
        roof: true,
        landscape: Math.random() > 0.4,
        hasWindows: true,
        hasDoors: true
    };
}

// UI Yordamchilari (Yuklanish va Statistika)
function showLoading() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8); color: #fff; padding: 12px 24px;
            border-radius: 8px; z-index: 100; font-family: sans-serif; font-weight: bold;
        `;
        loadingIndicator.textContent = '🏠 Model yaratilmoqda...';
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function updateStats(data, group) {
    if (!statsContent) return;
    let meshCount = 0;
    group.traverse((child) => {
        if (child.isMesh) meshCount++;
    });

    statsContent.innerHTML = `
        🏢 Qavatlar: <strong>${data.floors || 1}-qavat</strong><br>
        🚪 Xonalar: <strong>${data.rooms ? data.rooms.length : 0} ta</strong><br>
        📦 3D Elementlar: <strong>${meshCount} ta mesh</strong><br>
        🏠 Tom: <strong>${data.roof !== false ? 'Mavjud' : 'Yo\'q'}</strong>
    `;
}

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

// Modelni Yaratish va Xotirani Tozalash
function generateHouse(promptText) {
    showLoading();
    deselectObject();

    setTimeout(() => {
        if (houseGroup) {
            scene.remove(houseGroup);
            houseGroup.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        }

        let data;
        if (promptText === 'random' || promptText === 'tasodifiy uy') {
            data = createRandomHouseData();
        } else {
            data = parsePrompt(promptText);
            if (data.random) {
                data = createRandomHouseData();
            }
        }

        // Palette orqali ranglarni qo'llash
        if (wallColorInput) data.materials.wall = parseInt(wallColorInput.value.replace('#', '0x'));
        if (floorColorInput) data.materials.floor = parseInt(floorColorInput.value.replace('#', '0x'));
        if (roofColorInput) data.materials.roof = parseInt(roofColorInput.value.replace('#', '0x'));

        currentHouseData = data;
        houseGroup = buildHouse(data);
        scene.add(houseGroup);

        fitCameraToHouse(houseGroup);
        updateStats(data, houseGroup);
        hideLoading();
    }, 50);
}

// Tahrirlash va Obyektlarni Boshqarish
function selectObject(obj) {
    if (selectedObject === obj) return;
    deselectObject();
    selectedObject = obj;
    transformControls.attach(obj);
}

function deselectObject() {
    transformControls.detach();
    selectedObject = null;
}

function toggleEditMode() {
    editMode = !editMode;
    if (!editMode) deselectObject();
    if (editModeBtn) {
        editModeBtn.textContent = editMode ? '📐 Tahrir rejimidan chiqish' : '✏️ Tahrir rejimi';
        editModeBtn.style.backgroundColor = editMode ? '#ff9800' : '';
    }
}

function onPointerDown(event) {
    if (!editMode || !houseGroup) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(houseGroup.children, true);

    if (intersects.length > 0) {
        selectObject(intersects[0].object);
    } else {
        deselectObject();
    }
}

function onKeyDown(event) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedObject) {
        const obj = selectedObject;
        deselectObject();

        if (obj.parent) obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
    }
}

// GLB Fayl sifatida Yuklab Olish
function downloadGLB() {
    if (!houseGroup) return alert('Avval modelni yarating!');

    const exporter = new GLTFExporter();
    exporter.parse(
        houseGroup,
        (result) => {
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `house_model_${Date.now()}.glb`;
            link.click();
            URL.revokeObjectURL(link.href);
        },
        (error) => console.error('GLB eksport xatosi:', error),
        { binary: true }
    );
}

// Saqlash va Yuklash (LocalStorage)
saveBtn?.addEventListener('click', () => {
    if (!currentHouseData) return alert('Saqlash uchun model mavjud emas!');
    localStorage.setItem('archviz_saved_project', JSON.stringify({
        prompt: promptInput.value,
        data: currentHouseData
    }));
    alert('Loyiha brauzer xotirasiga saqlandi!');
});

loadBtn?.addEventListener('click', () => {
    const saved = localStorage.getItem('archviz_saved_project');
    if (!saved) return alert('Saqlangan loyiha topilmadi!');
    const parsed = JSON.parse(saved);
    promptInput.value = parsed.prompt;
    generateHouse(parsed.prompt);
});

// Event Listener'larni bog'lash
generateBtn?.addEventListener('click', () => {
    const text = promptInput.value.trim();
    if (text) generateHouse(text);
});

randomBtn?.addEventListener('click', () => {
    promptInput.value = 'tasodifiy uy';
    generateHouse('random');
});

downloadBtn?.addEventListener('click', downloadGLB);
editModeBtn?.addEventListener('click', toggleEditMode);

exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        promptInput.value = btn.dataset.prompt;
        generateHouse(btn.dataset.prompt);
    });
});

[wallColorInput, floorColorInput, roofColorInput].forEach(input => {
    input?.addEventListener('input', () => {
        if (promptInput.value.trim()) {
            generateHouse(promptInput.value.trim());
        }
    });
});

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Dastlabki model va Animatsiya sikli
generateHouse("2 qavatli uy, mehmonxona, oshxona, yotoqxona, garaj, tom, maysa");

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
    
