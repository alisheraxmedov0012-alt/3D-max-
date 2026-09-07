import * as THREE from 'three';

// Asosiy quti yaratish
export function createBox(width, height, depth, color, x = 0, y = 0, z = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
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

    // Ramka (4 ta uzun to'rtburchak)
    const frameColor = 0xcccccc;
    const frameParts = [
        createBox(frameThickness, windowHeight, frameThickness, frameColor, -windowWidth/2, sillHeight + windowHeight/2, 0),
        createBox(frameThickness, windowHeight, frameThickness, frameColor, windowWidth/2, sillHeight + windowHeight/2, 0),
        createBox(windowWidth + frameThickness*2, frameThickness, frameThickness, frameColor, 0, sillHeight, 0),
        createBox(windowWidth + frameThickness*2, frameThickness, frameThickness, frameColor, 0, sillHeight + windowHeight, 0)
    ];

    // Shisha
    const glass = createBox(windowWidth, windowHeight, 0.05, 0x88aacc, 0, sillHeight + windowHeight/2, 0);
    glass.material.transparent = true;
    glass.material.opacity = 0.3;

    group.add(...frameParts, glass);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    return group;
}

// Eshik (oddiy to'rtburchak)
export function createDoor(doorWidth, doorHeight, wallCenterX, wallCenterZ, wallRotationY) {
    const group = new THREE.Group();
    const door = createBox(doorWidth, doorHeight, 0.1, 0x663300, 0, doorHeight/2, 0);
    const handle = createBox(0.05, 0.2, 0.05, 0x333333, doorWidth/2 - 0.1, doorHeight/2 + 0.8, 0);

    group.add(door, handle);
    group.position.set(wallCenterX, 0, wallCenterZ);
    group.rotation.y = wallRotationY;
    return group;
}

// Mebel yaratish (avvalgi funksiyalarni qayta ishlatish)
export function createFurniture(type, position) {
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

        case 'bed':
            parts.push(createBox(1.6, 0.5, 2, 0x5c3a1a, position[0], position[1], position[2]));
            parts.push(createBox(1.6, 0.2, 2, 0xffffff, position[0], position[1] + 0.35, position[2]));
            parts.push(createBox(0.6, 0.15, 0.5, 0xffffff, position[0], position[1] + 0.5, position[2] - 0.7));
            break;

        case 'wardrobe':
            parts.push(createBox(1.5, 2.4, 0.6, 0x8b5a2b, position[0], position[1], position[2]));
            break;

        case 'rug':
            parts.push(createBox(2.5, 0.05, 1.8, 0xaa3333, position[0], position[1], position[2]));
            break;

        case 'tv':
            parts.push(createBox(1.2, 0.8, 0.1, 0x111111, position[0], position[1], position[2]));
            break;
    }

    return parts;
}
