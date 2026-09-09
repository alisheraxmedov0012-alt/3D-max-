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
import { textureManager } from './textureLoader.js';
import { csgEngine } from './csgEngine.js';
import { gltfLoader } from './gltfLoader.js';

// Obyektlarga soyalarni avtomatik biriktiruvchi yordamchi funksiya
function enableShadows(obj, cast = true, receive = true) {
    obj.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = cast;
            child.receiveShadow = receive;
        }
    });
    return obj;
}

// Materiallarni material tipiga yoki rangiga qarab yaratish
export function getAdvancedMaterial(typeOrColor, defaultColor = 0xcccccc) {
    if (typeOrColor === 'wood') {
        return new THREE.MeshStandardMaterial({
            map: textureManager.createWoodTexture(),
            roughness: 0.4,
            metalness: 0.1
        });
    }
    if (typeOrColor === 'brick') {
        return new THREE.MeshStandardMaterial({
            map: textureManager.createBrickTexture(),
            roughness: 0.8,
            metalness: 0.0
        });
    }
    if (typeOrColor === 'tile') {
        return new THREE.MeshStandardMaterial({
            map: textureManager.createTileTexture(),
            roughness: 0.2,
            metalness: 0.1
        });
    }

    const colorVal = typeof typeOrColor === 'number' ? typeOrColor : defaultColor;
    return new THREE.MeshStandardMaterial({
        color: colorVal,
        roughness: 0.5,
        metalness: 0.1
    });
}

// Xona o'lchamlarini olish
function getRoomSize(roomType, customDimensions = {}) {
    if (customDimensions[roomType]) return customDimensions[roomType];
    const defaultSizes = {
        living: { w: 6, d: 6 },
        kitchen: { w: 4, d: 4 },
        bedroom: { w: 4, d: 4 },
        kids: { w: 4, d: 4 },
        bathroom: { w: 3, d: 3 },
        garage: { w: 5, d: 6 },
        corridor: { w: 2.5, d: 6 },
        office: { w: 4, d: 4 }
    };
    return defaultSizes[roomType] || { w: 5, d: 5 };
}

// CSG orqali monolit devorni o'yish va deraza/eshiklarni o'rnatish
function createWallWithOpenings(wallLength, wallHeight, openings, position, rotationY, wallColor = 0xcccccc) {
    const group = new THREE.Group();
    const thickness = 0.2;
    const wallMaterial = getAdvancedMaterial(wallColor);

    // CSG bilan monolit devor kesish
    const wallMesh = csgEngine.createWallWithCSG(wallLength, wallHeight, thickness, openings, wallMaterial);
    enableShadows(wallMesh);
    group.add(wallMesh);

    // Deraza va eshik karkaslarini o'rnatish
    openings.forEach(opening => {
        const openingWidth = opening.width;
        const openingStart = Math.max(-wallLength / 2, Math.min(wallLength / 2 - openingWidth, opening.distanceFromStart - wallLength / 2));
        const posX = openingStart + openingWidth / 2;

        if (opening.type === 'window') {
            const windowGroup = createWindow(openingWidth, opening.height, opening.sillHeight || 0.8, posX, 0, 0);
            enableShadows(windowGroup);
            group.add(windowGroup);
        } else if (opening.type === 'door') {
            const doorGroup = createDoor(openingWidth, opening.height, posX, 0, 0);
            enableShadows(doorGroup);
            group.add(doorGroup);
        }
    });

    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotationY;
    return group;
}

// Xona turiga mos standart mebellar joylashuvi
function getDefaultFurniture(roomType) {
    switch (roomType) {
        case 'living':
            return [
                { type: 'sofa', position: [0, 0.2, 1.5] },
                { type: 'table', position: [0, 0.35, 0] },
                { type: 'tv', position: [0, 0, -2.5] },
                { type: 'rug', position: [0, 0.01, 0] },
                { type: 'lamp', position: [2.0, 0, 2.0] }
            ];
        case 'kitchen':
            return [
                { type: 'table', position: [1.0, 0.35, 0] },
                { type: 'fridge', position: [-1.2, 0.6, -1.2] },
                { type: 'cabinet', position: [0, 0.2, -1.2] }
            ];
        case 'bedroom':
            return [
                { type: 'bed', position: [0, 0.2, 1.2] },
                { type: 'wardrobe', position: [-1.5, 0.9, -1.2] },
                { type: 'lamp', position: [1.2, 0, -1.2] }
            ];
        case 'kids':
            return [
                { type: 'bed', position: [-1.0, 0.2, 1.0] },
                { type: 'table', position: [1.0, 0.35, -1.0] },
                { type: 'chair', position: [1.0, 0.2, -0.3] }
            ];
        case 'bathroom':
            return [
                { type: 'toilet', position: [-0.8, 0.2, 1.0] },
                { type: 'sink', position: [0.8, 0.25, 1.0] }
            ];
        default:
            return [];
    }
}

