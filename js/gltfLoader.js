// js/gltfLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelLoaderManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.cache = new Map(); // Modellarni keshda saqlash (qayta yuklamaslik uchun)
    }

    /**
     * Tashqi GLTF/GLB modelni yuklash va keshga olish
     * @param {string} url - Model fayliga yo'l yoki URL
     * @returns {Promise<THREE.Object3D>}
     */
    async loadModel(url) {
        if (this.cache.has(url)) {
            // Bir marta yuklangan model bo'lsa, uni tezkor klonlab qaytaradi
            return this.cache.get(url).clone();
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;

                    // Modellardagi soya sozlamalarini faollashtirish
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this.cache.set(url, model);
                    resolve(model.clone());
                },
                undefined,
                (error) => {
                    console.warn(`[GLTFLoader] Model yuklanmadi: ${url}`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Mebel modelini xonaga o'rnatish
     * @param {string} type - Mebel turi ('sofa', 'bed', 'table', va h.k.)
     * @param {Array<number>} position - [x, y, z] koordinatasi
     * @param {Object} modelUrls - Mebel turlariga biriktirilgan model URL'lari
     */
    async getFurnitureAsync(type, position = [0, 0, 0], modelUrls = {}) {
        const url = modelUrls[type];
        if (!url) return null;

        try {
            const model = await this.loadModel(url);
            model.position.set(...position);
            model.userData = { type, isInteractable: true };
            return model;
        } catch (e) {
            // Agar model yuklanmay qolsa, null qaytaradi (falback procedural modelga o'tadi)
            return null;
        }
    }
}

export const gltfLoader = new ModelLoaderManager();
