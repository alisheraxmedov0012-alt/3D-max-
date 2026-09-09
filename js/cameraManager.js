import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class CameraManager {
    constructor(camera, scene, renderer, orbitControls) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.orbitControls = orbitControls;

        this.currentMode = 'orbit'; // 'orbit', 'fps', 'top'

        // PointerLock (FPS) boshqaruvi (Desktop uchun)
        this.fpsControls = new PointerLockControls(this.camera, this.renderer.domElement);
        
        // Harakat vektorlari (WASD / Keyboard)
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Mobil Joystick kiritish vektori
        this.joystickInput = new THREE.Vector2(0, 0);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();

        this.playerHeight = 1.6; // Inson ko'z balandligi
        this.moveSpeed = 10.0;

        // Mobil Touch (Atrofga qarash) sozlamalari
        this.touchLookSensitivity = 0.003;
        this.prevTouchX = 0;
        this.prevTouchY = 0;
        this.isTouching = false;

        this._initOrbitTouchSettings();
        this._initListeners();
    }

    // OrbitControls uchun touch (1 va 2 barmoq) tayyorgarligi
    _initOrbitTouchSettings() {
        if (this.orbitControls) {
            this.orbitControls.enableDamping = true;
            this.orbitControls.dampingFactor = 0.05;
            this.orbitControls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        }
    }

    _initListeners() {
        // WASD Klaviaturani tinglash
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

        // Desktopda sichqoncha qulfdan chiqsa Orbit rejimiga qaytarish
        this.fpsControls.addEventListener('unlock', () => {
            if (this.currentMode === 'fps' && !this._isMobile()) {
                this.setMode('orbit');
            }
        });

        // Mobil qurilmalarda FPS rejimida barmoq bilan ekranni surib atrofga qarash
        const dom = this.renderer.domElement;

        dom.addEventListener('touchstart', (e) => {
            if (this.currentMode !== 'fps') return;
            if (e.touches.length === 1) {
                this.isTouching = true;
                this.prevTouchX = e.touches[0].clientX;
                this.prevTouchY = e.touches[0].clientY;
            }
        }, { passive: true });

        dom.addEventListener('touchmove', (e) => {
            if (this.currentMode !== 'fps' || !this.isTouching || e.touches.length !== 1) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            const deltaX = touchX - this.prevTouchX;
            const deltaY = touchY - this.prevTouchY;

            // Kamerani burish (Yaw va Pitch)
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(this.camera.quaternion);

            euler.y -= deltaX * this.touchLookSensitivity;
            euler.x -= deltaY * this.touchLookSensitivity;

            // Vertikal qarash chegarasini saqlash (-85° dan 85° gacha)
            const maxPolarAngle = Math.PI / 2 - 0.05;
            euler.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, euler.x));

            this.camera.quaternion.setFromEuler(euler);

            this.prevTouchX = touchX;
            this.prevTouchY = touchY;
        }, { passive: true });

        const touchEndHandler = () => { this.isTouching = false; };
        dom.addEventListener('touchend', touchEndHandler, { passive: true });
        dom.addEventListener('touchcancel', touchEndHandler, { passive: true });
    }

    // Mobil qurilma brauzerini aniqlash
    _isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    }

    // Joystick ma'lumotlarini qabul qilish (main.js dan chaqiriladi)
    updateJoystickInput(x, y) {
        this.joystickInput.set(x, y);
    }

    setMode(mode, houseGroup = null) {
        this.currentMode = mode;

        // UI tugmalarida active klassini yangilash
        document.querySelectorAll('#camera-controls button').forEach(b => b.classList.remove('active'));

        const mobileControls = document.getElementById('mobile-touch-controls');

        if (mode === 'orbit') {
            document.getElementById('cam-orbit-btn')?.classList.add('active');
            if (mobileControls) mobileControls.style.display = 'none';

            this.fpsControls.unlock();
            this.orbitControls.enabled = true;
            this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.01;
        } 
        else if (mode === 'fps') {
            document.getElementById('cam-fps-btn')?.classList.add('active');
            this.orbitControls.enabled = false;
            
            if (houseGroup) {
                const box = new THREE.Box3().setFromObject(houseGroup);
                const center = box.getCenter(new THREE.Vector3());
                this.camera.position.set(center.x, this.playerHeight, center.z + box.getSize(new THREE.Vector3()).z * 0.3);
            } else {
                this.camera.position.set(0, this.playerHeight, 3);
            }

            // Mobil bo'lsa joystik interfeysini ko'rsatamiz, desktopda PointerLock-ni qulflaymiz
            if (this._isMobile()) {
                if (mobileControls) mobileControls.style.display = 'flex';
            } else {
                if (mobileControls) mobileControls.style.display = 'none';
                this.fpsControls.lock();
            }
        } 
        else if (mode === 'top') {
            document.getElementById('cam-top-btn')?.classList.add('active');
            if (mobileControls) mobileControls.style.display = 'none';

            this.fpsControls.unlock();
            this.orbitControls.enabled = true;

            if (houseGroup) {
                const box = new THREE.Box3().setFromObject(houseGroup);
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).z);

                this.camera.position.set(center.x, maxDim * 1.8, center.z + 0.01);
                this.orbitControls.target.copy(center);
                this.orbitControls.maxPolarAngle = 0.01;
                this.orbitControls.update();
            }
        }
    }

    update() {
        // Orbit va 2D Sxema rejimidagi yangilanish
        if (this.currentMode === 'orbit' || this.currentMode === 'top') {
            if (this.joystickInput.lengthSq() > 0.001) {
                this.orbitControls.azimuthAngle -= this.joystickInput.x * 0.03;
                this.orbitControls.polarAngle -= this.joystickInput.y * 0.03;
                this.orbitControls.polarAngle = Math.max(0.1, Math.min(Math.PI / 2 - 0.01, this.orbitControls.polarAngle));
            }
            this.orbitControls.update();
            return;
        }

        // FPS Rejimidagi harakat mantiqi
        if (this.currentMode !== 'fps') return;

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        // Ishqalanish va sekinlashuv
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        // Klaviatura hamda Joystick ma'lumotlarini birlashtirish
        let forwardFactor = Number(this.moveForward) - Number(this.moveBackward);
        let rightFactor = Number(this.moveRight) - Number(this.moveLeft);

        if (Math.abs(this.joystickInput.y) > 0.05) {
            forwardFactor -= this.joystickInput.y;
        }
        if (Math.abs(this.joystickInput.x) > 0.05) {
            rightFactor += this.joystickInput.x;
        }

        this.direction.z = forwardFactor;
        this.direction.x = rightFactor;

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
        }

        if (forwardFactor !== 0) {
            this.velocity.z -= this.direction.z * this.moveSpeed * 10.0 * delta;
        }
        if (rightFactor !== 0) {
            this.velocity.x -= this.direction.x * this.moveSpeed * 10.0 * delta;
        }

        // PointerLock bo'lsa ichki metodlar, aks holda (mobilda) Vector yo'nalishi bilan harakatlantirish
        if (this.fpsControls.isLocked) {
            this.fpsControls.moveRight(-this.velocity.x * delta);
            this.fpsControls.moveForward(-this.velocity.z * delta);
        } else {
            const moveVector = new THREE.Vector3();
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();

            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            right.crossVectors(this.camera.up, forward).negate();

            moveVector.addScaledVector(forward, -this.velocity.z * delta);
            moveVector.addScaledVector(right, -this.velocity.x * delta);

            this.camera.position.add(moveVector);
        }

        this.camera.position.y = this.playerHeight;
        this.prevTime = time;
    }
}
