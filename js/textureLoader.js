// js/textureLoader.js
import * as THREE from 'three';

// Procedural Texture Generator - Tashqi fayllarsiz yuqori sifatli teksturalar hosil qilish
export class TextureManager {
    constructor() {
        this.cache = new Map();
    }

    // Yog'och parket teksturasi
    createWoodTexture() {
        if (this.cache.has('wood')) return this.cache.get('wood');

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(0, 0, 512, 512);

        // Yog'och tolalari va taxta chiziqlari
        ctx.fillStyle = '#6e4520';
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillRect(x, y, Math.random() * 80 + 20, 2);
        }

        // Taxta ajratgichlar
        ctx.strokeStyle = '#3d2510';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 512; i += 64) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);

        this.cache.set('wood', texture);
        return texture;
    }

    // G'isht devor teksturasi
    createBrickTexture() {
        if (this.cache.has('brick')) return this.cache.get('brick');

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#b5b5b5'; // Sement javobi
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#a24836'; // G'isht rangi
        const rows = 16;
        const cols = 8;
        const rHeight = 512 / rows;
        const cWidth = 512 / cols;

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2) * (cWidth / 2);
            for (let c = -1; c < cols + 1; c++) {
                ctx.fillRect(c * cWidth + offset + 2, r * rHeight + 2, cWidth - 4, rHeight - 4);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        this.cache.set('brick', texture);
        return texture;
    }

    // Marmar / Kafel pol teksturasi
    createTileTexture() {
        if (this.cache.has('tile')) return this.cache.get('tile');

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(0, 0, 512, 512);

        // Kafel choklari
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;
        const tileSize = 128;

        for (let x = 0; x <= 512; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, x);
            ctx.lineTo(512, x);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);

        this.cache.set('tile', texture);
        return texture;
    }
}

export const textureManager = new TextureManager();

