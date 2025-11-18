/**
 * Intelligent Exercise Selection and Adaptive Difficulty System
 * Analyzes user performance and automatically selects optimal exercises
 */

class ExerciseAI {
    constructor(progressionTracker) {
        this.tracker = progressionTracker;
        this.exerciseLibrary = this.initializeExerciseLibrary();
        this.userLevel = 0;
        this.skillLevels = {
            visual: 0,
            balance: 0,
            cognitive: 0,
            coordination: 0,
            vestibular: 0
        };
    }

    /**
     * Initialize complete exercise library with metadata
     */
    initializeExerciseLibrary() {
        return [
            // Visual Tracking Exercises
            {
                id: 'smooth-pursuit',
                name: 'Smooth Pursuit Tracking',
                category: 'visual',
                skillTargets: ['visual', 'vestibular'],
                baselineDifficulty: 1,
                maxDifficulty: 10,
                duration: 180, // seconds
                description: 'Follow smoothly moving objects with your eyes',
                metrics: ['headStability', 'trackingAccuracy', 'smoothness'],
                adaptiveParams: {
                    speed: { min: 10, max: 80, unit: 'deg/s' },
                    objectCount: { min: 1, max: 4 },
                    pathComplexity: { min: 1, max: 5 }
                }
            },
            {
                id: 'saccade-training',
                name: 'Saccade Eye Movement',
                category: 'visual',
                skillTargets: ['visual', 'coordination'],
                baselineDifficulty: 1,
                maxDifficulty: 10,
                duration: 120,
                description: 'Quick eye movements between targets',
                metrics: ['reactionTime', 'accuracy', 'headStability'],
                adaptiveParams: {
                    targetDistance: { min: 5, max: 45, unit: 'degrees' },
                    frequency: { min: 0.5, max: 3, unit: 'Hz' },
                    targetSize: { min: 2, max: 10, unit: 'degrees' }
                }
            },
            {
                id: 'peripheral-vision',
                name: 'Peripheral Awareness',
                category: 'visual',
                skillTargets: ['visual', 'cognitive'],
                baselineDifficulty: 2,
                maxDifficulty: 10,
                duration: 150,
                description: 'Detect objects in peripheral vision',
                metrics: ['detectionRate', 'reactionTime', 'falsePositives'],
                adaptiveParams: {
                    eccentricity: { min: 10, max: 60, unit: 'degrees' },
                    duration: { min: 500, max: 2000, unit: 'ms' },
                    distractors: { min: 0, max: 5 }
                }
            },

            // Balance Exercises
            {
                id: 'balance-beam',
                name: 'Virtual Balance Beam',
                category: 'balance',
                skillTargets: ['balance', 'vestibular', 'visual'],
                baselineDifficulty: 2,
                maxDifficulty: 10,
                duration: 180,
                description: 'Walk along a virtual beam',
                metrics: ['sway', 'stepAccuracy', 'completionTime'],
                adaptiveParams: {
                    beamWidth: { min: 5, max: 50, unit: 'cm' },
                    beamHeight: { min: 0, max: 10, unit: 'meters' },
                    distractors: { min: 0, max: 3 }
                }
            },
            {
                id: 'head-stabilization',
                name: 'Head Stabilization',
                category: 'balance',
                skillTargets: ['balance', 'vestibular'],
                baselineDifficulty: 1,
                maxDifficulty: 10,
                duration: 120,
                description: 'Maintain head position while body moves',
                metrics: ['headStability', 'bodyMovement', 'vestibularResponse'],
                adaptiveParams: {
                    movementSpeed: { min: 5, max: 40, unit: 'deg/s' },
                    movementRange: { min: 10, max: 90, unit: 'degrees' },
                    visualComplexity: { min: 1, max: 5 }
                }
            },

            // Cognitive Exercises
            {
                id: 'working-memory',
                name: 'Working Memory Challenge',
                category: 'cognitive',
                skillTargets: ['cognitive', 'visual'],
                baselineDifficulty: 1,
                maxDifficulty: 10,
                duration: 180,
                description: 'Remember and recall sequences',
                metrics: ['accuracy', 'responseTime', 'capacity'],
                adaptiveParams: {
                    sequenceLength: { min: 3, max: 9 },
                    complexity: { min: 1, max: 5 },
                    delay: { min: 1, max: 10, unit: 'seconds' }
                }
            },
            {
                id: 'dual-task',
                name: 'Dual Task Training',
                category: 'cognitive',
                skillTargets: ['cognitive', 'coordination'],
                baselineDifficulty: 3,
                maxDifficulty: 10,
                duration: 150,
                description: 'Perform two tasks simultaneously',
                metrics: ['taskAccuracy', 'divideAttention', 'cognitiveLoad'],
                adaptiveParams: {
                    task1Difficulty: { min: 1, max: 5 },
                    task2Difficulty: { min: 1, max: 5 },
                    simultaneity: { min: 0, max: 100, unit: 'percent' }
                }
            },

            // Coordination Exercises
            {
                id: 'hand-eye-coordination',
                name: 'Hand-Eye Coordination',
                category: 'coordination',
                skillTargets: ['coordination', 'visual'],
                baselineDifficulty: 1,
                maxDifficulty: 10,
                duration: 180,
                description: 'Coordinate hand movements with visual targets',
                metrics: ['accuracy', 'reactionTime', 'smoothness'],
                adaptiveParams: {
                    targetSpeed: { min: 10, max: 60, unit: 'cm/s' },
                    targetSize: { min: 2, max: 15, unit: 'cm' },
                    predictability: { min: 0, max: 100, unit: 'percent' }
                }
            },

            // Vestibular Exercises
            {
                id: 'gaze-stabilization',
                name: 'Gaze Stabilization',
                category: 'balance',
                skillTargets: ['vestibular', 'visual'],
                baselineDifficulty: 2,
                maxDifficulty: 10,
                duration: 120,
                description: 'Maintain visual focus during head movement',
                metrics: ['gazeStability', 'headMovement', 'visualAccuracy'],
                adaptiveParams: {
                    headSpeed: { min: 10, max: 120, unit: 'deg/s' },
                    targetMovement: { min: 0, max: 50, unit: 'percent' },
                    backgroundComplexity: { min: 1, max: 5 }
                }
            }
        ];
    }

