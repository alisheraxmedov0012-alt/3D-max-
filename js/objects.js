import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Texture va Model yuklovchilar
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

// Tayyor GLTF 3D modellar registri (agar CDN yoki mahalliy URL bo'lsa)
export const MODEL_REGISTRY = {
    // Masalan: sofa: 'assets/models/sofa.glb'
};

// 1. PBR Material yaratish yordamchisi (Teksturalar bilan)
export function createMaterial(colorOrOpts, opts = {}) {
    let config = {};

    if (typeof colorOrOpts === 'number' || typeof colorOrOpts === 'string' || colorOrOpts instanceof THREE.Color) {
        config = { color: colorOrOpts, ...opts };
    } else {
        config = colorOrOpts || {};
    }

    const matConfig = {
        color: config.color ?? 0xffffff,
        roughness: config.roughness ?? 0.6,
        metalness: config.metalness ?? 0.1
    };

    if (config.map) matConfig.map = config.map;
    if (config.normalMap) matConfig.normalMap = config.normalMap;
    if (config.roughnessMap) matConfig.roughnessMap = config.roughnessMap;

    const material = new THREE.MeshStandardMaterial(matConfig);

    if (config.transparent) {
        material.transparent = true;
        material.opacity = config.opacity ?? 0.5;
    }

    // Tekstura takrorlanishini (Repeat/Tiling) sozlash
    if (config.repeat && material.map) {
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
        material.map.repeat.set(config.repeat[0], config.repeat[1]);

        if (material.normalMap) {
            material.normalMap.wrapS = THREE.RepeatWrapping;
            material.normalMap.wrapT = THREE.RepeatWrapping;
            material.normalMap.repeat.set(config.repeat[0], config.repeat[1]);
        }
    }

    return material;
}

