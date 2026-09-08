import * as THREE from 'three';
import {
    createBox,
    createMaterial,
    createWindow,
    createDoor,
    createFurniture,
    createTree,
    createGableRoof
} from './objects.js';

// Devorni teshiklar bilan qurish
function createWallWithOpenings(wallLength, wallHeight, openings, position, rotationY, wallColor = 0xcccccc) {
    const group = new THREE.Group();
    const thickness = 0.2;

    let currentX = -wallLength / 2;
    openings.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    openings.forEach(opening => {
        const openingWidth = opening.width;
        const openingDistance = opening.distanceFromStart;

        // Oldingi devor qismi
        const beforeWidth = openingDistance - currentX;
        if (beforeWidth > 0.01) {
            const segment = createBox(beforeWidth, wallHeight, thickness, wallColor, currentX + beforeWidth / 2, wallHeight / 2, 0);
            group.add(segment);
        }

        // Teshik joyida deraza yoki eshik
        if (opening.type === 'window') {
            const windowGroup = createWindow(
                openingWidth,
                opening.height,
                opening.sillHeight || 0.8,
                openingDistance + openingWidth / 2,
                0,
                0
            );
            group.add(windowGroup);
        } else if (opening.type === 'door') {
            const doorGroup = createDoor(
                openingWidth,
                opening.height,
                openingDistance + openingWidth / 2,
                0,
                0
            );
            group.add(doorGroup);
        }

        const sill = opening.sillHeight || 0;
        const aboveHeight = wallHeight - sill - opening.height;

        // Yuqoridagi devor qismi
        if (aboveHeight > 0.01) {
            const aboveSegment = createBox(
                openingWidth,
                aboveHeight,
                thickness,
                wallColor,
                openingDistance + openingWidth / 2,
                sill + opening.height + aboveHeight / 2,
                0
            );
            group.add(aboveSegment);
        }

        // Pastdagi devor qismi
        if (sill > 0.01) {
            const sillSegment = createBox(
                openingWidth,
                sill,
                thickness,
                wallColor,
                openingDistance + openingWidth / 2,
                sill / 2,
                0
            );
            group.add(sillSegment);
        }

        currentX = openingDistance + openingWidth;
    });

    // Qolgan devor qismi
    const afterWidth = wallLength / 2 - currentX;
    if (afterWidth > 0.01) {
        const segment = createBox(afterWidth, wallHeight, thickness, wallColor, currentX + afterWidth / 2, wallHeight / 2, 0);
        group.add(segment);
    }

    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotationY;
    return group;
}

// Xona turiga mos standart mebellar
function getDefaultFurniture(roomType) {
    const furniture = [];

    switch (roomType) {
        case 'living':
            furniture.push({ type: 'sofa', position: [1.5, 0.5, 1.5] });
            furniture.push({ type: 'table', position: [-1.5, 0.5, 1.5] });
            furniture.push({ type: 'tv', position: [0, 1.6, -2.9] });
            furniture.push({ type: 'painting', position: [2, 1.8, -2.95] });
            furniture.push({ type: 'rug', position: [0, 0.1, 0] });
            furniture.push({ type: 'lamp', position: [2.5, 0.3, 2.5] });
            break;

        case 'kitchen':
            furniture.push({ type: 'table', position: [0, 0.5, 1] });
            furniture.push({ type: 'fridge', position: [-1.5, 0.9, -1.5] });
            furniture.push({ type: 'cabinet', position: [1.5, 0.45, -1.5] });
            furniture.push({ type: 'sink', position: [0, 0.5, -1.5] });
            furniture.push({ type: 'lamp', position: [0, 0.3, 0] });
            break;

        case 'bedroom':
            furniture.push({ type: 'bed', position: [0, 0.5, 2] });
            furniture.push({ type: 'wardrobe', position: [-2.5, 1.3, 0] });
            furniture.push({ type: 'lamp', position: [1.5, 0.3, 0] });
            furniture.push({ type: 'rug', position: [0, 0.1, -1] });
            break;

        case 'kids':
            furniture.push({ type: 'bed', position: [0, 0.5, 1.5] });
            furniture.push({ type: 'table', position: [-1.5, 0.5, -1.5] });
            furniture.push({ type: 'bookshelf', position: [1.5, 1.2, -1.5] });
            furniture.push({ type: 'chair', position: [-1.8, 0.5, -1.2] });
            break;

        case 'bathroom':
            furniture.push({ type: 'toilet', position: [-1, 0.4, 1.5] });
            furniture.push({ type: 'sink', position: [1, 0.5, 1.5] });
            furniture.push({ type: 'shower', position: [0, 0.9, -1.5] });
            furniture.push({ type: 'cabinet', position: [1.5, 0.45, -1.5] });
            break;

        case 'garage':
            furniture.push({ type: 'car', position: [0, 0.25, 0] });
            break;

        case 'corridor':
            furniture.push({ type: 'painting', position: [0, 1.6, -2.9] });
            break;
    }

    return furniture;
}