// Yagona xonani yig'ish (Procedural va GLTF tayyorgarligi bilan)
function createRoom(roomWidth, roomDepth, wallHeight, openings, furniture = [], materials = {}, roomType = 'living') {
    const group = new THREE.Group();
    group.userData = { type: roomType, isInteractable: true };

    const wallColor = materials.wall || 0xd1c7bd;
    const floorColor = materials.floor || 0x8a5a2b;

    // Pol va Shift
    const floor = enableShadows(createFloorSlab(roomWidth, 0.2, roomDepth, floorColor, 0, -0.1, 0));
    const ceiling = enableShadows(createFloorSlab(roomWidth, 0.2, roomDepth, wallColor, 0, wallHeight + 0.1, 0));
    group.add(floor, ceiling);

    const halfW = roomWidth / 2;
    const halfD = roomDepth / 2;

    // 4 ta monolit CSG devor
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.front || [], { x: 0, z: -halfD }, 0, wallColor));
    group.add(createWallWithOpenings(roomWidth, wallHeight, openings.back || [], { x: 0, z: halfD }, Math.PI, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.left || [], { x: -halfW, z: 0 }, -Math.PI / 2, wallColor));
    group.add(createWallWithOpenings(roomDepth, wallHeight, openings.right || [], { x: halfW, z: 0 }, Math.PI / 2, wallColor));

    // Tezkor procedural (zahira) mebellarni joylashtirish
    const defaultList = getDefaultFurniture(roomType);
    const finalFurniture = furniture.length > 0 ? furniture : defaultList;

    const proceduralGroup = new THREE.Group();
    proceduralGroup.name = "proceduralFurniture";
    finalFurniture.forEach(item => {
        const parts = createFurniture(item.type, item.position);
        parts.forEach(part => proceduralGroup.add(enableShadows(part)));
    });
    group.add(proceduralGroup);

    return group;
}

// Standart teshiklar (deraza/eshik)
function getDefaultOpenings(roomWidth, roomDepth, hasWindows, hasDoors) {
    const openings = { front: [], back: [], left: [], right: [] };

    if (hasWindows) {
        openings.front.push({ type: 'window', width: 1.4, height: 1.2, distanceFromStart: roomWidth * 0.3, sillHeight: 0.9 });
        openings.back.push({ type: 'window', width: 1.4, height: 1.2, distanceFromStart: roomWidth * 0.5, sillHeight: 0.9 });
    }

    if (hasDoors) {
        openings.front.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: roomWidth * 0.7, sillHeight: 0 });
    }

    return openings;
}

// Bir qavatdagi barcha xonalar
function createFloorLevel(roomList, spacing, wallHeight, extraFurniture, data) {
    const group = new THREE.Group();
    const customDims = data.roomDimensions || {};

    let totalWidth = 0;
    const roomSizes = roomList.map(r => {
        const sz = getRoomSize(r.type, customDims);
        totalWidth += sz.w;
        return sz;
    });

    totalWidth += (roomList.length - 1) * spacing;
    let cursorX = -totalWidth / 2;

    roomList.forEach((room, index) => {
        const size = roomSizes[index];
        const openings = getDefaultOpenings(size.w, size.d, data.hasWindows, data.hasDoors);
        const roomExtraFurniture = index === 0 ? extraFurniture : [];

        const roomGroup = createRoom(
            size.w,
            size.d,
            wallHeight,
            openings,
            roomExtraFurniture,
            data.materials || {},
            room.type
        );

        roomGroup.position.set(cursorX + size.w / 2, 0, 0);
        group.add(roomGroup);

        cursorX += size.w + spacing;
    });

    return { floorGroup: group, totalWidth };
}

