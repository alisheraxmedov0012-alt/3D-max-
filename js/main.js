import { createScene } from './scene.js';
import { parsePrompt } from './parser.js';
import { buildHouse, getHouseBoundingBox } from './roomBuilder.js';
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const { scene, camera, renderer, controls } = createScene(container);

let houseGroup = null;
let loadingIndicator = null;

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

        const data = parsePrompt(prompt);
        houseGroup = buildHouse(data);
        scene.add(houseGroup);

        fitCameraToHouse(houseGroup);
        hideLoading();
    }, 100);
}

// Tugma
document.getElementById('generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (prompt) {
        generateHouse(prompt);
    }
});

// Boshlang'ich sahna: 2 qavatli uy
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
