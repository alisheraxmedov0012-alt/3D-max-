import { createScene } from './scene.js';
import { parsePrompt } from './parser.js';
import { buildHouse, getHouseBoundingBox, loadGLTFFurnitureForHouse } from './roomBuilder.js'; 
import { generateHouseJSONFromAI } from './aiService.js';
import { LightingManager } from './lightingManager.js'; 
import { CameraManager } from './cameraManager.js';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const container = document.getElementById('canvas-container');
const { scene, camera, renderer, controls } = createScene(container);

// ---------- 4-bosqich: Renderer soyalari va LightingManager sozlamalari ----------
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const lightingManager = new LightingManager(scene);

// ---------- 5-bosqich: CameraManager instansiyasini yaratish ----------
const cameraManager = new CameraManager(camera, scene, renderer, controls);

let houseGroup = null;
let loadingIndicator = null;
let currentPrompt = '';
let currentCustomColors = { wall: null, floor: null, roof: null };

// ---------- Tahrir rejimi ----------
let editMode = false;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
});
scene.add(transformControls);

// ---------- MOBIL JOYSTICK HODISALARINI CAMERAMANAGER GA UZATISH ----------
function setupMobileJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickBase || !joystickStick) return;

    let touchId = null;
    let baseCenter = { x: 0, y: 0 };
    const maxRadius = 40; // Joystik harakatlanish radiusi (px)

    joystickBase.addEventListener('touchstart', (e) => {
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;

        const rect = joystickBase.getBoundingClientRect();
        baseCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        handleJoystickMove(touch);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                handleJoystickMove(e.changedTouches[i]);
                break;
            }
        }
    }, { passive: false });

    const handleTouchEnd = (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                // Joystikni markazga qaytarish
                joystickStick.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
                // CameraManager ga 0 vektorni uzatish (to'xtash)
                cameraManager.updateJoystickInput(0, 0);
                break;
            }
        }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    function handleJoystickMove(touch) {
        const deltaX = touch.clientX - baseCenter.x;
        const deltaY = touch.clientY - baseCenter.y;
        const distance = Math.hypot(deltaX, deltaY);

        const angle = Math.atan2(deltaY, deltaX);
        const clampedDist = Math.min(distance, maxRadius);

        const moveX = Math.cos(angle) * clampedDist;
        const moveY = Math.sin(angle) * clampedDist;

        // Visual joystik tugmachasini surish
        joystickStick.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px)`;

        // Normallashtirilgan -1.0 va 1.0 oralig'idagi qiymatni CameraManager ga yuborish
        const normX = moveX / maxRadius;
        const normY = moveY / maxRadius;

        cameraManager.updateJoystickInput(normX, normY);
    }
}

// ---------- Xotirani tozalash (Memory Disposal) ----------
function disposeObject(obj) {
    if (!obj) return;

    if (obj.geometry) {
        obj.geometry.dispose();
    }

    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => disposeMaterial(mat));
        } else {
            disposeMaterial(obj.material);
        }
    }
}

function disposeMaterial(mat) {
    if (!mat) return;
    mat.dispose();
    for (const key of Object.keys(mat)) {
        if (mat[key] && mat[key].isTexture) {
            mat[key].dispose();
        }
    }
}

function disposeGroup(group) {
    if (!group) return;
    group.traverse((child) => {
        if (child.isMesh) {
            disposeObject(child);
        }
    });
    scene.remove(group);
}

// ---------- Yordamchi funksiyalar ----------
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor(list) {
    return list[getRandomInt(0, list.length - 1)];
}

function createRandomHouseData() {
    const roomTypes = ['living', 'kitchen', 'bedroom', 'kids', 'bathroom', 'garage', 'corridor'];
    const rooms = [];
    const roomCount = getRandomInt(2, 5);

    rooms.push({ type: 'living' });
    const available = roomTypes.filter(t => t !== 'living');
    for (let i = 1; i < roomCount; i++) {
        const idx = getRandomInt(0, available.length - 1);
        rooms.push({ type: available[idx] });
    }

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

    const furnitureCount = getRandomInt(3, 6);
    const shuffledFurniture = [...furnitureTypes].sort(() => Math.random() - 0.5);
    const furniture = [];
    for (let i = 0; i < furnitureCount && i < shuffledFurniture.length; i++) {
        const type = shuffledFurniture[i];
        if (furniturePositions[type]) {
            furniture.push({ type, position: furniturePositions[type].slice() });
        }
    }

    const wallColors = [0xffffff, 0xeeeeee, 0xdddddd, 0xcccccc, 0xbbbbbb, 0xe0c0a0, 0xd3c5b5];
    const floorColors = [0x8a5a2b, 0x5c3a1a, 0x999999, 0xbb5533, 0x886633, 0xcccc99];
    const roofColors = [0xaa5555, 0x885533, 0x666666, 0x995544, 0x774433];

    return {
        rooms,
        furniture,
        materials: {
            wall: getRandomColor(wallColors),
            floor: getRandomColor(floorColors),
            roof: getRandomColor(roofColors)
        },
        style: 'random',
        landscape: Math.random() > 0.4,
        roof: true,
        floors: getRandomInt(1, 3),
        hasWindows: true,
        hasDoors: true,
        windowsCount: 0,
        doorsCount: 0,
        roomDimensions: {},
        random: true,
        lighting: 'day'
    };
}

function showLoading() {
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.background = 'rgba(0,0,0,0.85)';
        loadingIndicator.style.color = '#fff';
        loadingIndicator.style.padding = '14px 28px';
        loadingIndicator.style.borderRadius = '8px';
        loadingIndicator.style.fontFamily = 'sans-serif';
        loadingIndicator.style.fontSize = '14px';
        loadingIndicator.style.zIndex = '100';
        loadingIndicator.style.pointerEvents = 'none';
        loadingIndicator.textContent = 'AI 3D Sahnani yaratmoqda...';
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function fitCameraToHouse(group) {
    if (!group) return;
    
    if (cameraManager.currentMode === 'orbit') {
        const box = getHouseBoundingBox(group);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2.2;

        camera.position.set(center.x + distance * 0.8, center.y + distance * 0.6, center.z + distance * 0.8);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
    } else {
        cameraManager.setMode(cameraManager.currentMode, group);
    }
}

function updateStats(data) {
    const statsDiv = document.getElementById('stats-content');
    if (!statsDiv) return;

    const roomNames = {
        living: 'yashash xonasi', kitchen: 'oshxona', bedroom: 'yotoqxona',
        kids: 'bolalar xonasi', bathroom: 'hammom', garage: 'garaj', corridor: 'koridor'
    };

    const roomsList = (data.rooms || []).map(r => roomNames[r.type] || r.type).join(', ');
    const totalFurniture = data.furniture ? data.furniture.length : 0;
    const floors = data.floors || 1;

    const styleMap = {
        modern: 'zamonaviy', classic: 'klassik', minimalist: 'minimalizm',
        loft: 'loft', scandinavian: 'skandinaviya', rustic: 'rustik', random: 'tasodifiy'
    };

    const lightingMap = {
        day: 'kunduzgi', sunny: 'quyoshli', sunset: 'kechqurun', night: 'tun', cloudy: 'bulutli'
    };

    statsDiv.innerHTML = `
        <b>Xonalar:</b> ${data.rooms ? data.rooms.length : 0} (${roomsList || '—'})<br>
        <b>Qavatlar:</b> ${floors}<br>
        <b>Mebellar:</b> ${totalFurniture}<br>
        <b>Uslub:</b> ${styleMap[data.style] || 'zamonaviy'}<br>
        <b>Yoritish:</b> ${lightingMap[data.lighting] || 'kunduzgi'}<br>
        <b>Landshaft:</b> ${data.landscape ? 'Bor' : 'Yo\'q'}<br>
        <b>Tom:</b> ${data.roof ? 'Bor' : 'Yo\'q'}
    `;
}

// ---------- Sahna Yaratish Pipeline ----------
async function generateHouse(prompt) {
    if (!prompt) return;

    currentPrompt = prompt;
    localStorage.setItem('lastPrompt', prompt);
    showLoading();

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        deselectObject();

        if (houseGroup) {
            disposeGroup(houseGroup);
            houseGroup = null;
        }

        let data = null;

        if (prompt !== 'tasodifiy uy' && prompt !== 'random') {
            data = await generateHouseJSONFromAI(prompt);
        }

        if (!data) {
            const parsed = await parsePrompt(prompt);
            data = parsed.random ? createRandomHouseData() : parsed;
        }

        if (!data.materials) data.materials = {};
        if (currentCustomColors.wall !== null) data.materials.wall = currentCustomColors.wall;
        if (currentCustomColors.floor !== null) data.materials.floor = currentCustomColors.floor;
        if (currentCustomColors.roof !== null) data.materials.roof = currentCustomColors.roof;

        lightingManager.setTimePreset(data.lighting || 'day');

        houseGroup = buildHouse(data);
        scene.add(houseGroup);

        if (data.modelUrls) {
            loadGLTFFurnitureForHouse(houseGroup, data.modelUrls);
        }

        fitCameraToHouse(houseGroup);
        updateStats(data);
    } catch (error) {
        console.error('Uy yaratishda xatolik yuz berdi:', error);
    } finally {
        hideLoading();
    }
}

// ---------- Eksport va Saqlash ----------
function downloadGLB() {
    if (!houseGroup) {
        alert('Avval uy yarating!');
        return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
        houseGroup,
        (result) => {
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `house_${Date.now()}.glb`;
            link.click();
            URL.revokeObjectURL(link.href);
        },
        (error) => console.error('GLB eksport xatosi:', error),
        { binary: true }
    );
}

function saveProject() {
    if (!currentPrompt) {
        alert('Avval uy yarating!');
        return;
    }
    localStorage.setItem('savedPrompt', currentPrompt);
    alert('Loyiha muvaffaqiyatli saqlandi!');
}

function loadProject() {
    const saved = localStorage.getItem('savedPrompt');
    if (saved) {
        const input = document.getElementById('prompt-input');
        if (input) input.value = saved;
        generateHouse(saved);
    } else {
        alert("Saqlangan loyiha topilmadi.");
    }
}

// ---------- Tahrirlash va Raycasting ----------
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

function onPointerDown(event) {
    if (!editMode || !houseGroup || event.target !== renderer.domElement) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(houseGroup.children, true);

    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target.parent && target.parent !== houseGroup && !target.userData.isInteractable) {
            target = target.parent;
        }
        selectObject(target);
    } else {
        deselectObject();
    }
}

function onKeyDown(event) {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedObject) {
        const obj = selectedObject;
        deselectObject();
        if (obj.parent) obj.parent.remove(obj);
        disposeGroup(obj);
    }
}

function toggleEditMode() {
    editMode = !editMode;
    if (!editMode) deselectObject();
    const btn = document.getElementById('edit-mode-btn');
    if (btn) {
        btn.textContent = editMode ? '✏️ Tahrir rejimidan chiqish' : '✏️ Tahrir rejimi';
        btn.classList.toggle('active', editMode);
    }
}

function setupColorPalette() {
    const wallInput = document.getElementById('wall-color');
    const floorInput = document.getElementById('floor-color');
    const roofInput = document.getElementById('roof-color');
    const lightingSelect = document.getElementById('lighting-select');

    function updateColors() {
        if (wallInput) currentCustomColors.wall = parseInt(wallInput.value.replace('#', ''), 16);
        if (floorInput) currentCustomColors.floor = parseInt(floorInput.value.replace('#', ''), 16);
        if (roofInput) currentCustomColors.roof = parseInt(roofInput.value.replace('#', ''), 16);

        if (currentPrompt && houseGroup) {
            generateHouse(currentPrompt);
        }
    }

    if (wallInput) wallInput.addEventListener('change', updateColors);
    if (floorInput) floorInput.addEventListener('change', updateColors);
    if (roofInput) roofInput.addEventListener('change', updateColors);
    if (lightingSelect) {
        lightingSelect.addEventListener('change', (e) => {
            lightingManager.setTimePreset(e.target.value);
        });
    }
}

function setupPromptExamples() {
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt;
            const input = document.getElementById('prompt-input');
            if (input) input.value = prompt;
            generateHouse(prompt);
        });
    });
}

// ---------- Kamera rejimlari tugmalari ----------
document.getElementById('cam-orbit-btn')?.addEventListener('click', () => {
    cameraManager.setMode('orbit', houseGroup);
});

document.getElementById('cam-fps-btn')?.addEventListener('click', () => {
    cameraManager.setMode('fps', houseGroup);
});

document.getElementById('cam-top-btn')?.addEventListener('click', () => {
    cameraManager.setMode('top', houseGroup);
});

// ---------- Hodisalarni ulash ----------
document.getElementById('generate-btn')?.addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input')?.value.trim();
    if (prompt) generateHouse(prompt);
});

document.getElementById('random-btn')?.addEventListener('click', () => {
    generateHouse('tasodifiy uy');
});

document.getElementById('download-btn')?.addEventListener('click', downloadGLB);
document.getElementById('edit-mode-btn')?.addEventListener('click', toggleEditMode);
document.getElementById('save-btn')?.addEventListener('click', saveProject);
document.getElementById('load-btn')?.addEventListener('click', loadProject);

renderer.domElement.addEventListener('pointerdown', onPointerDown);
window.addEventListener('keydown', onKeyDown);

window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// ---------- Dasturni ishga tushirish ----------
window.addEventListener('load', () => {
    setupColorPalette();
    setupPromptExamples();
    setupMobileJoystick(); // <-- Mobil Joystikni ishga tushirish va ulab qo'yish

    const savedPrompt = localStorage.getItem('lastPrompt');
    if (savedPrompt) {
        const input = document.getElementById('prompt-input');
        if (input) input.value = savedPrompt;
        generateHouse(savedPrompt);
    } else {
        generateHouse("2 qavatli zamonaviy uy, mehmonxona, oshxona, yotoqxona, garaj, tom, maysa, oq devor, yog'och pol, divan, kamin");
    }
});

// ---------- Animatsiya tsikli ----------
function animate() {
    requestAnimationFrame(animate);

    // CameraManager rejimlarini kadrma-kadr yangilash
    cameraManager.update();

    renderer.render(scene, camera);
}
animate();
    