    /**
     * Analyze user performance and calculate current skill levels
     */
    async analyzeUserPerformance() {
        const sessions = this.tracker.data.sessions || [];

        if (sessions.length === 0) {
            return {
                overall: 0,
                skills: { ...this.skillLevels },
                recommendations: ['Start with baseline exercises to establish your current level']
            };
        }

        // Calculate overall level based on sessions and performance
        const totalSessions = sessions.length;
        const avgCompletion = sessions.reduce((sum, s) => sum + (s.completed ? 1 : 0), 0) / totalSessions;
        const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions;

        // Calculate skill-specific levels
        const categoryProgress = this.tracker.getCategoryProgress();

        Object.keys(this.skillLevels).forEach(skill => {
            const categoryKey = this.mapSkillToCategory(skill);
            const category = Object.values(categoryProgress).find(c => c.key === categoryKey);

            if (category && category.sessions > 0) {
                // Level based on sessions and average performance
                const sessionScore = Math.min(category.sessions * 0.5, 5);
                const performanceScore = (avgScore / 100) * 5;
                this.skillLevels[skill] = Math.min(10, sessionScore + performanceScore);
            }
        });

        // Calculate overall user level (0-10 scale)
        this.userLevel = Math.min(10, (totalSessions * 0.2) + (avgCompletion * 3) + (avgScore / 100 * 3));

        return {
            overall: this.userLevel,
            skills: { ...this.skillLevels },
            totalSessions,
            avgCompletion: Math.round(avgCompletion * 100),
            avgScore: Math.round(avgScore)
        };
    }

    /**
     * Select optimal exercises based on user performance
     */
    async selectExercises(sessionDuration = 900, exerciseCount = 3) {
        // First analyze current performance
        const analysis = await this.analyzeUserPerformance();

        // Identify weak areas that need focus
        const weakSkills = Object.entries(analysis.skills)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 2)
            .map(([skill]) => skill);

