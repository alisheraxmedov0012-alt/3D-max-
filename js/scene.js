import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Kamera va Renderer
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(10, 10, 15);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // Yer ostiga tushib ketmaslik
    controls.target.set(0, 1, 0);
    controls.update();

    // Yorug'lik manbalari
    const lights = {
        ambient: new THREE.AmbientLight(0xffffff, 0.5),
        directional: new THREE.DirectionalLight(0xffffff, 1.2),
        hemisphere: new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5),
        point: new THREE.PointLight(0xffaa44, 0, 15) // Tungi rejim uchun ichki/sirtqi chiroq
    };

    lights.directional.position.set(10, 15, 8);
    lights.directional.castShadow = true;
    lights.directional.shadow.mapSize.width = 2048;
    lights.directional.shadow.mapSize.height = 2048;
    lights.directional.shadow.bias = -0.0001;

    lights.point.position.set(0, 3, 0);

    scene.add(lights.ambient);
    scene.add(lights.directional);
    scene.add(lights.hemisphere);
    scene.add(lights.point);

    // HDRI Boshqaruvi
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    let currentHdriUrl = null;
    let currentEnvMap = null;

    const hdriUrls = {
        day: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        sunny: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        sunset: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        night: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
        cloudy: 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr'
    };

    function loadHDRI(url) {
        if (currentHdriUrl === url) return Promise.resolve();
        currentHdriUrl = url;

        return new Promise((resolve, reject) => {
            const loader = new RGBELoader();
            loader.load(
                url,
                (texture) => {
                    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

                    // Eski teksturani xotiradan o'chirish (Memory Leak oldini olish)
                    if (currentEnvMap) {
                        currentEnvMap.dispose();
                    }
                    texture.dispose();

                    currentEnvMap = envMap;
                    scene.environment = envMap;
                    resolve(envMap);
                },
                undefined,
                (err) => reject(err)
            );
        });
    }

    // Presetlar va kun vaqtini almashtirish
    function setLightingPreset(preset = 'day') {
        const presets = {
            day: {
                sky: 0x87ceeb,
                ambient: 0.5,
                directional: 1.0,
                directionalColor: 0xffffff,
                sunPosition: [10, 15, 8],
                pointIntensity: 0,
                hemisphere: 0.5
            },
            sunny: {
                sky: 0x4da6ff,
                ambient: 0.4,
                directional: 1.5,
                directionalColor: 0xfff4d6,
                sunPosition: [12, 18, 6],
                pointIntensity: 0,
                hemisphere: 0.6
            },
            sunset: {
                sky: 0xff7f50,
                ambient: 0.35,
                directional: 0.8,
                directionalColor: 0xffa64d,
                sunPosition: [-10, 4, -10],
                pointIntensity: 0.5,
                hemisphere: 0.3
            },
            night: {
                sky: 0x0a0a1a,
                ambient: 0.15,
                directional: 0.15,
                directionalColor: 0x8888cc,
                sunPosition: [-5, 6, -5],
                pointIntensity: 2.5, // Uy ichida iliq chiroq yonadi
                hemisphere: 0.15
            },
            cloudy: {
                sky: 0xbbbbcc,
                ambient: 0.6,
                directional: 0.4,
                directionalColor: 0xdddddd,
                sunPosition: [0, 12, 0],
                pointIntensity: 0,
                hemisphere: 0.4
            }
        };

        const p = presets[preset] || presets.day;

        scene.background = new THREE.Color(p.sky);
        lights.ambient.intensity = p.ambient;
        lights.directional.intensity = p.directional;
        lights.directional.color.setHex(p.directionalColor);
        lights.directional.position.set(...p.sunPosition);
        lights.point.intensity = p.pointIntensity;
        lights.hemisphere.intensity = p.hemisphere;

        const targetHdri = hdriUrls[preset] || hdriUrls.day;
        loadHDRI(targetHdri).catch((err) => console.warn('HDRI yuklanmadi, standart yorug\'lik ishlatiladi:', err));
    }

    // Soya kamerasini bino o'lchamiga moslash
    function fitShadowsToGroup(group) {
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const d = maxDim * 1.2;
        lights.directional.shadow.camera.left = -d;
        lights.directional.shadow.camera.right = d;
        lights.directional.shadow.camera.top = d;
        lights.directional.shadow.camera.bottom = -d;
        lights.directional.shadow.camera.far = d * 4;
        lights.directional.shadow.camera.updateProjectionMatrix();
    }

    // Avtomatik o'lcham o'zgarishi (Resize Observer)
    const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // Animatsiya tsikli
    let animationFrameId;
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    setLightingPreset('day');

    return {
        scene,
        camera,
        renderer,
        controls,
        setLightingPreset,
        fitShadowsToGroup,
        destroy: () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            pmremGenerator.dispose();
            if (currentEnvMap) currentEnvMap.dispose();
            renderer.dispose();
        }
    };
}
