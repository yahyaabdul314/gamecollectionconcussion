// Shared WebXR utilities for all games

class WebXRUtils {
    static createScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x505050);
        return scene;
    }

    static createCamera() {
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1.6, 0); // Average eye height
        return camera;
    }

    static createRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    static createVRButton(renderer) {
        const button = document.createElement('button');
        button.className = 'vr-button';
        button.textContent = 'Enter VR';

        button.onclick = async () => {
            if (!navigator.xr) {
                button.textContent = 'WebXR not supported';
                return;
            }

            try {
                const session = await navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                });
                renderer.xr.setSession(session);
                button.textContent = 'Exit VR';
            } catch (error) {
                console.error('Error starting VR session:', error);
                button.textContent = 'VR Error - Try Again';
            }
        };

        document.body.appendChild(button);
        return button;
    }

    static addLighting(scene) {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // Directional light for depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        return { ambientLight, directionalLight };
    }

    static createController(renderer, index) {
        const controller = renderer.xr.getController(index);

        // Add a simple ray visualization
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const line = new THREE.Line(geometry, material);
        line.scale.z = 5;
        controller.add(line);

        return controller;
    }

    static createFloor(scene, size = 10, color = 0x404040) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);
        return floor;
    }

    static createSphere(radius = 0.1, color = 0xff0000, position = {x: 0, y: 1.6, z: -2}) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(position.x, position.y, position.z);
        return sphere;
    }

    static createBox(size = 0.2, color = 0x00ff00, position = {x: 0, y: 1.6, z: -2}) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(position.x, position.y, position.z);
        return box;
    }

    static createText(text, size = 0.2, color = 0xffffff, position = {x: 0, y: 2, z: -2}) {
        // Simple text using canvas texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 48px Arial';
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geometry = new THREE.PlaneGeometry(size * 4, size * 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        return mesh;
    }

    static handleWindowResize(camera, renderer) {
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    static randomColor() {
        return Math.random() * 0xffffff;
    }

    static randomPosition(range = 2, height = 1.6) {
        return {
            x: (Math.random() - 0.5) * range,
            y: height + (Math.random() - 0.5) * range,
            z: -2 + (Math.random() - 0.5) * range
        };
    }

    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    static distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static playSound(frequency = 440, duration = 0.1, type = 'sine') {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.log('Audio not supported');
        }
    }
}
