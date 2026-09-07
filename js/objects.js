import * as THREE from 'three';

// Material yaratish yordamchisi
export function createMaterial(color, opts = {}) {
    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.6,
        metalness: opts.metalness ?? 0.1
    });
    if (opts.transparent) {
        material.transparent = true;
        material.opacity = opts.opacity ?? 0.5;
    }
    return material;
}

// Asosiy quti yaratish
export function createBox(width, height, depth, color, x = 0, y = 0, z = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = createMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// Silindr yaratish
export function createCylinder(radiusTop, radiusBottom, height, color, x = 0, y = 0, z = 0) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    const material = createMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// Sfera yaratish
export function createSphere(radius, color, x = 0, y = 0, z = 0) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = createMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// Deraza ramkasi + shisha
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

    const glass = createBox(windowWidth, windowHeight, 0.05, 0x88aacc, 0, sillHeight + windowHeight / 2, 0);
    glass.material.transparent = true;
    glass.material.opacity = 0.3;

    group.add(...frameParts, glass);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    return group;
}

// Eshik
export function createDoor(doorWidth, doorHeight, wallCenterX, wallCenterZ, wallRotationY) {
    const group = new THREE.Group();
    const door = createBox(doorWidth, doorHeight, 0.1, 0x663300, 0, doorHeight / 2, 0);
    const handle = createBox(0.05, 0.2, 0.05, 0x333333, doorWidth / 2 - 0.1, doorHeight / 2 + 0.8, 0);
    group.add(door, handle);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    return group;
}

// Mebel yaratish (kengaytirilgan)
export function createFurniture(type, position, wallColor = 0xcccccc) {
    const parts = [];

    switch (type) {
        case 'sofa':
            parts.push(createBox(2, 0.5, 1, 0x336699, position[0], position[1], position[2]));
            parts.push(createBox(2, 0.8, 0.2, 0x336699, position[0], position[1] + 0.65, position[2] - 0.4));
            parts.push(createBox(0.9, 0.4, 0.9, 0x4477aa, position[0], position[1] + 0.45, position[2] + 0.2));
            break;

        case 'table':
            parts.push(createBox(1.5, 0.05, 0.8, 0x8b5a2b, position[0], position[1] + 0.25, position[2]));
            for (let dx of [-0.6, 0.6]) {
                for (let dz of [-0.3, 0.3]) {
                    parts.push(createBox(0.1, 0.5, 0.1, 0x5c3a1a, position[0] + dx, position[1] - 0.25, position[2] + dz));
                }
            }
            break;

        case 'chair':
            parts.push(createBox(0.5, 0.05, 0.5, 0x8b5a2b, position[0], position[1] + 0.25, position[2]));
            parts.push(createBox(0.5, 0.4, 0.5, 0x5c3a1a, position[0], position[1] - 0.25, position[2]));
            parts.push(createBox(0.5, 0.5, 0.05, 0x5c3a1a, position[0], position[1] + 0.5, position[2] - 0.2));
            break;

        case 'bed':
            parts.push(createBox(1.6, 0.5, 2, 0x5c3a1a, position[0], position[1], position[2]));
            parts.push(createBox(1.6, 0.2, 2, 0xffffff, position[0], position[1] + 0.35, position[2]));
            parts.push(createBox(0.6, 0.15, 0.5, 0xffffff, position[0], position[1] + 0.5, position[2] - 0.7));
            break;

        case 'wardrobe':
            parts.push(createBox(1.5, 2.4, 0.6, 0x8b5a2b, position[0], position[1], position[2]));
            parts.push(createBox(0.03, 2.2, 0.03, 0x555555, position[0], position[1] + 0.1, position[2] + 0.31));
            break;

        case 'rug':
            parts.push(createBox(2.5, 0.05, 1.8, 0xaa3333, position[0], position[1], position[2]));
            break;

        case 'tv':
            parts.push(createBox(1.2, 0.8, 0.1, 0x111111, position[0], position[1], position[2]));
            parts.push(createBox(0.4, 0.4, 0.3, 0x444444, position[0], position[1] - 0.6, position[2] + 0.05));
            break;

        case 'bookshelf':
            parts.push(createBox(1.2, 2.2, 0.5, 0x8b5a2b, position[0], position[1], position[2]));
            for (let i = 0; i < 4; i++) {
                parts.push(createBox(1.1, 0.05, 0.45, 0x5c3a1a, position[0], position[1] - 0.8 + i * 0.55, position[2]));
            }
            break;

        case 'fridge':
            parts.push(createBox(0.8, 1.8, 0.7, 0xcccccc, position[0], position[1], position[2]));
            parts.push(createBox(0.7, 0.8, 0.1, 0xdddddd, position[0], position[1] + 0.5, position[2] + 0.36));
            parts.push(createBox(0.7, 0.5, 0.1, 0xdddddd, position[0], position[1] - 0.4, position[2] + 0.36));
            break;

        case 'fireplace':
            parts.push(createBox(1.5, 0.8, 0.5, 0x663333, position[0], position[1], position[2]));
            parts.push(createBox(1.2, 0.5, 0.4, 0x333333, position[0], position[1] + 0.4, position[2]));
            break;

        case 'lamp':
            parts.push(createCylinder(0.08, 0.08, 1.5, 0x888888, position[0], position[1] + 0.75, position[2]));
            parts.push(createCylinder(0.3, 0.3, 0.2, 0xffcc44, position[0], position[1] + 1.5, position[2]));
            break;

        case 'painting':
            parts.push(createBox(0.8, 0.6, 0.05, 0xaa8866, position[0], position[1], position[2]));
            parts.push(createBox(0.6, 0.4, 0.06, 0x336699, position[0], position[1], position[2]));
            break;
    }

    return parts;
}

// Daraxt
export function createTree(x, z) {
    const group = new THREE.Group();
    const trunk = createCylinder(0.15, 0.2, 2, 0x664422, 0, 1, 0);
    const canopy1 = createSphere(1.5, 0x33aa33, 0, 2.5, 0);
    const canopy2 = createSphere(1, 0x44cc44, 0.8, 3.2, 0.3);
    group.add(trunk, canopy1, canopy2);
    group.position.set(x, 0, z);
    return group;
}

// Tom (pyramida uslubidagi gable emas, balki oddiy cho'qqi)
export function createRoof(width, depth, height, color) {
    const group = new THREE.Group();
    // Asosiy to'rtburchak asos
    const base = createBox(width, 0.2, depth, color, 0, height, 0);
    group.add(base);
    // Uchburchak qiyaliklar (oddiy konuslar)
    const slopeHeight = height * 0.6;
    const slope = createCylinder(0, width / 2, slopeHeight, color, 0, height + slopeHeight / 2, 0);
    slope.rotation.z = 0;
    slope.scale.set(1, 1, depth / width);
    group.add(slope);
    return group;
}

// Oldingi yaratilgan funksiyalarni eksport qilish
export { createCylinder as cylinder, createSphere as sphere };
                                 