// 2. Asosiy Primitive Shapkalar
export function createBox(width, height, depth, color, x = 0, y = 0, z = 0, opts = {}) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = createMaterial(color, opts);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function createCylinder(radiusTop, radiusBottom, height, color, x = 0, y = 0, z = 0, opts = {}) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24);
    const material = createMaterial(color, opts);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function createSphere(radius, color, x = 0, y = 0, z = 0, opts = {}) {
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = createMaterial(color, opts);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// 3. Deraza Ramkasi + Shisha
export function createWindow(windowWidth, windowHeight, sillHeight, wallCenterX, wallCenterZ, wallRotationY) {
    const group = new THREE.Group();
    const frameThickness = 0.1;
    const frameColor = 0xcccccc;

    const frameParts = [
        createBox(frameThickness, windowHeight, frameThickness, frameColor, -windowWidth / 2, sillHeight + windowHeight / 2, 0),
        createBox(frameThickness, windowHeight, frameThickness, frameColor, windowWidth / 2, sillHeight + windowHeight / 2, 0),
        createBox(windowWidth + frameThickness * 2, frameThickness, frameThickness, frameColor, 0, sillHeight, 0),
        createBox(windowWidth + frameThickness * 2, frameThickness, frameThickness, frameColor, 0, sillHeight + windowHeight, 0)
    ];

    const glass = createBox(windowWidth, windowHeight, 0.04, 0x88aacc, 0, sillHeight + windowHeight / 2, 0, { transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.9 });

    group.add(...frameParts, glass);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    group.userData = { isInteractable: false, type: 'window' };
    return group;
}

// 4. Eshik Moduli
export function createDoor(doorWidth, doorHeight, wallCenterX, wallCenterZ, wallRotationY) {
    const group = new THREE.Group();
    const door = createBox(doorWidth, doorHeight, 0.08, 0x5c3a1a, 0, doorHeight / 2, 0, { roughness: 0.7 });
    const handle = createBox(0.04, 0.18, 0.08, 0x222222, doorWidth / 2 - 0.1, doorHeight / 2, 0, { metalness: 0.8, roughness: 0.2 });

    group.add(door, handle);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    group.userData = { isInteractable: true, type: 'door' };
    return group;
}

// 5. Protsedural Mebel Yaratish (Fallback - Guruhlangan holda)
export function createProceduralFurniture(type) {
    const group = new THREE.Group();
    group.userData = { type, isInteractable: true };

    switch (type) {
        case 'sofa':
            group.add(
                createBox(2, 0.4, 0.9, 0x2c3e50, 0, 0.2, 0),
                createBox(2, 0.8, 0.2, 0x2c3e50, 0, 0.6, -0.35),
                createBox(0.2, 0.5, 0.9, 0x1a252f, -0.9, 0.35, 0),
                createBox(0.2, 0.5, 0.9, 0x1a252f, 0.9, 0.35, 0)
            );
            break;

        case 'table':
            group.add(createBox(1.6, 0.06, 0.9, 0x8b5a2b, 0, 0.75, 0));
            for (let dx of [-0.7, 0.7]) {
                for (let dz of [-0.35, 0.35]) {
                    group.add(createCylinder(0.04, 0.03, 0.72, 0x222222, dx, 0.36, dz));
                }
            }
            break;

        case 'chair':
            group.add(
                createBox(0.45, 0.05, 0.45, 0x8b5a2b, 0, 0.45, 0),
                createBox(0.45, 0.45, 0.04, 0x5c3a1a, 0, 0.7, -0.2)
            );
            for (let dx of [-0.18, 0.18]) {
                for (let dz of [-0.18, 0.18]) {
                    group.add(createCylinder(0.025, 0.02, 0.43, 0x222222, dx, 0.215, dz));
                }
            }
            break;

        case 'bed':
            group.add(
                createBox(1.6, 0.3, 2.0, 0x5c3a1a, 0, 0.15, 0),
                createBox(1.5, 0.25, 1.9, 0xf5f5f5, 0, 0.35, 0.02),
                createBox(1.6, 0.9, 0.1, 0x3d2314, 0, 0.45, -0.95),
                createBox(0.6, 0.12, 0.4, 0xffffff, -0.35, 0.5, -0.65),
                createBox(0.6, 0.12, 0.4, 0xffffff, 0.35, 0.5, -0.65)
            );
            break;

        case 'wardrobe':
            group.add(
                createBox(1.4, 2.2, 0.6, 0x4a2e16, 0, 1.1, 0),
                createBox(0.02, 0.3, 0.02, 0xd4af37, -0.05, 1.1, 0.31),
                createBox(0.02, 0.3, 0.02, 0xd4af37, 0.05, 1.1, 0.31)
            );
            break;

        case 'rug':
            group.add(createBox(2.4, 0.02, 1.6, 0x8e24aa, 0, 0.01, 0, { roughness: 0.9 }));
            break;

        case 'tv':
            group.add(
                createBox(1.4, 0.8, 0.06, 0x111111, 0, 1.2, 0, { roughness: 0.2, metalness: 0.8 }),
                createBox(0.4, 0.02, 0.3, 0x222222, 0, 0.75, 0),
                createBox(0.08, 0.4, 0.08, 0x222222, 0, 0.95, 0),
                createBox(1.6, 0.45, 0.4, 0x333333, 0, 0.225, 0)
            );
            break;

        case 'lamp':
            group.add(
                createCylinder(0.2, 0.2, 0.03, 0x222222, 0, 0.015, 0),
                createCylinder(0.02, 0.02, 1.4, 0xd4af37, 0, 0.7, 0, { metalness: 0.8 }),
                createCylinder(0.25, 0.35, 0.35, 0xfff8e7, 0, 1.4, 0, { roughness: 0.3 })
            );
            break;

        default:
            // Noma'lum mebellar uchun standart kubik
            group.add(createBox(0.8, 0.8, 0.8, 0x9e9e9e, 0, 0.4, 0));
            break;
    }

    return group;
}

// 6. Asinxron GLTF / Protsedural Mebel Yuklovchi
export async function loadFurnitureModel(type, position = [0, 0, 0]) {
    const [x, y, z] = position;

    // Agar model bazada bo'lsa, GLTF faylini yuklaymiz
    if (MODEL_REGISTRY[type]) {
        try {
            const gltf = await gltfLoader.loadAsync(MODEL_REGISTRY[type]);
            const model = gltf.scene;
            model.position.set(x, y, z);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            model.userData = { type, isInteractable: true };
            return model;
        } catch (error) {
            console.warn(`GLTF modelini yuklashda xatolik (${type}), protsedural modelga o'tiladi:`, error);
        }
    }

    // Modellik mavjud bo'lmasa protsedural model yaratamiz
    const furnitureGroup = createProceduralFurniture(type);
    furnitureGroup.position.set(x, y, z);
    return furnitureGroup;
}

// Sync versiya (eski kodlar bilan moslik uchun)
export function createFurniture(type, position) {
    const group = createProceduralFurniture(type);
    group.position.set(position[0], position[1], position[2]);
    return [group]; // Array shaklida qaytarish
}

// 7. Gable Roof (Ikki yonbag'irli tom)
export function createGableRoof(width, depth, height, color) {
    const group = new THREE.Group();

    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();

    const extrudeSettings = { depth: depth, bevelEnabled: false };
    const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    roofGeometry.translate(0, 0, -depth / 2);

    const roofMaterial = createMaterial(color, { roughness: 0.4 });
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;

    group.add(roofMesh);

    const ridgeCap = createBox(0.2, 0.15, depth, color, 0, height, 0);
    group.add(ridgeCap);

    group.userData = { isInteractable: false, type: 'roof' };
    return group;
}

// 8. Zinapoya
export function createStairs(width, depth, height, color = 0x8b5a2b, x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    const stepCount = 10;
    const stepHeight = height / stepCount;
    const treadDepth = depth / stepCount;

    for (let i = 0; i < stepCount; i++) {
        const step = createBox(
            width, stepHeight, treadDepth, color,
            0, stepHeight * (i + 0.5), treadDepth * i + treadDepth / 2
        );
        group.add(step);
    }

    group.position.set(x, y, z);
    group.userData = { isInteractable: false, type: 'stairs' };
    return group;
}

// 9. Instanced Trees (Yuqori unumdorlikdagi daraxtlar)
export function createTreeInstances(positions) {
    if (!positions || positions.length === 0) return new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 2, 8);
    const canopyGeometry = new THREE.SphereGeometry(1.5, 8, 8);

    const trunkMaterial = createMaterial(0x664422);
    const canopyMaterial = createMaterial(0x2e7d32, { roughness: 0.8 });

    const count = positions.length;
    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, count);

    const dummy = new THREE.Object3D();

    positions.forEach((pos, i) => {
        dummy.position.set(pos[0], 1.0, pos[1]);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(pos[0], 2.5, pos[1]);
        dummy.updateMatrix();
        canopies.setMatrixAt(i, dummy.matrix);
    });

    trunks.castShadow = true;
    trunks.receiveShadow = true;
    canopies.castShadow = true;
    canopies.receiveShadow = true;

    const group = new THREE.Group();
    group.add(trunks, canopies);
    return group;
}

// 10. Pol plitasi (Floor Slab) - Xatolikni bartaraf etish uchun qo'shildi
export function createFloorSlab(width, height, depth, color, x = 0, y = 0, z = 0, opts = {}) {
    const mesh = createBox(width, height, depth, color, x, y, z, opts);
    mesh.userData = { isInteractable: false, type: 'floor' };
    return mesh;
            }
                
