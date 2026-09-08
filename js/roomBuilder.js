import * as THREE from 'three';
import {
    createBox,
    createMaterial,
    createWindow,
    createDoor,
    createFurniture,
    createTreeInstances,
    createGableRoof,
    createStairs,
    createFloorSlab
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

// Xona yaratish (materiallar, xonaga mos mebellar, shift bilan)
function createRoom(roomWidth, roomDepth, wallHeight, openings, furniture, materials = {}, roomType = 'living') {
    const group = new THREE.Group();

    const wallColor = materials.wall || 0xcccccc;
    const floorColor = materials.floor || 0x8a5a2b;

    // Pol
    const floor = createFloorSlab(roomWidth, 0.2, roomDepth, floorColor, 0, -0.1, 0);
    group.add(floor);

    // Shift
    const ceiling = createFloorSlab(roomWidth, 0.2, roomDepth, wallColor, 0, wallHeight + 0.1, 0);
    group.add(ceiling);

    const halfW = roomWidth / 2;
    const halfD = roomDepth / 2;

    // Devorlar
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.front || [], { x: 0, z: -halfD }, 0, wallColor));
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.back || [], { x: 0, z: halfD }, Math.PI, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.left || [], { x: -halfW, z: 0 }, -Math.PI / 2, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.right || [], { x: halfW, z: 0 }, Math.PI / 2, wallColor));

    // Mebel
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

        if (roomType !== 'living') {
            openings.back.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: 0.5, sillHeight: 0 });
        }
    }

    return openings;
}

// Bir qavatdagi barcha xonalarni ketma-ket joylashtirish
function createFloorLevel(roomList, spacing, wallHeight, extraFurniture, materials, hasWindows, hasDoors) {
    const group = new THREE.Group();
    const roomSize = {
        living: { w: 6, d: 6 },
        kitchen: { w: 4, d: 4 },
        bedroom: { w: 4, d: 4 },
        kids: { w: 4, d: 4 },
        bathroom: { w: 3, d: 3 },
        garage: { w: 4, d: 5 },
        corridor: { w: 2, d: 6 }
    };

    const totalWidth = roomList.reduce((sum, r) => sum + roomSize[r.type].w + spacing, -spacing);
    let cursorX = -totalWidth / 2;

    roomList.forEach((room, index) => {
        const size = roomSize[room.type] || roomSize.living;
        const openings = getDefaultOpenings(room.type, hasWindows, hasDoors);

        const roomExtraFurniture = index === 0 ? extraFurniture : [];

        const roomGroup = createRoom(
            size.w,
            size.d,
            wallHeight,
            openings,
            roomExtraFurniture,
            materials,
            room.type
        );
        roomGroup.position.x = cursorX + size.w / 2;
        group.add(roomGroup);

        cursorX += size.w + spacing;
    });

    return group;
}

// Butun uyni qurish (ko'p qavatli)
export function buildHouse(data) {
    const group = new THREE.Group();
    const wallHeight = 3;
    const floorThickness = 0.2;
    const spacing = 0.3;
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
    const floors = Math.max(1, data.floors || 1);

    const effectiveFloors = Math.min(floors, rooms.length || 1);
    const roomsPerFloor = Math.ceil(rooms.length / effectiveFloors);

    const extraFurniture = data.furniture;

    // Har bir qavat uchun xonalar
    for (let f = 0; f < effectiveFloors; f++) {
        const startIdx = f * roomsPerFloor;
        const endIdx = Math.min(startIdx + roomsPerFloor, rooms.length);
        const floorRooms = rooms.slice(startIdx, endIdx);

        if (floorRooms.length === 0) continue;

        const yOffset = f * (wallHeight + floorThickness);

        const floorGroup = createFloorLevel(
            floorRooms,
            spacing,
            wallHeight,
            extraFurniture,
            data.materials,
            data.hasWindows,
            data.hasDoors
        );
        floorGroup.position.y = yOffset;
        group.add(floorGroup);

        // Tom faqat eng yuqori qavatda
        if (data.roof && f === effectiveFloors - 1) {
            const firstRoom = floorRooms[0];
            const size = roomSize[firstRoom.type] || roomSize.living;
            const roofColor = data.materials.roof || 0xaa5555;
            const roofMesh = createGableRoof(size.w, size.d, 1.5, roofColor);

            // To'g'ri markazlashtirish: birinchi xonaning markazi
            const firstRoomGroup = floorGroup.children.find(child => child.type === 'Group');
            const firstRoomCenterX = firstRoomGroup ? (firstRoomGroup.position.x || 0) : 0;

            roofMesh.position.set(firstRoomCenterX, yOffset + wallHeight, 0);
            group.add(roofMesh);
        }
    }

    // Zinapoya
    if (effectiveFloors > 1) {
        const stairsWidth = 1.2;
        const stairsDepth = 2.5;
        const stairsHeight = wallHeight;
        const stairs = createStairs(stairsWidth, stairsDepth, stairsHeight, 0x8b5a2b, -2.5, 0.1, -2.5);
        group.add(stairs);
    }

    // Landshaft
    if (data.landscape) {
        const totalWidth = rooms.reduce((sum, r) => sum + roomSize[r.type].w + spacing, -spacing);
        const groundWidth = totalWidth + 10;
        const groundDepth = 10;
        const ground = createFloorSlab(groundWidth, 0.1, groundDepth, 0x77aa55, 0, -0.3, 0);
        group.add(ground);

        // Daraxtlar ro'yxati [x, z]
        const treePositions = [
            [-groundWidth / 2 + 2, -4],
            [groundWidth / 2 - 2, -4],
            [-groundWidth / 2 + 2, 4],
            [groundWidth / 2 - 2, 4],
            [0, -5],
            [0, 5]
        ];

        // 9-bosqich: instancing bilan daraxtlar
        const instancedTrees = createTreeInstances(treePositions);
        group.add(instancedTrees);

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
