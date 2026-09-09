import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class CameraManager {
    constructor(camera, scene, renderer, orbitControls) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.orbitControls = orbitControls;

        this.currentMode = 'orbit'; // 'orbit', 'fps', 'top'

        // FPS boshqaruvi
        this.fpsControls = new PointerLockControls(this.camera, this.renderer.domElement);
        
        // Harakat vektorlari
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();

        // O'yinchi o'lchamlari va parametrlar
        this.playerHeight = 1.6; // Inson ko'z balandligi (metr)
        this.moveSpeed = 8.0;

        this._initListeners();
    }

    _initListeners() {
        const onKeyDown = (event) => {
            if (this.currentMode !== 'fps') return;
            switch (event.code) {
                case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
                case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
                case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
            }
        };

        const onKeyUp = (event) => {
            if (this.currentMode !== 'fps') return;
            switch (event.code) {
                case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
                case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
                case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // PointerLock holati o'zgarganda
        this.fpsControls.addEventListener('unlock', () => {
            if (this.currentMode === 'fps') {
                this.setMode('orbit');
            }
        });
    }

    setMode(mode, houseGroup = null) {
        this.currentMode = mode;

        if (mode === 'orbit') {
            this.fpsControls.unlock();
            this.orbitControls.enabled = true;
            this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.01;
        } 
        else if (mode === 'fps') {
            this.orbitControls.enabled = false;
            
            // Kamerani uy ichiga/eshik oldiga joylashtirish
            if (houseGroup) {
                const box = new THREE.Box3().setFromObject(houseGroup);
                const center = box.getCenter(new THREE.Vector3());
                this.camera.position.set(center.x, this.playerHeight, center.z + box.getSize(new THREE.Vector3()).z * 0.3);
            } else {
                this.camera.position.set(0, this.playerHeight, 3);
            }

            this.fpsControls.lock();
        } 
        else if (mode === 'top') {
            this.fpsControls.unlock();
            this.orbitControls.enabled = true;

            // Tepadan 2D sxema ko'rinishi
            if (houseGroup) {
                const box = new THREE.Box3().setFromObject(houseGroup);
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).z);

                this.camera.position.set(center.x, maxDim * 1.8, center.z + 0.01);
                this.orbitControls.target.copy(center);
                this.orbitControls.maxPolarAngle = 0.01; // Vertikal qulflash
                this.orbitControls.update();
            }
        }
    }

    update() {
        if (this.currentMode !== 'fps' || !this.fpsControls.isLocked) return;

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        // Inersiyali harakat
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * this.moveSpeed * 10.0 * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * this.moveSpeed * 10.0 * delta;
        }

        this.fpsControls.moveRight(-this.velocity.x * delta);
        this.fpsControls.moveForward(-this.velocity.z * delta);

        // O'yinchi balandligini doimiy ushlab turish
        this.camera.position.y = this.playerHeight;

        this.prevTime = time;
    }
}