        // Select exercises
        const selectedExercises = [];
        let remainingDuration = sessionDuration;

        // 1. Select one exercise for weakest skill
        if (weakSkills.length > 0) {
            const weakExercise = this.findBestExercise(weakSkills[0], analysis.overall);
            if (weakExercise) {
                selectedExercises.push(this.configureExercise(weakExercise, analysis.skills));
                remainingDuration -= weakExercise.duration;
            }
        }

        // 2. Select balanced exercises for remaining slots
        const usedCategories = new Set(selectedExercises.map(e => e.category));

        while (selectedExercises.length < exerciseCount && remainingDuration > 60) {
            // Find exercises from unused categories
            const availableExercises = this.exerciseLibrary.filter(ex =>
                !usedCategories.has(ex.category) &&
                ex.duration <= remainingDuration &&
                ex.baselineDifficulty <= analysis.overall + 1
            );

            if (availableExercises.length === 0) break;

            // Pick exercise that targets needed skills
            const nextExercise = this.selectNextExercise(availableExercises, analysis.skills);
            selectedExercises.push(this.configureExercise(nextExercise, analysis.skills));
            usedCategories.add(nextExercise.category);
            remainingDuration -= nextExercise.duration;
        }

        return {
            exercises: selectedExercises,
            totalDuration: sessionDuration - remainingDuration,
            rationale: this.generateRationale(selectedExercises, analysis),
            userAnalysis: analysis
        };
    }

    /**
     * Find best exercise for a specific skill
     */
    findBestExercise(skill, userLevel) {
        const candidates = this.exerciseLibrary.filter(ex =>
            ex.skillTargets.includes(skill) &&
            ex.baselineDifficulty <= userLevel + 1
        );

        if (candidates.length === 0) {
            return this.exerciseLibrary[0]; // fallback
        }

        // Prefer exercises slightly above current level
        return candidates.sort((a, b) =>
            Math.abs(a.baselineDifficulty - userLevel) - Math.abs(b.baselineDifficulty - userLevel)
        )[0];
    }

    /**
     * Select next exercise based on skill needs
     */
    selectNextExercise(availableExercises, skillLevels) {
        // Score each exercise based on how well it addresses skill gaps
        const scored = availableExercises.map(ex => {
            const skillScore = ex.skillTargets.reduce((sum, skill) => {
                return sum + (10 - (skillLevels[skill] || 5));
            }, 0) / ex.skillTargets.length;

            return { exercise: ex, score: skillScore };
        });

        // Return highest scoring exercise
        scored.sort((a, b) => b.score - a.score);
        return scored[0].exercise;
    }

    /**
     * Configure exercise with adaptive difficulty parameters
     */
    configureExercise(exercise, skillLevels) {
        const configured = { ...exercise };

        // Calculate target difficulty based on relevant skill levels
        const relevantSkills = exercise.skillTargets.map(s => skillLevels[s] || 0);
        const avgSkillLevel = relevantSkills.reduce((a, b) => a + b, 0) / relevantSkills.length;

        // Set difficulty slightly above current skill level
        configured.targetDifficulty = Math.min(
            exercise.maxDifficulty,
            Math.max(exercise.baselineDifficulty, Math.ceil(avgSkillLevel + 0.5))
        );

        // Configure adaptive parameters based on difficulty
        configured.configuredParams = {};
        Object.entries(exercise.adaptiveParams).forEach(([param, range]) => {
            const ratio = (configured.targetDifficulty - exercise.baselineDifficulty) /
                         (exercise.maxDifficulty - exercise.baselineDifficulty);

            if (param.includes('size') || param.includes('width')) {
                // Inverse scaling for size parameters (smaller = harder)
                configured.configuredParams[param] = range.max - (ratio * (range.max - range.min));
            } else {
                // Normal scaling (higher = harder)
                configured.configuredParams[param] = range.min + (ratio * (range.max - range.min));
            }
        });

        return configured;
    }

    /**
     * Generate exercise rationale for user
     */
    generateRationale(exercises, analysis) {
        const weakestSkill = Object.entries(analysis.skills)
            .sort((a, b) => a[1] - b[1])[0];

        return {
            summary: `Based on your ${analysis.totalSessions} sessions and ${analysis.avgScore}% average performance, ` +
                    `we've selected exercises targeting ${this.formatSkillName(weakestSkill[0])} and overall recovery.`,
            focusAreas: exercises.map(ex => ({
                exercise: ex.name,
                targets: ex.skillTargets.map(s => this.formatSkillName(s)),
                difficulty: ex.targetDifficulty,
                reason: `Targets ${ex.skillTargets.join(', ')} at level ${ex.targetDifficulty}`
            })),
            expectedBenefits: [
                'Improved balance and stability',
                'Enhanced visual tracking',
                'Better cognitive function',
                'Increased exercise tolerance'
            ]
        };
    }

    /**
     * Evaluate performance and determine if difficulty should increase
     */
    evaluatePerformance(exerciseId, metrics) {
        // Calculate performance score (0-100)
        const scores = {
            accuracy: metrics.accuracy || 0,
            completion: metrics.completed ? 100 : 50,
            consistency: metrics.consistency || 0,
            efficiency: metrics.efficiency || 0
        };

        const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

        // Determine next difficulty
        const shouldIncrease = overallScore >= 80 && metrics.completed;
        const shouldDecrease = overallScore < 50;

        return {
            score: overallScore,
            shouldIncrease,
            shouldDecrease,
            feedback: this.generatePerformanceFeedback(overallScore, metrics),
            nextDifficulty: this.calculateNextDifficulty(exerciseId, overallScore)
        };
    }

    /**
     * Calculate next difficulty level
     */
    calculateNextDifficulty(exerciseId, performanceScore) {
        const exercise = this.exerciseLibrary.find(ex => ex.id === exerciseId);
        if (!exercise) return 1;

        // Get current difficulty from last session
        const lastSession = this.tracker.data.sessions
            ?.filter(s => s.gameId === exerciseId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        const currentDifficulty = lastSession?.difficulty || exercise.baselineDifficulty;

        // Adjust based on performance
        if (performanceScore >= 85) {
            return Math.min(exercise.maxDifficulty, currentDifficulty + 1);
        } else if (performanceScore >= 70) {
            return currentDifficulty; // maintain
        } else if (performanceScore < 50) {
            return Math.max(exercise.baselineDifficulty, currentDifficulty - 1);
        }

        return currentDifficulty;
    }

    /**
     * Generate performance feedback
     */
    generatePerformanceFeedback(score, metrics) {
        if (score >= 90) {
            return {
                level: 'excellent',
                message: 'Excellent performance! You\'re ready for increased difficulty.',
                icon: '🌟'
            };
        } else if (score >= 75) {
            return {
                level: 'good',
                message: 'Good work! Keep practicing at this level to build consistency.',
                icon: '✅'
            };
        } else if (score >= 60) {
            return {
                level: 'fair',
                message: 'Fair performance. Focus on maintaining proper form.',
                icon: '👍'
            };
        } else {
            return {
                level: 'needs-improvement',
                message: 'Take your time and focus on quality over speed.',
                icon: '💪'
            };
        }
    }

    // Helper functions
    mapSkillToCategory(skill) {
        const mapping = {
            visual: 'visual',
            balance: 'balance',
            cognitive: 'cognitive',
            coordination: 'coordination',
            vestibular: 'balance'
        };
        return mapping[skill] || 'visual';
    }

    formatSkillName(skill) {
        return skill.charAt(0).toUpperCase() + skill.slice(1);
    }

    /**
     * Get exercise by ID
     */
    getExercise(exerciseId) {
        return this.exerciseLibrary.find(ex => ex.id === exerciseId);
    }

    /**
     * Get all exercises
     */
    getAllExercises() {
        return this.exerciseLibrary;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExerciseAI;
}
