/**
 * VR Session Controller
 * Handles exercise execution, real-time tracking, and live feedback
 */

class VRSessionController {
    constructor() {
        this.authManager = null;
        this.tracker = null;
        this.exerciseAI = null;
        this.currentSession = null;
        this.currentExerciseIndex = 0;
        this.selectedExercises = [];
        this.sessionStartTime = null;
        this.exerciseStartTime = null;

        // Real-time tracking
        this.trackingData = {
            headRotation: { x: 0, y: 0, z: 0 },
            headTilt: 0,
            movementSpeed: 0,
            stability: 100,
            performance: 0
        };

        this.trackingInterval = null;
        this.feedbackTimeout = null;

        // Performance metrics
        this.metrics = {
            accuracy: 0,
            consistency: 0,
            corrections: 0,
            completedExercises: 0
        };

        // 360 Environments
        this.environments = [
            {
                id: 'beach',
                name: 'Peaceful Beach',
                url: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/beach.jpg'
            },
            {
                id: 'forest',
                name: 'Forest Path',
                url: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/forest.jpg'
            },
            {
                id: 'mountain',
                name: 'Mountain View',
                url: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/mountain.jpg'
            },
            {
                id: 'city',
                name: 'City Skyline',
                url: 'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg'
            }
        ];
    }

    /**
     * Initialize the VR session
     */
    async initialize() {
        try {
            // Initialize Supabase
            initSupabase();
            this.authManager = getAuthManager();

            // Check authentication
            const user = await this.authManager.getCurrentUser();
            if (!user) {
                window.location.href = 'auth.html';
                return;
            }

            // Initialize tracker and AI
            this.tracker = new ProgressionTracker();
            await this.tracker.initialize();

            this.exerciseAI = new ExerciseAI(this.tracker);

            // Analyze and select exercises
            await this.selectExercises();

            // Show exercise selection screen
            this.showExerciseSelection();

        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize VR session. Please try again.');
        }
    }

    /**
     * Select exercises using AI
     */
    async selectExercises() {
        const selection = await this.exerciseAI.selectExercises(900, 3);
        this.selectedExercises = selection.exercises;
        this.userAnalysis = selection.userAnalysis;
        this.rationale = selection.rationale;
    }

    /**
     * Show exercise selection screen
     */
    showExerciseSelection() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('exerciseSelection').style.display = 'flex';

        // Populate analysis stats
        const statsHtml = `
            <div class="stat-item">
                <div class="stat-value">${this.userAnalysis.totalSessions || 0}</div>
                <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.userAnalysis.avgCompletion || 0}%</div>
                <div class="stat-label">Completion Rate</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(this.userAnalysis.overall)}</div>
                <div class="stat-label">Current Level</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.userAnalysis.avgScore || 0}%</div>
                <div class="stat-label">Avg Performance</div>
            </div>
        `;
        document.getElementById('analysisStats').innerHTML = statsHtml;

        // Populate rationale
        document.getElementById('rationale').innerHTML = `
            <p>${this.rationale.summary}</p>
        `;

