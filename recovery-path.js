/**
 * Recovery Path Manager
 * Manages the campaign-like progression system for concussion recovery
 * Guides users through structured phases from acute injury to full recovery
 */

class RecoveryPathManager {
    constructor() {
        this.currentUser = null;
        this.pathData = null;
        this.progressionTracker = null;

        // Define the recovery path structure
        this.recoveryPhases = [
            {
                id: 'acute',
                name: 'Acute Phase',
                subtitle: 'Rest & Initial Assessment',
                description: 'Focus on rest and gentle activities. Complete your initial assessment and begin with calming exercises.',
                duration: '1-7 days',
                dayRange: [0, 7],
                color: '#FF6B6B',
                icon: '🛡️',
                goals: {
                    sessions: 5,
                    assessmentRequired: true,
                    categories: ['calming'],
                    maxDifficulty: 'easy',
                    recommendedGames: ['Breathing Garden', 'Color Therapy', 'Meditation Space'],
                    dailyLimit: 2 // Max sessions per day
                },
                unlocks: {
                    games: [
                        'Breathing Garden',
                        'Color Therapy',
                        'Meditation Space',
                        'Nature Walk'
                    ],
                    features: ['Basic progression tracking']
                },
                clinicalMarkers: [
                    'Reduced headache severity',
                    'Improved sleep quality',
                    'Decreased light/noise sensitivity'
                ],
                tips: [
                    'Take frequent breaks',
                    'Stop if symptoms worsen',
                    'Practice in dim lighting',
                    'Keep sessions under 5 minutes'
                ]
            },
            {
                id: 'early_recovery',
                name: 'Early Recovery',
                subtitle: 'Light Cognitive & Visual Exercises',
                description: 'Gradually introduce visual tracking and light cognitive tasks. Monitor symptoms closely.',
                duration: '8-14 days',
                dayRange: [8, 14],
                color: '#FFB347',
                icon: '🌱',
                goals: {
                    sessions: 12,
                    assessmentRequired: false,
                    categories: ['calming', 'visual'],
                    maxDifficulty: 'easy',
                    recommendedGames: ['Focus Point', 'Smooth Pursuit', 'Color Memory'],
                    dailyLimit: 3,
                    streakDays: 5
                },
                unlocks: {
                    games: [
                        'Focus Point',
                        'Smooth Pursuit',
                        'Peripheral Vision',
                        'Color Memory'
                    ],
                    features: ['Symptom tracking', 'Daily goals']
                },
                clinicalMarkers: [
                    'Tolerating visual stimuli',
                    'Improved concentration',
                    'Reduced dizziness'
                ],
                tips: [
                    'Increase session time gradually',
                    'Track symptoms before and after',
                    'Aim for consistency over intensity',
                    'Sessions can be 5-10 minutes'
                ]
            },
            {
                id: 'progressive_recovery',
                name: 'Progressive Recovery',
                subtitle: 'Increased Difficulty & Variety',
                description: 'Expand into balance, memory, and coordination activities. Increase duration and challenge.',
                duration: '15-30 days',
                dayRange: [15, 30],
                color: '#50C878',
                icon: '📈',
                goals: {
                    sessions: 25,
                    assessmentRequired: true,
                    categories: ['calming', 'visual', 'memory', 'balance'],
                    maxDifficulty: 'medium',
                    recommendedGames: ['Balance Beam', 'Pattern Match', 'Saccade Training', 'Spatial Memory'],
                    dailyLimit: 4,
                    streakDays: 7,
                    totalMinutes: 120
                },
                unlocks: {
                    games: [
                        'Saccade Training',
                        'Balance Beam',
                        'Spatial Memory',
                        'Pattern Match',
                        'Sequence Recall',
                        'Room Navigation',
                        'Puzzle Assembly'
                    ],
                    features: ['Weekly goals', 'Advanced analytics', 'Milestone tracking']
                },
                clinicalMarkers: [
                    'Improved balance',
                    'Better memory recall',
                    'Tolerating complex visual tasks'
                ],
                tips: [
                    'Challenge yourself gradually',
                    'Mix different activity types',
                    'Sessions can be 10-15 minutes',
                    'Rest if symptoms increase'
                ]
            },
            {
                id: 'advanced_recovery',
                name: 'Advanced Recovery',
                subtitle: 'Complex Tasks & Coordination',
                description: 'Focus on coordination, reaction time, and multi-tasking. Prepare for return to activities.',
                duration: '30-60 days',
                dayRange: [30, 60],
                color: '#667eea',
                icon: '🎯',
                goals: {
                    sessions: 35,
                    assessmentRequired: true,
                    categories: ['visual', 'memory', 'balance', 'coordination'],
                    maxDifficulty: 'hard',
                    recommendedGames: ['Bubble Pop', 'Gentle Catch', 'Target Touch', 'Depth Perception'],
                    dailyLimit: 5,
                    streakDays: 10,
                    totalMinutes: 300,
                    allCategoriesRequired: true
                },
                unlocks: {
                    games: [
                        'Bubble Pop',
                        'Gentle Catch',
                        'Target Touch',
                        'Sound Localization',
                        'Depth Perception'
                    ],
                    features: ['Full game library', 'Advanced difficulty levels', 'Performance analytics']
                },
                clinicalMarkers: [
                    'Quick reaction times',
                    'Smooth coordination',
                    'Minimal to no symptoms',
                    'Sustained activity tolerance'
                ],
                tips: [
                    'Push your limits safely',
                    'Focus on precision and speed',
                    'Sessions can be 15-20 minutes',
                    'Maintain variety in activities'
                ]
            },
            {
                id: 'return_to_play',
                name: 'Return to Play',
                subtitle: 'Full Activity Resumption',
                description: 'Maintain skills and prepare for full return to normal activities. Focus on consistency and confidence.',
                duration: '60+ days',
                dayRange: [60, 999],
                color: '#764ba2',
                icon: '🏆',
                goals: {
                    sessions: 50,
                    assessmentRequired: true,
                    categories: ['visual', 'memory', 'balance', 'coordination', 'calming'],
                    maxDifficulty: 'hard',
                    recommendedGames: null, // All games recommended
                    dailyLimit: null, // No limit
                    streakDays: 14,
                    totalMinutes: 600,
                    allCategoriesRequired: true
                },
                unlocks: {
                    games: 'all',
                    features: ['Full access', 'Expert mode', 'Custom challenges']
                },
                clinicalMarkers: [
                    'Symptom-free for 2+ weeks',
                    'Full cognitive function',
                    'Normal balance and coordination',
                    'Medical clearance obtained'
                ],
                tips: [
                    'Maintain regular practice',
                    'Continue monitoring symptoms',
                    'Gradually return to sports/activities',
                    'Consult with healthcare provider'
                ]
            }
        ];

        // All games in the system
        this.allGames = {
            visual: ['Smooth Pursuit', 'Saccade Training', 'Focus Point', 'Peripheral Vision'],
            balance: ['Balance Beam', 'Spatial Memory', 'Room Navigation', 'Depth Perception'],
            memory: ['Color Memory', 'Pattern Match', 'Sequence Recall', 'Puzzle Assembly'],
            coordination: ['Bubble Pop', 'Gentle Catch', 'Target Touch', 'Sound Localization'],
            calming: ['Breathing Garden', 'Color Therapy', 'Meditation Space', 'Nature Walk']
        };
    }

