import * as THREE from 'three';
import { createBox, createWindow, createDoor, createFurniture } from './objects.js';

// Devorni teshiklar bilan qurish (deraza/eshik uchun)
function createWallWithOpenings(wallLength, wallHeight, openings, position, rotationY) {
    // openings: [{type:'window'|'door', width, height, distanceFromStart, sillHeight?}]
    const group = new THREE.Group();
    const thickness = 0.2;
    const color = 0xcccccc;

    let currentX = -wallLength / 2; // devor bo'ylab lokal koordinata (boshlanish nuqtasi)

    openings.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    openings.forEach(opening => {
        const openingWidth = opening.width;
        const openingDistance = opening.distanceFromStart;

        // Oldingi devor qismi
        const beforeWidth = openingDistance - currentX;
        if (beforeWidth > 0.01) {
            const segment = createBox(beforeWidth, wallHeight, thickness, color, currentX + beforeWidth/2, wallHeight/2, 0);
            group.add(segment);
        }

        // Teshik joyida deraza yoki eshik qo'shamiz
        if (opening.type === 'window') {
            const windowGroup = createWindow(
                openingWidth,
                opening.height,
                opening.sillHeight || 0.8,
                openingDistance + openingWidth/2,
                0,
                0
            );
            group.add(windowGroup);
        } else if (opening.type === 'door') {
            const doorGroup = createDoor(
                openingWidth,
                opening.height,
                openingDistance + openingWidth/2,
                0,
                0
            );
            group.add(doorGroup);
        }

        // Yuqoridagi devor qismi (deraza/eshik ustida)
        const aboveHeight = wallHeight - (opening.sillHeight || 0) - opening.height;
        if (aboveHeight > 0.01) {
            const aboveSegment = createBox(
                openingWidth,
                aboveHeight,
                thickness,
                color,
                openingDistance + openingWidth/2,
                (opening.sillHeight || 0) + opening.height + aboveHeight/2,
                0
            );
            group.add(aboveSegment);
        }

        // Pastdagi devor qismi (deraza ostida)
        const sill = opening.sillHeight || 0;
        if (sill > 0.01) {
            const sillSegment = createBox(
                openingWidth,
                sill,
                thickness,
                color,
                openingDistance + openingWidth/2,
                sill/2,
                0
            );
            group.add(sillSegment);
        }

        currentX = openingDistance + openingWidth;
    });

    // Qolgan devor qismi
    const afterWidth = wallLength / 2 - currentX;
    if (afterWidth > 0.01) {
        const segment = createBox(afterWidth, wallHeight, thickness, color, currentX + afterWidth/2, wallHeight/2, 0);
        group.add(segment);
    }

    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotationY;
    return group;
}

// Xona yaratish (pol, devorlar, deraza/eshiklar, mebellar)
export function createRoom(roomWidth, roomDepth, wallHeight, openings, furniture, floorColor = 0x8a5a2b) {
    const group = new THREE.Group();

    // Pol
    const floor = createBox(roomWidth, 0.2, roomDepth, floorColor, 0, -0.1, 0);
    group.add(floor);

    // Devorlar (har biri alohida teshiklar bilan)
    const halfW = roomWidth / 2;
    const halfD = roomDepth / 2;

    // Old devor (z = -halfD)
    const frontWall = createWallWithOpenings(
        roomWidth,
        wallHeight,
        openings.front || [],
        { x: 0, z: -halfD },
        0
    );
    group.add(frontWall);

    // Orqa devor (z = +halfD)
    const backWall = createWallWithOpenings(
        roomWidth,
        wallHeight,
        openings.back || [],
        { x: 0, z: halfD },
        Math.PI
    );
    group.add(backWall);

    // Chap devor (x = -halfW)
    const leftWall = createWallWithOpenings(
        roomDepth,
        wallHeight,
        openings.left || [],
        { x: -halfW, z: 0 },
        -Math.PI / 2
    );
    group.add(leftWall);

    // O'ng devor (x = +halfW)
    const rightWall = createWallWithOpenings(
        roomDepth,
        wallHeight,
        openings.right || [],
        { x: halfW, z: 0 },
        Math.PI / 2
    );
    group.add(rightWall);

    // Mebellar
    furniture.forEach(item => {
        const parts = createFurniture(item.type, item.position);
        parts.forEach(part => group.add(part));
    });

    return group;
}

// Ko'p xonali uy rejasini yaratish (hozircha oddiy: asosiy xona + oshxona)
export function createHouse(roomCount, hasKitchen, hasGarage, hasWindows, hasDoors, furniture) {
    const group = new THREE.Group();

    // Asosiy xona (kattaroq)
    const mainWidth = 6;
    const mainDepth = 6;
    const wallHeight = 3;

    let mainOpenings = {};
    if (hasWindows) {
        mainOpenings.front = [{ type: 'window', width: 1.5, height: 1.2, distanceFromStart: 2, sillHeight: 0.8 }];
        mainOpenings.back = [{ type: 'window', width: 1.5, height: 1.2, distanceFromStart: 3, sillHeight: 0.8 }];
        mainOpenings.left = [{ type: 'window', width: 1.2, height: 1.2, distanceFromStart: 2.5, sillHeight: 0.8 }];
        mainOpenings.right = [{ type: 'window', width: 1.2, height: 1.2, distanceFromStart: 2.5, sillHeight: 0.8 }];
    }
    if (hasDoors) {
        mainOpenings.front.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: 4, sillHeight: 0 });
    }
    const mainRoom = createRoom(mainWidth, mainDepth, wallHeight, mainOpenings, furniture);
    group.add(mainRoom);

    // Oshxona (agar so'ralsa)
    if (hasKitchen) {
        const kitchenWidth = 4;
        const kitchenDepth = 4;
        const kitchenOpenings = {};
        if (hasWindows) {
            kitchenOpenings.front = [{ type: 'window', width: 1.2, height: 1.2, distanceFromStart: 1.5, sillHeight: 0.8 }];
        }
        if (hasDoors) {
            kitchenOpenings.front.push({ type: 'door', width: 0.9, height: 2.1, distanceFromStart: 3, sillHeight: 0 });
        }
        const kitchen = createRoom(kitchenWidth, kitchenDepth, wallHeight, kitchenOpenings, []);
        kitchen.position.x = mainWidth / 2 + kitchenWidth / 2 + 0.2; // yonma-yon
        group.add(kitchen);
    }

    return group;
          }

