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
export function createFurniture(type, position) {
    const parts = [];
    const [x, y, z] = position;

    switch (type) {
        case 'sofa':
            parts.push(createBox(2, 0.5, 1, 0x336699, x, y, z));
            parts.push(createBox(2, 0.8, 0.2, 0x336699, x, y + 0.65, z - 0.4));
            parts.push(createBox(0.9, 0.4, 0.9, 0x4477aa, x, y + 0.45, z + 0.2));
            break;

        case 'table':
            parts.push(createBox(1.5, 0.05, 0.8, 0x8b5a2b, x, y + 0.25, z));
            for (let dx of [-0.6, 0.6]) {
                for (let dz of [-0.3, 0.3]) {
                    parts.push(createBox(0.1, 0.5, 0.1, 0x5c3a1a, x + dx, y - 0.25, z + dz));
                }
            }
            break;

        case 'chair':
            parts.push(createBox(0.5, 0.05, 0.5, 0x8b5a2b, x, y + 0.25, z));
            parts.push(createBox(0.5, 0.4, 0.5, 0x5c3a1a, x, y - 0.25, z));
            parts.push(createBox(0.5, 0.5, 0.05, 0x5c3a1a, x, y + 0.5, z - 0.2));
            break;

        case 'bed':
            parts.push(createBox(1.6, 0.5, 2, 0x5c3a1a, x, y, z));
            parts.push(createBox(1.6, 0.2, 2, 0xffffff, x, y + 0.35, z));
            parts.push(createBox(0.6, 0.15, 0.5, 0xffffff, x, y + 0.5, z - 0.7));
            break;

        case 'wardrobe':
            parts.push(createBox(1.5, 2.4, 0.6, 0x8b5a2b, x, y, z));
            parts.push(createBox(0.03, 2.2, 0.03, 0x555555, x, y + 0.1, z + 0.31));
            break;

        case 'rug':
            parts.push(createBox(2.5, 0.05, 1.8, 0xaa3333, x, y, z));
            break;

        case 'tv':
            parts.push(createBox(1.2, 0.8, 0.1, 0x111111, x, y, z));
            parts.push(createBox(0.4, 0.4, 0.3, 0x444444, x, y - 0.6, z + 0.05));
            break;

        case 'bookshelf':
            parts.push(createBox(1.2, 2.2, 0.5, 0x8b5a2b, x, y, z));
            for (let i = 0; i < 4; i++) {
                parts.push(createBox(1.1, 0.05, 0.45, 0x5c3a1a, x, y - 0.8 + i * 0.55, z));
            }
            break;

        case 'fridge':
            parts.push(createBox(0.8, 1.8, 0.7, 0xcccccc, x, y, z));
            parts.push(createBox(0.7, 0.8, 0.1, 0xdddddd, x, y + 0.5, z + 0.36));
            parts.push(createBox(0.7, 0.5, 0.1, 0xdddddd, x, y - 0.4, z + 0.36));
            break;

        case 'fireplace':
            parts.push(createBox(1.5, 0.8, 0.5, 0x663333, x, y, z));
            parts.push(createBox(1.2, 0.5, 0.4, 0x333333, x, y + 0.4, z));
            break;

        case 'lamp':
            parts.push(createCylinder(0.08, 0.08, 1.5, 0x888888, x, y + 0.75, z));
            parts.push(createCylinder(0.3, 0.3, 0.2, 0xffcc44, x, y + 1.5, z));
            break;

        case 'painting':
            parts.push(createBox(0.8, 0.6, 0.05, 0xaa8866, x, y, z));
            parts.push(createBox(0.6, 0.4, 0.06, 0x336699, x, y, z));
            break;

        case 'cabinet':
            parts.push(createBox(0.8, 0.9, 0.5, 0x8b5a2b, x, y, z));
            parts.push(createBox(0.6, 0.6, 0.1, 0xcccccc, x, y + 0.15, z + 0.26));
            break;

        case 'sink':
            parts.push(createBox(0.6, 0.2, 0.5, 0xffffff, x, y, z));
            parts.push(createCylinder(0.15, 0.1, 0.1, 0xcccccc, x, y + 0.2, z));
            break;

        case 'toilet':
            parts.push(createBox(0.4, 0.4, 0.5, 0xffffff, x, y, z));
            parts.push(createCylinder(0.2, 0.2, 0.3, 0xffffff, x, y + 0.5, z - 0.15));
            break;

        case 'shower':
            parts.push(createBox(0.8, 1.8, 0.8, 0x88aacc, x, y, z));
            parts.push(createBox(0.7, 0.05, 0.7, 0xcccccc, x, y + 0.1, z));
            break;

        case 'car':
            parts.push(createBox(1.8, 0.5, 3.5, 0xcc3333, x, y + 0.25, z));
            parts.push(createBox(1.2, 0.4, 1.8, 0xcc3333, x, y + 0.7, z + 0.3));
            for (let dx of [-0.7, 0.7]) {
                for (let dz of [-1.3, 1.3]) {
                    parts.push(createCylinder(0.25, 0.25, 0.2, 0x222222, x + dx, y, z + dz));
                }
            }
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

// To'g'ri to'rtburchak gable tom (ikki yonbag'irli)
export function createGableRoof(width, depth, height, color) {
    const group = new THREE.Group();

    // Uchburchak kesim
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();

    const extrudeSettings = {
        depth: depth,
        bevelEnabled: false
    };
    const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    roofGeometry.translate(0, 0, -depth / 2);

    const roofMaterial = createMaterial(color, { roughness: 0.4 });
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;

    group.add(roofMesh);

    // Tom tizmasi (ridge cap)
    const ridgeCap = createBox(0.2, 0.15, depth, color, 0, height, 0);
    group.add(ridgeCap);

    return group;
}