    /**
     * Initialize the recovery path system
     */
    async initialize() {
        try {
            // Check authentication
            const { data: { user } } = await window._supabase.auth.getUser();
            this.currentUser = user;

            // Initialize progression tracker
            this.progressionTracker = new ProgressionTracker();
            await this.progressionTracker.initialize();

            // Load or create path data
            await this.loadPathData();

            return true;
        } catch (error) {
            console.error('Error initializing recovery path:', error);
            return false;
        }
    }

    /**
     * Load user's recovery path data
     */
    async loadPathData() {
        try {
            if (this.currentUser) {
                // Load from Supabase
                const { data, error } = await window._supabase
                    .from('recovery_paths')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                    throw error;
                }

                if (data) {
                    this.pathData = data;
                } else {
                    // Create new path
                    await this.createNewPath();
                }
            } else {
                // Load from localStorage
                const stored = localStorage.getItem('recovery_path');
                if (stored) {
                    this.pathData = JSON.parse(stored);
                } else {
                    await this.createNewPath();
                }
            }
        } catch (error) {
            console.error('Error loading path data:', error);
            await this.createNewPath();
        }
    }

    /**
     * Create a new recovery path for the user
     */
    async createNewPath() {
        const newPath = {
            user_id: this.currentUser?.id || 'guest',
            current_phase: 'acute',
            phase_start_date: new Date().toISOString(),
            injury_date: new Date().toISOString(),
            completed_phases: [],
            phase_progress: {},
            custom_settings: {
                skipPhaseRequirements: false,
                customInjuryDate: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (this.currentUser) {
            // Save to Supabase
            const { data, error } = await window._supabase
                .from('recovery_paths')
                .insert([newPath])
                .select()
                .single();

            if (error) throw error;
            this.pathData = data;
        } else {
            // Save to localStorage
            this.pathData = newPath;
            localStorage.setItem('recovery_path', JSON.stringify(newPath));
        }
    }

    /**
     * Get the current phase information
     */
    getCurrentPhase() {
        return this.recoveryPhases.find(p => p.id === this.pathData.current_phase);
    }

    /**
     * Get phase by ID
     */
    getPhase(phaseId) {
        return this.recoveryPhases.find(p => p.id === phaseId);
    }

    /**
     * Calculate days since injury
     */
    getDaysSinceInjury() {
        const injuryDate = new Date(this.pathData.custom_settings?.customInjuryDate || this.pathData.injury_date);
        const now = new Date();
        const diffTime = Math.abs(now - injuryDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Check if a game is unlocked in the current phase
     */
    isGameUnlocked(gameName) {
        const currentPhase = this.getCurrentPhase();

        // Check if all games are unlocked
        if (currentPhase.unlocks.games === 'all') {
            return true;
        }

        // Check if game is in current phase unlocks
        if (currentPhase.unlocks.games.includes(gameName)) {
            return true;
        }

        // Check if game was unlocked in previous phases
        for (const phaseId of this.pathData.completed_phases) {
            const phase = this.getPhase(phaseId);
            if (phase.unlocks.games === 'all' || phase.unlocks.games.includes(gameName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all unlocked games
     */
    getUnlockedGames() {
        const unlocked = [];
        const currentPhase = this.getCurrentPhase();

        if (currentPhase.unlocks.games === 'all') {
            // Return all games
            for (const category in this.allGames) {
                unlocked.push(...this.allGames[category]);
            }
            return unlocked;
        }

        // Add current phase unlocks
        unlocked.push(...currentPhase.unlocks.games);

        // Add previous phase unlocks
        for (const phaseId of this.pathData.completed_phases) {
            const phase = this.getPhase(phaseId);
            if (phase.unlocks.games !== 'all') {
                unlocked.push(...phase.unlocks.games);
            }
        }

        return [...new Set(unlocked)]; // Remove duplicates
    }

    /**
     * Check phase completion progress
     */
    async checkPhaseProgress() {
        const currentPhase = this.getCurrentPhase();
        const stats = await this.progressionTracker.getOverallStats();
        const goals = currentPhase.goals;

        const progress = {
            sessions: {
                current: stats.totalSessions,
                required: goals.sessions,
                completed: stats.totalSessions >= goals.sessions
            },
            assessment: {
                required: goals.assessmentRequired,
                completed: await this.hasRecentAssessment()
            },
            categories: {
                current: stats.categoryCounts,
                required: goals.categories,
                completed: this.checkCategoryRequirement(stats, goals)
            },
            streak: goals.streakDays ? {
                current: stats.currentStreak,
                required: goals.streakDays,
                completed: stats.currentStreak >= goals.streakDays
            } : null,
            totalTime: goals.totalMinutes ? {
                current: Math.floor(stats.totalDuration / 60),
                required: goals.totalMinutes,
                completed: (stats.totalDuration / 60) >= goals.totalMinutes
            } : null,
            dailyLimit: goals.dailyLimit ? {
                limit: goals.dailyLimit,
                todayCount: await this.getTodaySessionCount()
            } : null
        };

        // Calculate overall completion percentage
        const requirements = [
            progress.sessions.completed,
            progress.assessment.completed,
            progress.categories.completed
        ];

        if (progress.streak) requirements.push(progress.streak.completed);
        if (progress.totalTime) requirements.push(progress.totalTime.completed);

        const completedCount = requirements.filter(r => r).length;
        progress.overallPercentage = (completedCount / requirements.length) * 100;
        progress.canAdvance = progress.overallPercentage === 100;

        return progress;
    }

    /**
     * Check if user has a recent assessment
     */
    async hasRecentAssessment() {
        const assessments = localStorage.getItem('assessmentResults');
        if (!assessments) return false;

        const results = JSON.parse(assessments);
        if (!results || results.length === 0) return false;

        // Check if there's an assessment in the last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return results.some(a => new Date(a.timestamp).getTime() > sevenDaysAgo);
    }

    /**
     * Check category requirement
     */
    checkCategoryRequirement(stats, goals) {
        const requiredCategories = goals.categories;
        const playedCategories = Object.keys(stats.categoryCounts);

        if (goals.allCategoriesRequired) {
            return requiredCategories.every(cat => playedCategories.includes(cat));
        }

        return requiredCategories.some(cat => playedCategories.includes(cat));
    }

    /**
     * Get today's session count
     */
    async getTodaySessionCount() {
        const today = new Date().toISOString().split('T')[0];
        const sessions = await this.progressionTracker.getRecentSessions(1);
        return sessions.filter(s => s.timestamp.startsWith(today)).length;
    }

    /**
     * Advance to next phase
     */
    async advancePhase() {
        const currentPhaseIndex = this.recoveryPhases.findIndex(p => p.id === this.pathData.current_phase);

        if (currentPhaseIndex === -1 || currentPhaseIndex === this.recoveryPhases.length - 1) {
            return { success: false, message: 'Already at final phase' };
        }

        const progress = await this.checkPhaseProgress();
        if (!progress.canAdvance && !this.pathData.custom_settings.skipPhaseRequirements) {
            return { success: false, message: 'Phase requirements not met', progress };
        }

        // Mark current phase as completed
        if (!this.pathData.completed_phases.includes(this.pathData.current_phase)) {
            this.pathData.completed_phases.push(this.pathData.current_phase);
        }

        // Store progress for current phase
        this.pathData.phase_progress[this.pathData.current_phase] = progress;

        // Move to next phase
        const nextPhase = this.recoveryPhases[currentPhaseIndex + 1];
        this.pathData.current_phase = nextPhase.id;
        this.pathData.phase_start_date = new Date().toISOString();
        this.pathData.updated_at = new Date().toISOString();

        await this.savePathData();

        return { success: true, message: `Advanced to ${nextPhase.name}!`, nextPhase };
    }

    /**
     * Save path data
     */
    async savePathData() {
        if (this.currentUser) {
            const { error } = await window._supabase
                .from('recovery_paths')
                .update(this.pathData)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
        } else {
            localStorage.setItem('recovery_path', JSON.stringify(this.pathData));
        }
    }

    /**
     * Set custom injury date
     */
    async setInjuryDate(date) {
        this.pathData.custom_settings.customInjuryDate = new Date(date).toISOString();
        this.pathData.updated_at = new Date().toISOString();
        await this.savePathData();
    }

    /**
     * Get recommended phase based on days since injury
     */
    getRecommendedPhase() {
        const days = this.getDaysSinceInjury();

        for (const phase of this.recoveryPhases) {
            if (days >= phase.dayRange[0] && days <= phase.dayRange[1]) {
                return phase;
            }
        }

        return this.recoveryPhases[this.recoveryPhases.length - 1]; // Return final phase if beyond range
    }

    /**
     * Get next milestone
     */
    getNextMilestone() {
        const currentPhaseIndex = this.recoveryPhases.findIndex(p => p.id === this.pathData.current_phase);

        if (currentPhaseIndex === this.recoveryPhases.length - 1) {
            return null; // At final phase
        }

        return this.recoveryPhases[currentPhaseIndex + 1];
    }
}

// Make available globally
window.RecoveryPathManager = RecoveryPathManager;
