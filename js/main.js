import { createScene } from './scene.js';
import { parsePrompt } from './parser.js';
import { createHouse } from './roomBuilder.js';

const container = document.getElementById('canvas-container');
const { scene, camera, renderer, controls } = createScene(container);

let houseGroup = null;

// Sahna yaratish va eski obyektlarni olib tashlash
function generateHouse(prompt) {
    if (houseGroup) {
        scene.remove(houseGroup);
    }

    const params = parsePrompt(prompt);

    houseGroup = createHouse(
        params.roomCount,
        params.hasKitchen,
        params.hasGarage,
        params.hasWindows,
        params.hasDoors,
        params.furniture
    );

    scene.add(houseGroup);

    controls.target.set(0, 1, 0);
    controls.update();
}

// Tugma
document.getElementById('generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (prompt) {
        generateHouse(prompt);
    }
});

// Boshlang'ich sahna
generateHouse('uch xonali uy, oshxona, derazalar, eshik, divan, stol');

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
