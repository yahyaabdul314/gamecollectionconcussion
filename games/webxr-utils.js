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

// Physics Tracker Class for monitoring tilt, speed, and angle
class PhysicsTracker {
    constructor(camera) {
        this.camera = camera;
        this.lastPosition = new THREE.Vector3();
        this.lastRotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Euler();
        this.speed = 0;
        this.tilt = { x: 0, y: 0, z: 0 };
        this.angle = { x: 0, y: 0, z: 0 };
        this.lastTime = Date.now();

        // Initialize last position and rotation
        this.lastPosition.copy(camera.position);
        this.lastRotation.copy(camera.rotation);
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds

        if (deltaTime > 0) {
            // Calculate velocity (speed)
            this.velocity.subVectors(this.camera.position, this.lastPosition).divideScalar(deltaTime);
            this.speed = this.velocity.length();

            // Calculate angular velocity
            this.angularVelocity.x = (this.camera.rotation.x - this.lastRotation.x) / deltaTime;
            this.angularVelocity.y = (this.camera.rotation.y - this.lastRotation.y) / deltaTime;
            this.angularVelocity.z = (this.camera.rotation.z - this.lastRotation.z) / deltaTime;

            // Update tilt (current rotation in degrees)
            this.tilt.x = THREE.MathUtils.radToDeg(this.camera.rotation.x);
            this.tilt.y = THREE.MathUtils.radToDeg(this.camera.rotation.y);
            this.tilt.z = THREE.MathUtils.radToDeg(this.camera.rotation.z);

            // Update angle (angular velocity in degrees per second)
            this.angle.x = THREE.MathUtils.radToDeg(this.angularVelocity.x);
            this.angle.y = THREE.MathUtils.radToDeg(this.angularVelocity.y);
            this.angle.z = THREE.MathUtils.radToDeg(this.angularVelocity.z);

            // Update last values
            this.lastPosition.copy(this.camera.position);
            this.lastRotation.copy(this.camera.rotation);
            this.lastTime = currentTime;
        }
    }

    getSpeed() {
        return this.speed;
    }

    getTilt() {
        return this.tilt;
    }

    getAngle() {
        return this.angle;
    }

    getVelocity() {
        return this.velocity;
    }

    getData() {
        return {
            speed: this.speed.toFixed(3),
            tilt: {
                x: this.tilt.x.toFixed(1),
                y: this.tilt.y.toFixed(1),
                z: this.tilt.z.toFixed(1)
            },
            angle: {
                x: this.angle.x.toFixed(1),
                y: this.angle.y.toFixed(1),
                z: this.angle.z.toFixed(1)
            }
        };
    }
}

// Physics Info Display Class
class PhysicsDisplay {
    constructor(scene, position = { x: -1.5, y: 2, z: -3 }) {
        this.scene = scene;
        this.position = position;
        this.textMesh = null;
        this.createDisplay();
    }

    createDisplay() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;

        this.canvas = canvas;
        this.context = context;

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const geometry = new THREE.PlaneGeometry(1, 1);
        this.textMesh = new THREE.Mesh(geometry, material);
        this.textMesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.textMesh);
    }

    update(physicsData) {
        const ctx = this.context;
        const canvas = this.canvas;

        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'Bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('PHYSICS INFO', 30, 60);

        // Speed
        ctx.fillStyle = '#ffffff';
        ctx.font = 'Bold 28px Arial';
        ctx.fillText('Speed:', 30, 120);
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Arial';
        ctx.fillText(`${physicsData.speed} m/s`, 30, 155);

        // Tilt
        ctx.fillStyle = '#ffffff';
        ctx.font = 'Bold 28px Arial';
        ctx.fillText('Tilt (degrees):', 30, 215);
        ctx.fillStyle = '#ffaa00';
        ctx.font = '22px Arial';
        ctx.fillText(`Pitch: ${physicsData.tilt.x}°`, 30, 250);
        ctx.fillText(`Yaw:   ${physicsData.tilt.y}°`, 30, 285);
        ctx.fillText(`Roll:  ${physicsData.tilt.z}°`, 30, 320);

        // Angle (Angular Velocity)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'Bold 28px Arial';
        ctx.fillText('Angular Speed (°/s):', 30, 380);
        ctx.fillStyle = '#ff00ff';
        ctx.font = '22px Arial';
        ctx.fillText(`Pitch: ${physicsData.angle.x}°/s`, 30, 415);
        ctx.fillText(`Yaw:   ${physicsData.angle.y}°/s`, 30, 450);
        ctx.fillText(`Roll:  ${physicsData.angle.z}°/s`, 30, 485);

        // Update texture
        this.textMesh.material.map.needsUpdate = true;
    }

    setPosition(x, y, z) {
        this.textMesh.position.set(x, y, z);
    }

    setVisible(visible) {
        this.textMesh.visible = visible;
    }

    remove() {
        this.scene.remove(this.textMesh);
    }
}