// Xona yaratish (materiallar, xonaga mos mebellar)
function createRoom(roomWidth, roomDepth, wallHeight, openings, furniture, materials = {}, roomType = 'living') {
    const group = new THREE.Group();

    const wallColor = materials.wall || 0xcccccc;
    const floorColor = materials.floor || 0x8a5a2b;

    // Pol
    const floor = createBox(roomWidth, 0.2, roomDepth, floorColor, 0, -0.1, 0);
    group.add(floor);

    const halfW = roomWidth / 2;
    const halfD = roomDepth / 2;

    // Devorlar
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.front || [], { x: 0, z: -halfD }, 0, wallColor));
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.back || [], { x: 0, z: halfD }, Math.PI, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.left || [], { x: -halfW, z: 0 }, -Math.PI / 2, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.right || [], { x: halfW, z: 0 }, Math.PI / 2, wallColor));

    // Xonaga mos standart mebellarni qo'shish
    const defaultFurniture = getDefaultFurniture(roomType);
    const allFurniture = [...defaultFurniture, ...furniture];

    allFurniture.forEach(item => {
        const parts = createFurniture(item.type, item.position);
        parts.forEach(part => group.add(part));
    });

    return group;
}

// Xona turiga qarab standart ochilishlar
function getDefaultOpenings(roomType, hasWindows, hasDoors) {
    const openings = { front: [], back: [], left: [], right: [] };

    if (hasWindows) {
        openings.front.push({ type: 'window', width: 1.4, height: 1.2, distanceFromStart: 1.5, sillHeight: 0.8 });
        openings.back.push({ type: 'window', width: 1.4, height: 1.2, distanceFromStart: 3, sillHeight: 0.8 });
        openings.left.push({ type: 'window', width: 1.2, height: 1.2, distanceFromStart: 2, sillHeight: 0.8 });
        openings.right.push({ type: 'window', width: 1.2, height: 1.2, distanceFromStart: 2, sillHeight: 0.8 });
    }

    if (hasDoors) {
        openings.front.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: 4.5, sillHeight: 0 });

        // Ichki eshiklar: xonalar orasida
        if (roomType !== 'living') {
            openings.back.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: 0.5, sillHeight: 0 });
        }
    }

    return openings;
}

// Butun uyni qurish
export function buildHouse(data) {
    const group = new THREE.Group();
    const wallHeight = 3;
    const roomSize = {
        living: { w: 6, d: 6 },
        kitchen: { w: 4, d: 4 },
        bedroom: { w: 4, d: 4 },
        kids: { w: 4, d: 4 },
        bathroom: { w: 3, d: 3 },
        garage: { w: 4, d: 5 },
        corridor: { w: 2, d: 6 }
    };

    const rooms = data.rooms;
    const spacing = 0.3;
    const totalWidth = rooms.reduce((sum, r) => sum + roomSize[r.type].w + spacing, -spacing);
    let cursorX = -totalWidth / 2;

    // Foydalanuvchi so'ragan qo'shimcha mebellarni faqat birinchi xonaga qo'shamiz
    const extraFurniture = data.furniture;

    rooms.forEach((room, index) => {
        const size = roomSize[room.type] || roomSize.living;
        const openings = getDefaultOpenings(room.type, data.hasWindows, data.hasDoors);

        // Birinchi xonaga qo'shimcha mebel qo'shiladi
        const roomExtraFurniture = index === 0 ? extraFurniture : [];

        const roomGroup = createRoom(
            size.w,
            size.d,
            wallHeight,
            openings,
            roomExtraFurniture,
            data.materials,
            room.type
        );
        roomGroup.position.x = cursorX + size.w / 2;
        group.add(roomGroup);

        // Tom qo'shish (agar so'ralsa)
        if (data.roof) {
            const roofColor = data.materials.roof || 0xaa5555;
            const roofMesh = createGableRoof(size.w, size.d, 1.5, roofColor);
            roofMesh.position.set(roomGroup.position.x, wallHeight, 0);
            group.add(roofMesh);
        }

        cursorX += size.w + spacing;
    });

    // Landshaft
    if (data.landscape) {
        const groundWidth = totalWidth + 10;
        const groundDepth = 10;
        const ground = createBox(groundWidth, 0.1, groundDepth, 0x77aa55, 0, -0.3, 0);
        group.add(ground);

        const treePositions = [
            [-groundWidth / 2 + 2, -4],
            [groundWidth / 2 - 2, -4],
            [-groundWidth / 2 + 2, 4],
            [groundWidth / 2 - 2, 4],
            [0, -5],
            [0, 5]
        ];
        treePositions.forEach(([x, z]) => {
            group.add(createTree(x, z));
        });

        const path = createBox(1.5, 0.05, 3, 0x999999, 0, -0.25, -5);
        group.add(path);
    }

    return group;
}

// Uy guruhini sahnaga moslashtirish uchun bounding box
export function getHouseBoundingBox(houseGroup) {
    const box = new THREE.Box3().setFromObject(houseGroup);
    return box;
                           }
                         
