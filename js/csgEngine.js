// js/csgEngine.js
import * as THREE from 'three';
import { SUBTRACTION, Evaluator, Brush } from 'https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.16/build/index.module.js';

export class CSGEngine {
    constructor() {
        this.evaluator = new Evaluator();
        this.evaluator.useGroups = false;
    }

    /**
     * Monolit devor geometriyasidan deraza va eshik teshiklarini geometrik o'yib oladi.
     */
    createWallWithCSG(wallLength, wallHeight, wallThickness, openings, wallMaterial) {
        // Asosiy monolit devor
        const wallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
        let resultBrush = new Brush(wallGeo, wallMaterial);
        resultBrush.position.set(0, wallHeight / 2, 0);
        resultBrush.updateMatrixWorld();

        if (!openings || openings.length === 0) {
            return resultBrush;
        }

        // Har bir teshik uchun qirquvchi blok (Cutter)
        openings.forEach(opening => {
            const width = opening.width;
            const height = opening.height;
            const sill = opening.sillHeight || 0;

            // Devordan to'liq o'tishi uchun qalinlik biroz orttiriladi
            const cutterGeo = new THREE.BoxGeometry(width, height, wallThickness + 0.1);
            const cutterBrush = new Brush(cutterGeo);

            const xPos = opening.distanceFromStart - wallLength / 2 + width / 2;
            const yPos = sill + height / 2;

            cutterBrush.position.set(xPos, yPos, 0);
            cutterBrush.updateMatrixWorld();

            // Boolean Subtraction (Devor - Teshik)
            resultBrush = this.evaluator.evaluate(resultBrush, cutterBrush, SUBTRACTION);
        });

        return resultBrush;
    }
}

export const csgEngine = new CSGEngine();

