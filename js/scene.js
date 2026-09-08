import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Sahna yaratish
export function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // osmon ko'k

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(8, 8, 12);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

    // Yorug'lik guruhlari
    const lights = {
        ambient: new THREE.AmbientLight(0xffffff, 0.5),
        directional: new THREE.DirectionalLight(0xffffff, 1),
        hemisphere: new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5),
        point: new THREE.PointLight(0xffcc44, 0, 10) // qo'shimcha
    };

    lights.directional.position.set(5, 10, 5);
    lights.directional.castShadow = true;
    lights.directional.shadow.mapSize.width = 2048;
    lights.directional.shadow.mapSize.height = 2048;
    lights.directional.shadow.camera.near = 0.5;
    lights.directional.shadow.camera.far = 50;
    lights.directional.shadow.camera.left = -15;
    lights.directional.shadow.camera.right = 15;
    lights.directional.shadow.camera.top = 15;
    lights.directional.shadow.camera.bottom = -15;

    lights.point.position.set(0, 5, 0);
    lights.point.castShadow = true;

    scene.add(lights.ambient);
    scene.add(lights.directional);
    scene.add(lights.hemisphere);
    scene.add(lights.point);

    // HDRI muhit xaritasi yuklash
    let environmentReady = false;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // HDRI manzillari (kun vaqti bo'yicha)
    const hdriUrls = {
        day: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        sunset: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        night: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        cloudy: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr'
    };

    function loadHDRI(url) {
        return new Promise((resolve, reject) => {
            const loader = new RGBELoader();
            loader.load(
                url,
                (texture) => {
                    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                    pmremGenerator.dispose();
                    scene.environment = envMap;
                    resolve(envMap);
                },
                undefined,
                (err) => reject(err)
            );
        });
    }

    // Yorug'lik presetini qo'llash
    function setLightingPreset(preset = 'day') {
        const presets = {
            day: {
                sky: 0x87ceeb,
                ambient: 0.5,
                directional: 1.0,
                directionalColor: 0xffffff,
                sunPosition: [5, 10, 5],
                hdri: hdriUrls.day,
                hemisphere: 0.5
            },
            sunny: {
                sky: 0x4da6ff,
                ambient: 0.4,
                directional: 1.5,
                directionalColor: 0xfff4d6,
                sunPosition: [8, 12, 4],
                hdri: hdriUrls.day,
                hemisphere: 0.6
            },
            sunset: {
                sky: 0xff7f50,
                ambient: 0.4,
                directional: 0.8,
                directionalColor: 0xffa64d,
                sunPosition: [-5, 3, -8],
                hdri: hdriUrls.sunset,
                hemisphere: 0.3
            },
            night: {
                sky: 0x0a0a2e,
                ambient: 0.3,
                directional: 0.2,
                directionalColor: 0x8888cc,
                sunPosition: [-2, 5, -5],
                hdri: hdriUrls.night,
                hemisphere: 0.3
            },
            cloudy: {
                sky: 0xbbbbcc,
                ambient: 0.6,
                directional: 0.5,
                directionalColor: 0xdddddd,
                sunPosition: [0, 8, 0],
                hdri: hdriUrls.cloudy,
                hemisphere: 0.4
            }
        };

        const p = presets[preset] || presets.day;

        scene.background = new THREE.Color(p.sky);
        lights.ambient.intensity = p.ambient;
        lights.directional.intensity = p.directional;
        lights.directional.color.setHex(p.directionalColor);
        lights.directional.position.set(...p.sunPosition);
        lights.hemisphere.intensity = p.hemisphere;

        // HDRI yuklash (xatolik yuz bermasa)
        if (p.hdri && !environmentReady) {
            loadHDRI(p.hdri).then(() => {
                environmentReady = true;
            }).catch(err => {
                console.warn('HDRI yuklanmadi, default yorug\'lik ishlatiladi', err);
            });
        }
    }

    // Boshlang'ich yorug'lik
    setLightingPreset('day');

    return { scene, camera, renderer, controls, setLightingPreset };
}