// Butun bino
export function buildHouse(data) {
    const group = new THREE.Group();
    const wallHeight = 3.0;
    const floorThickness = 0.2;
    const spacing = 0.3;

    const rooms = data.rooms || [{ type: 'living' }];
    const floors = Math.max(1, data.floors || 1);

    const effectiveFloors = Math.min(floors, rooms.length || 1);
    const roomsPerFloor = Math.ceil(rooms.length / effectiveFloors);

    let maxFloorWidth = 0;
    let maxFloorDepth = 6;

    for (let f = 0; f < effectiveFloors; f++) {
        const startIdx = f * roomsPerFloor;
        const endIdx = Math.min(startIdx + roomsPerFloor, rooms.length);
        const floorRooms = rooms.slice(startIdx, endIdx);

        if (floorRooms.length === 0) continue;

        const yOffset = f * (wallHeight + floorThickness);
        const { floorGroup, totalWidth } = createFloorLevel(
            floorRooms,
            spacing,
            wallHeight,
            data.furniture || [],
            data
        );

        floorGroup.position.y = yOffset;
        group.add(floorGroup);

        if (totalWidth > maxFloorWidth) maxFloorWidth = totalWidth;

        if (data.roof && f === effectiveFloors - 1) {
            const roofColor = data.materials?.roof || 0xa53a3a;
            const roofMesh = enableShadows(createGableRoof(totalWidth + 0.6, maxFloorDepth + 0.6, 1.8, roofColor));
            roofMesh.position.set(0, yOffset + wallHeight + 0.1, 0);
            group.add(roofMesh);
        }
    }

    if (effectiveFloors > 1) {
        const stairs = enableShadows(createStairs(1.2, 2.5, wallHeight, 0x5c3a1a, -maxFloorWidth / 2 + 1, 0, -1));
        group.add(stairs);
    }

    if (data.landscape) {
        const groundWidth = maxFloorWidth + 14;
        const groundDepth = maxFloorDepth + 14;
        const ground = enableShadows(createFloorSlab(groundWidth, 0.1, groundDepth, 0x4caf50, 0, -0.15, 0), false, true);
        group.add(ground);

        const treePositions = [
            [-groundWidth / 2 + 2, -groundDepth / 2 + 2],
            [groundWidth / 2 - 2, -groundDepth / 2 + 2],
            [-groundWidth / 2 + 2, groundDepth / 2 - 2],
            [groundWidth / 2 - 2, groundDepth / 2 - 2],
            [0, -groundDepth / 2 + 1.5]
        ];

        const instancedTrees = enableShadows(createTreeInstances(treePositions));
        group.add(instancedTrees);

        const path = enableShadows(createBox(1.8, 0.02, 4, 0x9e9e9e, 0, -0.08, groundDepth / 2 - 2));
        group.add(path);
    }

    return group;
}

// 3D GLTF Modellarni asinxron yuklab joylashtirish (Optimallashgan Paralel vaqtlash)
export async function loadGLTFFurnitureForHouse(houseGroup, modelUrls = {}) {
    if (!modelUrls || Object.keys(modelUrls).length === 0) return;

    const promises = [];

    houseGroup.traverse((child) => {
        if (child.userData && child.userData.isInteractable && child.userData.type) {
            const roomType = child.userData.type;
            const defaultList = getDefaultFurniture(roomType);

            defaultList.forEach((item) => {
                if (modelUrls[item.type]) {
                    const promise = gltfLoader.getFurnitureAsync(item.type, item.position, modelUrls).then((model) => {
                        if (model) {
                            enableShadows(model);
                            child.add(model);

                            // Sifatli 3D model yuklangach, sodda procedural mebelni yashirish
                            const procedural = child.getObjectByName("proceduralFurniture");
                            if (procedural) {
                                procedural.visible = false;
                            }
                        }
                    });
                    promises.push(promise);
                }
            });
        }
    });

    await Promise.allSettled(promises);
}

export function getHouseBoundingBox(houseGroup) {
    return new THREE.Box3().setFromObject(houseGroup);
}