        // Populate exercise list
        const exercisesHtml = this.selectedExercises.map((ex, index) => `
            <div class="exercise-card">
                <div class="exercise-info">
                    <h3>${index + 1}. ${ex.name}</h3>
                    <p>${ex.description}</p>
                    <div class="exercise-meta">
                        <span>⏱️ ${Math.floor(ex.duration / 60)}m ${ex.duration % 60}s</span>
                        <span>📊 Level ${ex.targetDifficulty}</span>
                        <span>🎯 ${ex.skillTargets.join(', ')}</span>
                    </div>
                </div>
                <div>
                    <span class="difficulty-badge">Level ${ex.targetDifficulty}</span>
                </div>
            </div>
        `).join('');
        document.getElementById('exerciseList').innerHTML = exercisesHtml;
    }

    /**
     * Start VR session
     */
    startSession() {
        // Hide selection, show VR scene
        document.getElementById('exerciseSelection').style.display = 'none';
        document.getElementById('vrScene').style.display = 'block';
        document.getElementById('hudOverlay').style.display = 'block';

        // Set random environment
        this.setEnvironment();

        // Initialize session
        this.sessionStartTime = Date.now();
        this.currentSession = {
            exercises: [],
            startTime: this.sessionStartTime,
            totalDuration: 0
        };

        // Start first exercise
        this.currentExerciseIndex = 0;
        this.startExercise(this.selectedExercises[0]);

        // Start tracking
        this.startTracking();
    }

    /**
     * Set 360 environment
     */
    setEnvironment() {
        const env = this.environments[Math.floor(Math.random() * this.environments.length)];
        const sky = document.getElementById('environment');
        sky.setAttribute('src', env.url);
    }

    /**
     * Start an exercise
     */
    startExercise(exercise) {
        this.exerciseStartTime = Date.now();
        this.currentExercise = exercise;

        // Update HUD
        document.getElementById('hudExerciseName').textContent = exercise.name;
        document.getElementById('hudTimer').textContent = this.formatTime(exercise.duration);

        // Reset metrics
        this.metrics = {
            accuracy: 0,
            consistency: 0,
            corrections: 0,
            samples: 0
        };

        // Show initial feedback
        this.showFeedback('success', `Starting: ${exercise.name}`, 3000);

        // Create exercise scene based on type
        this.createExerciseScene(exercise);

        // Start exercise timer
        this.startExerciseTimer(exercise.duration);
    }

    /**
     * Create exercise scene in VR
     */
    createExerciseScene(exercise) {
        const container = document.getElementById('exerciseContainer');
        container.innerHTML = ''; // Clear previous exercise

        // Create different scenes based on exercise type
        switch (exercise.id) {
            case 'smooth-pursuit':
                this.createSmoothPursuitScene(container, exercise);
                break;
            case 'saccade-training':
                this.createSaccadeScene(container, exercise);
                break;
            case 'balance-beam':
                this.createBalanceScene(container, exercise);
                break;
            case 'head-stabilization':
                this.createStabilizationScene(container, exercise);
                break;
            default:
                this.createGenericScene(container, exercise);
        }
    }

    /**
     * Create smooth pursuit exercise
     */
    createSmoothPursuitScene(container, exercise) {
        // Create moving target
        const target = document.createElement('a-sphere');
        target.setAttribute('id', 'pursuitTarget');
        target.setAttribute('radius', '0.15');
        target.setAttribute('color', '#4ade80');
        target.setAttribute('position', '0 0 0');

        // Animate in circular path
        const speed = exercise.configuredParams.speed || 30;
        const radius = 2;

        target.setAttribute('animation', `
            property: position;
            dir: alternate;
            dur: ${10000 / (speed / 30)};
            loop: true;
            to: ${radius * Math.cos(Math.PI/4)} ${radius * Math.sin(Math.PI/4)} 0
        `);

        container.appendChild(target);

        // Create focus point
        const focusPoint = document.createElement('a-ring');
        focusPoint.setAttribute('radius-inner', '0.02');
        focusPoint.setAttribute('radius-outer', '0.05');
        focusPoint.setAttribute('color', '#667eea');
        focusPoint.setAttribute('opacity', '0.5');
        container.appendChild(focusPoint);
    }

    /**
     * Create saccade training scene
     */
    createSaccadeScene(container, exercise) {
        // Create target positions
        const positions = [
            { x: -2, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 0, y: 1.5, z: 0 },
            { x: 0, y: -1.5, z: 0 }
        ];

        this.saccadeTargets = [];
        positions.forEach((pos, index) => {
            const target = document.createElement('a-sphere');
            target.setAttribute('radius', '0.2');
            target.setAttribute('color', '#999');
            target.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
            target.setAttribute('opacity', '0.3');
            container.appendChild(target);
            this.saccadeTargets.push(target);
        });

        // Activate targets randomly
        this.startSaccadeSequence();
    }

    /**
     * Create balance beam scene
     */
    createBalanceScene(container, exercise) {
        // Create beam
        const beamWidth = exercise.configuredParams.beamWidth / 100 || 0.3;
        const beam = document.createElement('a-box');
        beam.setAttribute('width', beamWidth);
        beam.setAttribute('height', '0.1');
        beam.setAttribute('depth', '5');
        beam.setAttribute('color', '#8b4513');
        beam.setAttribute('position', '0 -1 -2.5');
        container.appendChild(beam);

        // Create balance indicators
        for (let i = 0; i < 10; i++) {
            const marker = document.createElement('a-cylinder');
            marker.setAttribute('radius', '0.05');
            marker.setAttribute('height', '0.2');
            marker.setAttribute('color', '#4ade80');
            marker.setAttribute('position', `0 -0.9 ${-i * 0.5}`);
            container.appendChild(marker);
        }
    }

    /**
     * Create head stabilization scene
     */
    createStabilizationScene(container, exercise) {
        // Create central target
        const target = document.createElement('a-text');
        target.setAttribute('value', 'FOCUS');
        target.setAttribute('align', 'center');
        target.setAttribute('color', '#4ade80');
        target.setAttribute('width', '4');
        target.setAttribute('position', '0 0 0');
        container.appendChild(target);

        // Add distractors
        for (let i = 0; i < 4; i++) {
            const distractor = document.createElement('a-sphere');
            distractor.setAttribute('radius', '0.1');
            distractor.setAttribute('color', '#f87171');
            const angle = (i / 4) * Math.PI * 2;
            distractor.setAttribute('position',
                `${Math.cos(angle) * 3} ${Math.sin(angle) * 2} 0`);
            distractor.setAttribute('animation',
                'property: position; dir: alternate; dur: 2000; loop: true;');
            container.appendChild(distractor);
        }
    }

    /**
     * Create generic exercise scene
     */
    createGenericScene(container, exercise) {
        // Create simple target
        const target = document.createElement('a-sphere');
        target.setAttribute('radius', '0.2');
        target.setAttribute('color', '#4ade80');
        target.setAttribute('position', '0 0 0');
        container.appendChild(target);

        // Add instruction text
        const text = document.createElement('a-text');
        text.setAttribute('value', exercise.description);
        text.setAttribute('align', 'center');
        text.setAttribute('color', 'white');
        text.setAttribute('width', '3');
        text.setAttribute('position', '0 1 0');
        container.appendChild(text);
    }

    /**
     * Start saccade sequence
     */
    startSaccadeSequence() {
        let currentTarget = 0;

        const activateNext = () => {
            // Deactivate all
            this.saccadeTargets.forEach(t => {
                t.setAttribute('color', '#999');
                t.setAttribute('opacity', '0.3');
            });

            // Activate random target
            currentTarget = Math.floor(Math.random() * this.saccadeTargets.length);
            this.saccadeTargets[currentTarget].setAttribute('color', '#4ade80');
            this.saccadeTargets[currentTarget].setAttribute('opacity', '1');

            // Schedule next
            setTimeout(activateNext, 1000 + Math.random() * 2000);
        };

        activateNext();
    }

    /**
     * Start exercise timer
     */
    startExerciseTimer(duration) {
        let elapsed = 0;

        this.exerciseTimer = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;

            // Update timer display
            document.getElementById('hudTimer').textContent = this.formatTime(remaining);

            // Update progress bar
            const progress = (elapsed / duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';

            // Check completion
            if (remaining <= 0) {
                this.completeExercise();
            }
        }, 1000);
    }

    /**
     * Start real-time tracking
     */
    startTracking() {
        const camera = document.getElementById('camera');

        this.trackingInterval = setInterval(() => {
            if (!camera) return;

            // Get camera rotation
            const rotation = camera.object3D.rotation;
            const rotationDeg = {
                x: THREE.Math.radToDeg(rotation.x),
                y: THREE.Math.radToDeg(rotation.y),
                z: THREE.Math.radToDeg(rotation.z)
            };

            // Calculate head tilt (deviation from neutral)
            const headTilt = Math.abs(rotationDeg.z);

            // Calculate movement speed
            const prevRotation = this.trackingData.headRotation;
            const deltaX = Math.abs(rotationDeg.x - prevRotation.x);
            const deltaY = Math.abs(rotationDeg.y - prevRotation.y);
            const movementSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10; // approx deg/s

            // Update tracking data
            this.trackingData = {
                headRotation: rotationDeg,
                headTilt: headTilt,
                movementSpeed: movementSpeed,
                stability: this.calculateStability(headTilt, movementSpeed),
                performance: this.calculatePerformance()
            };

            // Update HUD metrics
            this.updateMetricsDisplay();

            // Check for corrections needed
            this.checkAndProvideFeedback();

            // Record sample for metrics
            this.recordMetricSample();

        }, 100); // Update every 100ms
    }

    /**
     * Update metrics display
     */
    updateMetricsDisplay() {
        const tiltEl = document.getElementById('metricHeadTilt');
        const speedEl = document.getElementById('metricSpeed');
        const stabilityEl = document.getElementById('metricStability');
        const perfEl = document.getElementById('metricPerformance');

        // Update values
        tiltEl.textContent = this.trackingData.headTilt.toFixed(1) + '°';
        speedEl.textContent = this.trackingData.movementSpeed.toFixed(1) + '°/s';
        stabilityEl.textContent = this.trackingData.stability.toFixed(0) + '%';
        perfEl.textContent = this.trackingData.performance.toFixed(0) + '%';

        // Update colors based on thresholds
        tiltEl.className = 'metric-value ' + this.getStatusClass(this.trackingData.headTilt, 15, 30);
        speedEl.className = 'metric-value ' + this.getStatusClass(this.trackingData.movementSpeed, 50, 100);
        stabilityEl.className = 'metric-value ' + this.getStatusClass(100 - this.trackingData.stability, 20, 40);
        perfEl.className = 'metric-value ' + this.getStatusClass(100 - this.trackingData.performance, 30, 50);
    }

    /**
     * Get status class based on thresholds
     */
    getStatusClass(value, warningThreshold, dangerThreshold) {
        if (value > dangerThreshold) return 'danger';
        if (value > warningThreshold) return 'warning';
        return '';
    }

    /**
     * Calculate stability score
     */
    calculateStability(tilt, speed) {
        // Perfect stability = 100, decreases with tilt and excessive speed
        const tiltPenalty = Math.min(tilt * 2, 50);
        const speedPenalty = Math.max(0, (speed - 30) * 0.5);
        return Math.max(0, 100 - tiltPenalty - speedPenalty);
    }

    /**
     * Calculate performance score
     */
    calculatePerformance() {
        if (this.metrics.samples === 0) return 0;

        // Average of consistency and accuracy
        return (this.metrics.consistency + this.metrics.accuracy) / 2;
    }

    /**
     * Check and provide real-time feedback
     */
    checkAndProvideFeedback() {
        // Avoid feedback spam
        if (this.feedbackTimeout) return;

        const { headTilt, movementSpeed, stability } = this.trackingData;

        // Check head tilt
        if (headTilt > 25) {
            this.showFeedback('correction', '⚠️ Your head is tilted. Please straighten your neck.');
            this.metrics.corrections++;
            return;
        }

        // Check movement speed
        if (movementSpeed > 120) {
            this.showFeedback('correction', '⚠️ You\'re moving too fast. Slow down your movements.');
            this.metrics.corrections++;
            return;
        }

        // Check stability
        if (stability < 50) {
            this.showFeedback('warning', '💡 Try to keep your head more stable.');
            this.metrics.corrections++;
            return;
        }

        // Positive feedback
        if (stability > 90 && Math.random() < 0.02) { // 2% chance per check
            this.showFeedback('success', '✅ Excellent form! Keep it up!');
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(type, message, duration = 3000) {
        const container = document.getElementById('feedbackContainer');

        const feedbackEl = document.createElement('div');
        feedbackEl.className = `feedback-message ${type}`;
        feedbackEl.textContent = message;

        container.appendChild(feedbackEl);

        // Set timeout for this specific feedback
        this.feedbackTimeout = setTimeout(() => {
            feedbackEl.remove();
            this.feedbackTimeout = null;
        }, duration);
    }

    /**
     * Record metric sample
     */
    recordMetricSample() {
        this.metrics.samples++;

        // Update consistency (inverse of corrections rate)
        const correctionsRate = this.metrics.corrections / this.metrics.samples;
        this.metrics.consistency = Math.max(0, 100 - (correctionsRate * 100));

        // Update accuracy (based on stability)
        this.metrics.accuracy = (this.metrics.accuracy * (this.metrics.samples - 1) + this.trackingData.stability) / this.metrics.samples;
    }

    /**
     * Complete current exercise
     */
    completeExercise() {
        clearInterval(this.exerciseTimer);

        const duration = (Date.now() - this.exerciseStartTime) / 1000;

        // Record exercise data
        const exerciseData = {
            exercise: this.currentExercise,
            duration: duration,
            metrics: { ...this.metrics },
            trackingData: { ...this.trackingData },
            completed: true
        };

        this.currentSession.exercises.push(exerciseData);

        // Show completion message
        this.showFeedback('success', `✅ ${this.currentExercise.name} Complete!`, 2000);

        // Save to tracker
        this.saveExerciseData(exerciseData);

        // Move to next exercise or complete session
        this.currentExerciseIndex++;
        if (this.currentExerciseIndex < this.selectedExercises.length) {
            setTimeout(() => {
                this.startExercise(this.selectedExercises[this.currentExerciseIndex]);
            }, 3000);
        } else {
            setTimeout(() => {
                this.completeSession();
            }, 3000);
        }
    }

    /**
     * Save exercise data to tracker
     */
    async saveExerciseData(exerciseData) {
        const sessionData = {
            gameName: exerciseData.exercise.name,
            gameCategory: exerciseData.exercise.category,
            duration: Math.floor(exerciseData.duration),
            score: Math.round(exerciseData.metrics.accuracy),
            completed: exerciseData.completed,
            difficulty: exerciseData.exercise.targetDifficulty,
            metrics: {
                accuracy: exerciseData.metrics.accuracy,
                consistency: exerciseData.metrics.consistency,
                corrections: exerciseData.metrics.corrections,
                avgStability: exerciseData.trackingData.stability,
                avgHeadTilt: exerciseData.trackingData.headTilt,
                avgSpeed: exerciseData.trackingData.movementSpeed
            }
        };

        await this.tracker.recordSession(sessionData);
    }

    /**
     * Complete entire session
     */
    completeSession() {
        clearInterval(this.trackingInterval);

        // Calculate session stats
        const totalDuration = (Date.now() - this.sessionStartTime) / 1000;
        const avgPerformance = this.currentSession.exercises.reduce((sum, ex) =>
            sum + ex.metrics.accuracy, 0) / this.currentSession.exercises.length;
        const totalCorrections = this.currentSession.exercises.reduce((sum, ex) =>
            sum + ex.metrics.corrections, 0);

        // Hide VR and HUD
        document.getElementById('vrScene').style.display = 'none';
        document.getElementById('hudOverlay').style.display = 'none';

        // Show completion screen
        this.showCompletionScreen({
            totalDuration,
            avgPerformance,
            totalCorrections,
            exercisesCompleted: this.currentSession.exercises.length
        });
    }

    /**
     * Show completion screen
     */
    showCompletionScreen(stats) {
        document.getElementById('completionScreen').style.display = 'flex';

        // Populate stats
        const statsHtml = `
            <div class="completion-stat-row">
                <span>Exercises Completed</span>
                <strong>${stats.exercisesCompleted}</strong>
            </div>
            <div class="completion-stat-row">
                <span>Total Duration</span>
                <strong>${Math.floor(stats.totalDuration / 60)}m ${Math.floor(stats.totalDuration % 60)}s</strong>
            </div>
            <div class="completion-stat-row">
                <span>Average Performance</span>
                <strong>${stats.avgPerformance.toFixed(0)}%</strong>
            </div>
            <div class="completion-stat-row">
                <span>Form Corrections</span>
                <strong>${stats.totalCorrections}</strong>
            </div>
        `;
        document.getElementById('completionStats').innerHTML = statsHtml;

        // Generate feedback
        let feedback = '';
        if (stats.avgPerformance >= 85) {
            feedback = '🌟 Outstanding performance! You\'re making excellent progress toward recovery.';
        } else if (stats.avgPerformance >= 70) {
            feedback = '✅ Great work! Your consistency is improving with each session.';
        } else {
            feedback = '💪 Good effort! Focus on maintaining proper form in your next session.';
        }

        document.getElementById('performanceFeedback').innerHTML = `<p>${feedback}</p>`;
    }

    /**
     * Format time in MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Global instance
let vrController;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    vrController = new VRSessionController();
    await vrController.initialize();
});

// Start VR session
function startVRSession() {
    vrController.startSession();
}

// Start new session
function startNewSession() {
    window.location.reload();
}
