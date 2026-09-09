import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.dirLight = null;
        this.hemiLight = null;
        this.sky = null;
        this.sun = new THREE.Vector3();

        this.initLights();
        this.initSky();
    }

    // Nurlarni soazlash va soya xaritasini (Shadow Map) optimallashtirish
    initLights() {
        // Yumshoq atroflamachi yorug'lik (Osmon va yer aks-sadosi)
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.hemiLight.position.set(0, 50, 0);
        this.scene.add(this.hemiLight);

        // Quyosh nuri (Yo'naltirilgan nur)
        this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
        this.dirLight.castShadow = true;

        // Soyalarning aniqligi va kamerasining o'lchamlarini sozlash
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 150;

        const shadowBounds = 25;
        this.dirLight.shadow.camera.left = -shadowBounds;
        this.dirLight.shadow.camera.right = shadowBounds;
        this.dirLight.shadow.camera.top = shadowBounds;
        this.dirLight.shadow.camera.bottom = -shadowBounds;
        this.dirLight.shadow.bias = -0.0003; // Artefakt (Shadow acne) larni yo'qotish

        this.scene.add(this.dirLight);
    }

    // Atmospheric Sky (Realist osmon) atmosferasini yaratish
    initSky() {
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);

        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = 8;
        uniforms['rayleigh'].value = 2;
        uniforms['mieCoefficient'].value = 0.005;
        uniforms['mieDirectionalG'].value = 0.8;

        // Boshlang'ich kunduzgi quyosh holati
        this.setSunPosition(45, 180);
    }

    /**
     * Quyoshning osmondagi o'rnini burchaklar orqali o'zgartirish
     * @param {number} elevation - Ufqdan balandligi (0° - 90°)
     * @param {number} azimuth - Gorizont bo'yicha aylanishi (0° - 360°)
     */
    setSunPosition(elevation, azimuth) {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);

        this.sun.setFromSphericalCoords(1, phi, theta);

        if (this.sky) {
            this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
        }

        // Quyosh nurini osmon koordinatasiga moslab ko'chirish
        this.dirLight.position.copy(this.sun).multiplyScalar(60);
    }

    /**
     * Tayyor vaqt rejimlariga o'tkazish
     * @param {'day' | 'sunset' | 'night'} preset
     */
    setTimePreset(preset) {
        switch (preset) {
            case 'day':
                this.setSunPosition(50, 180);
                this.dirLight.intensity = 1.3;
                this.dirLight.color.setHex(0xfffaed);
                this.hemiLight.intensity = 0.6;
                break;
            case 'sunset':
                this.setSunPosition(8, 240);
                this.dirLight.intensity = 0.9;
                this.dirLight.color.setHex(0xff7733);
                this.hemiLight.intensity = 0.3;
                break;
            case 'night':
                this.setSunPosition(-15, 180);
                this.dirLight.intensity = 0.1;
                this.dirLight.color.setHex(0x6688cc);
                this.hemiLight.intensity = 0.15;
                break;
        }
    }
}