// Game Session Tracker Class
class GameSessionTracker {
    constructor(gameName, gameCategory) {
        this.gameName = gameName;
        this.gameCategory = gameCategory;
        this.sessionStart = null;
        this.sessionEnd = null;
        this.score = 0;
        this.difficulty = 'easy';
        this.completed = false;
        this.metrics = {};
        this.physicsData = null;
        this.isTracking = false;
    }

    /**
     * Start tracking a game session
     */
    startSession() {
        this.sessionStart = Date.now();
        this.isTracking = true;
        console.log(`Session started for ${this.gameName}`);
    }

    /**
     * Update score during gameplay
     */
    updateScore(score) {
        this.score = score;
    }

    /**
     * Set difficulty level
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    /**
     * Mark session as completed
     */
    markCompleted() {
        this.completed = true;
    }

    /**
     * Add custom metrics
     */
    addMetric(key, value) {
        this.metrics[key] = value;
    }

    /**
     * Add physics data from PhysicsTracker
     */
    setPhysicsData(physicsData) {
        this.physicsData = physicsData;
    }

    /**
     * End the session and save to progression tracker
     */
    endSession() {
        if (!this.isTracking) {
            console.warn('Session not started or already ended');
            return;
        }

        this.sessionEnd = Date.now();
        this.isTracking = false;

        const duration = Math.floor((this.sessionEnd - this.sessionStart) / 1000); // in seconds

        const sessionData = {
            gameName: this.gameName,
            gameCategory: this.gameCategory,
            duration: duration,
            difficulty: this.difficulty,
            score: this.score,
            completed: this.completed,
            metrics: this.metrics,
            physicsData: this.physicsData
        };

        // Try to record to progression tracker if available
        try {
            // Load progression tracker script if not already loaded
            if (typeof ProgressionTracker === 'undefined') {
                console.log('ProgressionTracker not loaded, session data will not be saved');
                return sessionData;
            }

            const tracker = new ProgressionTracker();
            tracker.recordSession(sessionData);
            console.log('Session recorded successfully:', sessionData);
        } catch (error) {
            console.error('Error recording session:', error);
        }

        return sessionData;
    }

    /**
     * Get current session duration
     */
    getCurrentDuration() {
        if (!this.isTracking) return 0;
        return Math.floor((Date.now() - this.sessionStart) / 1000);
    }

    /**
     * Create a back button with session tracking
     */
    static createBackButtonWithTracking(tracker) {
        const backButton = document.createElement('button');
        backButton.textContent = '← Back to Games';
        backButton.className = 'back-button';
        backButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
            font-weight: bold;
        `;

        backButton.addEventListener('mouseover', () => {
            backButton.style.transform = 'translateY(-2px)';
            backButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        backButton.addEventListener('mouseout', () => {
            backButton.style.transform = 'translateY(0)';
            backButton.style.boxShadow = 'none';
        });

        backButton.addEventListener('click', () => {
            // End session before navigating away
            if (tracker && tracker.isTracking) {
                tracker.endSession();
            }
            window.location.href = '../index.html';
        });

        document.body.appendChild(backButton);
        return backButton;
    }

    /**
     * Create a session info overlay
     */
    static createSessionInfoOverlay(tracker) {
        const overlay = document.createElement('div');
        overlay.className = 'session-info-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 200px;
        `;

        overlay.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 5px; opacity: 0.8;">Session Info</div>
            <div style="font-size: 18px; font-weight: bold;" id="session-duration">0:00</div>
            <div style="font-size: 16px; margin-top: 5px;">Score: <span id="session-score">0</span></div>
        `;

        document.body.appendChild(overlay);

        // Update duration every second
        const updateInterval = setInterval(() => {
            if (!tracker || !tracker.isTracking) {
                clearInterval(updateInterval);
                return;
            }

            const duration = tracker.getCurrentDuration();
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationElement = document.getElementById('session-duration');
            if (durationElement) {
                durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            const scoreElement = document.getElementById('session-score');
            if (scoreElement) {
                scoreElement.textContent = tracker.score;
            }
        }, 1000);

        return overlay;
    }
}

// Auto-end session when page unloads
window.addEventListener('beforeunload', (event) => {
    // Try to save any active sessions
    try {
        if (typeof window.gameSessionTracker !== 'undefined' && window.gameSessionTracker && window.gameSessionTracker.isTracking) {
            window.gameSessionTracker.endSession();
        }
    } catch (error) {
        console.error('Error saving session on unload:', error);
    }
});
