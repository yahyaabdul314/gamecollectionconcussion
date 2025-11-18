/**
 * Progression Tracking System for VR Concussion Recovery Games
 * Tracks game performance, therapy progress, and provides recommendations
 * Supports both Supabase (cloud) and localStorage (local) storage
 */

class ProgressionTracker {
    constructor() {
        this.storageKey = 'concussion_progression';
        this.goalsKey = 'concussion_goals';
        this.useSupabase = false;
        this.authManager = null;
        this.currentUser = null;

        // Initialize Supabase if available
        this.initializeSupabase();

        this.data = null;
        this.goals = null;
        this.initialized = false;
    }

    /**
     * Initialize Supabase connection
     */
    async initializeSupabase() {
        // Check if we're in guest mode - skip Supabase entirely
        const isGuestMode = typeof localStorage !== 'undefined' && localStorage.getItem('guestMode') === 'true';
        if (isGuestMode) {
            console.log('Progression Tracker: Guest mode detected, using localStorage only');
            this.useSupabase = false;
            return;
        }

        // Try to initialize Supabase if available
        if (typeof getAuthManager === 'function') {
            try {
                this.authManager = getAuthManager();

                // Check if authManager has valid supabase client
                if (!this.authManager || !this.authManager.supabase) {
                    console.log('Progression Tracker: AuthManager has no Supabase client, falling back to localStorage');
                    this.useSupabase = false;
                    return;
                }

                this.currentUser = await this.authManager.getCurrentUser();
                this.useSupabase = !!this.currentUser;
                console.log('Progression Tracker:', this.useSupabase ? 'Using Supabase' : 'Using localStorage');
            } catch (error) {
                console.log('Progression Tracker: Supabase not available, falling back to localStorage:', error.message);
                this.useSupabase = false;
            }
        } else {
            console.log('Progression Tracker: getAuthManager not available, using localStorage');
            this.useSupabase = false;
        }
    }

    /**
     * Ensure tracker is initialized (async)
     */
    async initialize() {
        if (this.initialized) return;

        await this.initializeSupabase();

        if (this.useSupabase) {
            await this.loadFromSupabase();
        } else {
            this.data = this.loadDataLocal();
            this.goals = this.loadGoalsLocal();
        }

        this.initialized = true;
    }

    /**
     * Load progression data from localStorage
     */
    loadDataLocal() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            sessions: [],
            gameProgress: {},
            startDate: new Date().toISOString(),
            lastActive: null,
            milestones: []
        };
    }

    /**
     * Save progression data to localStorage
     */
    saveDataLocal() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    /**
     * Load goals from localStorage
     */
    loadGoalsLocal() {
        const stored = localStorage.getItem(this.goalsKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            daily: { target: 3, unit: 'games' },
            weekly: { target: 15, unit: 'games' },
            customGoals: []
        };
    }

    /**
     * Save goals to localStorage
     */
    saveGoalsLocal() {
        localStorage.setItem(this.goalsKey, JSON.stringify(this.goals));
    }

    /**
     * Load all data from Supabase
     */
    async loadFromSupabase() {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            const supabase = getSupabaseClient();

            // Load sessions
            const { data: sessions, error: sessionsError } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('timestamp', { ascending: true });

            if (sessionsError) throw sessionsError;

            // Load goals
            const { data: goalsData, error: goalsError } = await supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            // Load milestones
            const { data: milestones, error: milestonesError } = await supabase
                .from('user_milestones')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (milestonesError) throw milestonesError;

            // Process sessions to build gameProgress
            const gameProgress = {};
            sessions.forEach(session => {
                if (!gameProgress[session.game_name]) {
                    gameProgress[session.game_name] = {
                        firstPlayed: session.timestamp,
                        sessionsCount: 0,
                        totalDuration: 0,
                        highScore: 0,
                        currentDifficulty: 'easy',
                        completionRate: 0,
                        averageScore: 0
                    };
                }

                const progress = gameProgress[session.game_name];
                progress.sessionsCount++;
                progress.totalDuration += session.duration;
                progress.highScore = Math.max(progress.highScore, session.score || 0);
                progress.lastPlayed = session.timestamp;
            });

            // Calculate averages and completion rates
            Object.keys(gameProgress).forEach(gameName => {
                const gameSessions = sessions.filter(s => s.game_name === gameName);
                const scores = gameSessions.filter(s => s.score).map(s => s.score);
                const completed = gameSessions.filter(s => s.completed);

                gameProgress[gameName].averageScore = scores.length > 0
                    ? scores.reduce((a, b) => a + b, 0) / scores.length
                    : 0;
                gameProgress[gameName].completionRate = (completed.length / gameSessions.length) * 100;
            });

            this.data = {
                sessions: sessions.map(s => ({
                    id: s.id,
                    timestamp: s.timestamp,
                    gameName: s.game_name,
                    gameCategory: s.game_category,
                    duration: s.duration,
                    difficulty: s.difficulty,
                    score: s.score,
                    completed: s.completed,
                    metrics: s.metrics || {},
                    physicsData: s.physics_data,
                    symptoms: s.symptoms
                })),
                gameProgress,
                startDate: sessions[0]?.timestamp || new Date().toISOString(),
                lastActive: sessions[sessions.length - 1]?.timestamp || null,
                milestones: milestones.map(m => ({
                    id: m.milestone_id,
                    name: m.name,
                    description: m.description,
                    earnedAt: m.earned_at
                }))
            };

            this.goals = goalsData ? {
                daily: goalsData.daily_goal || { target: 3, unit: 'games' },
                weekly: goalsData.weekly_goal || { target: 15, unit: 'games' },
                customGoals: goalsData.custom_goals || []
            } : {
                daily: { target: 3, unit: 'games' },
                weekly: { target: 15, unit: 'games' },
                customGoals: []
            };

        } catch (error) {
            console.error('Error loading from Supabase:', error);
            // Fallback to localStorage
            this.data = this.loadDataLocal();
            this.goals = this.loadGoalsLocal();
        }
    }

    /**
     * Save data (automatically chooses Supabase or localStorage)
     */
    async saveData() {
        if (this.useSupabase && this.currentUser) {
            // Supabase saves happen per-session, not bulk
            return;
        } else {
            this.saveDataLocal();
        }
    }

    /**
     * Save goals (automatically chooses Supabase or localStorage)
     */
    async saveGoals() {
        if (this.useSupabase && this.currentUser) {
            await this.saveGoalsToSupabase();
        } else {
            this.saveGoalsLocal();
        }
    }

    /**
     * Save goals to Supabase
     */
    async saveGoalsToSupabase() {
        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase
                .from('user_goals')
                .upsert({
                    user_id: this.currentUser.id,
                    daily_goal: this.goals.daily,
                    weekly_goal: this.goals.weekly,
                    custom_goals: this.goals.customGoals,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving goals to Supabase:', error);
        }
    }

    /**
     * Record a game session
     * @param {Object} session - Session data
     */
    async recordSession(session) {
        // Ensure initialized
        if (!this.initialized) {
            await this.initialize();
        }

        const sessionData = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            gameName: session.gameName,
            gameCategory: session.gameCategory,
            duration: session.duration, // in seconds
            difficulty: session.difficulty || 'easy',
            score: session.score || 0,
            completed: session.completed || false,
            metrics: session.metrics || {}, // Custom game metrics
            physicsData: session.physicsData || null, // Head movement data
            symptoms: session.symptoms || null // Any symptoms during play
        };

        // Save to Supabase if authenticated
        if (this.useSupabase && this.currentUser) {
            await this.recordSessionToSupabase(sessionData);
        }

        // Also update local data cache
        this.data.sessions.push(sessionData);
        this.data.lastActive = sessionData.timestamp;

        // Update game-specific progress
        if (!this.data.gameProgress[session.gameName]) {
            this.data.gameProgress[session.gameName] = {
                firstPlayed: sessionData.timestamp,
                sessionsCount: 0,
                totalDuration: 0,
                highScore: 0,
                currentDifficulty: 'easy',
                completionRate: 0,
                averageScore: 0
            };
        }

        const gameProgress = this.data.gameProgress[session.gameName];
        gameProgress.sessionsCount++;
        gameProgress.totalDuration += session.duration;
        gameProgress.highScore = Math.max(gameProgress.highScore, session.score || 0);
        gameProgress.lastPlayed = sessionData.timestamp;

        // Update average score
        const allScores = this.data.sessions
            .filter(s => s.gameName === session.gameName && s.score)
            .map(s => s.score);
        gameProgress.averageScore = allScores.length > 0
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;

        // Update completion rate
        const gameSessions = this.data.sessions.filter(s => s.gameName === session.gameName);
        const completedSessions = gameSessions.filter(s => s.completed);
        gameProgress.completionRate = (completedSessions.length / gameSessions.length) * 100;

        // Check for milestones
        await this.checkMilestones(sessionData);

        // Save to localStorage if not using Supabase
        if (!this.useSupabase) {
            this.saveDataLocal();
        }

        return sessionData;
    }

    /**
     * Save session to Supabase
     */
    async recordSessionToSupabase(sessionData) {
        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase
                .from('game_sessions')
                .insert([{
                    user_id: this.currentUser.id,
                    timestamp: sessionData.timestamp,
                    game_name: sessionData.gameName,
                    game_category: sessionData.gameCategory,
                    duration: sessionData.duration,
                    difficulty: sessionData.difficulty,
                    score: sessionData.score,
                    completed: sessionData.completed,
                    metrics: sessionData.metrics,
                    physics_data: sessionData.physicsData,
                    symptoms: sessionData.symptoms
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving session to Supabase:', error);
            // Fall back to localStorage
            this.saveDataLocal();
        }
    }

    /**
     * Check and award milestones
     */
    async checkMilestones(session) {
        const milestones = [
            {
                id: 'first_session',
                name: 'First Steps',
                description: 'Complete your first therapy session',
                condition: () => this.data.sessions.length === 1
            },
            {
                id: 'five_sessions',
                name: 'Building Momentum',
                description: 'Complete 5 therapy sessions',
                condition: () => this.data.sessions.length === 5
            },
            {
                id: 'ten_sessions',
                name: 'Dedicated Recoverer',
                description: 'Complete 10 therapy sessions',
                condition: () => this.data.sessions.length === 10
            },
            {
                id: 'twenty_sessions',
                name: 'Road to Recovery',
                description: 'Complete 20 therapy sessions',
                condition: () => this.data.sessions.length === 20
            },
            {
                id: 'all_categories',
                name: 'Well Rounded',
                description: 'Play games from all 5 categories',
                condition: () => {
                    const categories = new Set(this.data.sessions.map(s => s.gameCategory));
                    return categories.size >= 5;
                }
            },
            {
                id: 'week_streak',
                name: 'Consistent Effort',
                description: 'Play games for 7 consecutive days',
                condition: () => this.getStreakDays() >= 7
            },
            {
                id: 'hour_played',
                name: 'Time Investment',
                description: 'Spend 1 hour in therapy',
                condition: () => {
                    const totalSeconds = this.data.sessions.reduce((sum, s) => sum + s.duration, 0);
                    return totalSeconds >= 3600;
                }
            }
        ];

        for (const milestone of milestones) {
            const alreadyEarned = this.data.milestones.some(m => m.id === milestone.id);
            if (!alreadyEarned && milestone.condition()) {
                const milestoneData = {
                    id: milestone.id,
                    name: milestone.name,
                    description: milestone.description,
                    earnedAt: new Date().toISOString()
                };

                this.data.milestones.push(milestoneData);

                // Save to Supabase if authenticated
                if (this.useSupabase && this.currentUser) {
                    await this.saveMilestoneToSupabase(milestoneData);
                }
            }
        }
    }

    /**
     * Save milestone to Supabase
     */
    async saveMilestoneToSupabase(milestone) {
        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase
                .from('user_milestones')
                .insert([{
                    user_id: this.currentUser.id,
                    milestone_id: milestone.id,
                    name: milestone.name,
                    description: milestone.description,
                    earned_at: milestone.earnedAt
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving milestone to Supabase:', error);
        }
    }

    /**
     * Get current streak of consecutive days
     */
    getStreakDays() {
        if (this.data.sessions.length === 0) return 0;

        const dates = this.data.sessions
            .map(s => new Date(s.timestamp).toDateString())
            .filter((date, index, self) => self.indexOf(date) === index)
            .sort((a, b) => new Date(b) - new Date(a));

        let streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
            const current = new Date(dates[i]);
            const next = new Date(dates[i + 1]);
            const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Get overall progress statistics
     */
    getOverallStats() {
        const totalSessions = this.data.sessions.length;
        const totalDuration = this.data.sessions.reduce((sum, s) => sum + s.duration, 0);
        const uniqueGames = new Set(this.data.sessions.map(s => s.gameName)).size;
        const categoryCounts = {};

        this.data.sessions.forEach(s => {
            categoryCounts[s.gameCategory] = (categoryCounts[s.gameCategory] || 0) + 1;
        });

        const completionRate = totalSessions > 0
            ? (this.data.sessions.filter(s => s.completed).length / totalSessions) * 100
            : 0;

        const averageSessionDuration = totalSessions > 0
            ? totalDuration / totalSessions
            : 0;

        return {
            totalSessions,
            totalDuration,
            totalHours: (totalDuration / 3600).toFixed(1),
            uniqueGames,
            categoryCounts,
            completionRate: completionRate.toFixed(1),
            averageSessionDuration: averageSessionDuration.toFixed(0),
            currentStreak: this.getStreakDays(),
            milestonesEarned: this.data.milestones.length,
            startDate: this.data.startDate,
            lastActive: this.data.lastActive
        };
    }

    /**
     * Get progress for a specific game
     */
    getGameProgress(gameName) {
        return this.data.gameProgress[gameName] || null;
    }

    /**
     * Get all game progress sorted by various metrics
     */
    getAllGameProgress(sortBy = 'sessionsCount') {
        return Object.entries(this.data.gameProgress)
            .map(([name, progress]) => ({ name, ...progress }))
            .sort((a, b) => b[sortBy] - a[sortBy]);
    }

    /**
     * Get recent sessions
     */
    getRecentSessions(limit = 10) {
        return [...this.data.sessions]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Get sessions by date range
     */
    getSessionsByDateRange(startDate, endDate) {
        return this.data.sessions.filter(s => {
            const sessionDate = new Date(s.timestamp);
            return sessionDate >= startDate && sessionDate <= endDate;
        });
    }

    /**
     * Get progress over time (for charts)
     */
    getProgressOverTime(days = 30) {
        const today = new Date();
        const dataPoints = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const daySessions = this.data.sessions.filter(s => {
                const sessionDate = new Date(s.timestamp);
                return sessionDate >= date && sessionDate < nextDate;
            });

            dataPoints.push({
                date: date.toISOString().split('T')[0],
                sessions: daySessions.length,
                duration: daySessions.reduce((sum, s) => sum + s.duration, 0),
                avgScore: daySessions.length > 0
                    ? daySessions.reduce((sum, s) => sum + (s.score || 0), 0) / daySessions.length
                    : 0
            });
        }

        return dataPoints;
    }

    /**
     * Get category breakdown
     */
    getCategoryProgress() {
        const categories = {
            'visual': { key: 'visual', name: 'Visual Tracking & Focus', sessions: 0, duration: 0, avgScore: 0 },
            'balance': { key: 'balance', name: 'Balance & Spatial Awareness', sessions: 0, duration: 0, avgScore: 0 },
            'memory': { key: 'memory', name: 'Memory & Cognitive Function', sessions: 0, duration: 0, avgScore: 0 },
            'coordination': { key: 'coordination', name: 'Coordination & Gentle Reaction', sessions: 0, duration: 0, avgScore: 0 },
            'calming': { key: 'calming', name: 'Calming & Therapeutic', sessions: 0, duration: 0, avgScore: 0 },
            // Add 'cognitive' as separate category (alias for 'memory') for backward compatibility
            'cognitive': { key: 'cognitive', name: 'Memory & Cognitive Function', sessions: 0, duration: 0, avgScore: 0 }
        };

        if (this.data && this.data.sessions) {
            this.data.sessions.forEach(session => {
                const category = session.gameCategory;
                if (categories[category]) {
                    categories[category].sessions++;
                    categories[category].duration += session.duration;
                    categories[category].avgScore += (session.score || 0);
                }
            });
        }

        // Merge cognitive into memory for display
        if (categories['cognitive'].sessions > 0) {
            categories['memory'].sessions += categories['cognitive'].sessions;
            categories['memory'].duration += categories['cognitive'].duration;
            categories['memory'].avgScore += categories['cognitive'].avgScore;
        }

        // Calculate averages
        Object.keys(categories).forEach(key => {
            const cat = categories[key];
            if (cat.sessions > 0) {
                cat.avgScore = (cat.avgScore / cat.sessions).toFixed(1);
            }
            cat.duration = (cat.duration / 60).toFixed(1); // Convert to minutes
        });

        return categories;
    }

    /**
     * Get personalized recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const stats = this.getOverallStats();
        const categoryProgress = this.getCategoryProgress();

        // Find least played category
        const categoriesArray = Object.entries(categoryProgress)
            .sort((a, b) => a[1].sessions - b[1].sessions);

        if (categoriesArray.length > 0 && categoriesArray[0][1].sessions < 3) {
            recommendations.push({
                type: 'balance_training',
                priority: 'high',
                message: `Try more ${categoriesArray[0][1].name} exercises`,
                category: categoriesArray[0][0]
            });
        }

        // Check daily goal
        const todaySessions = this.getSessionsByDateRange(
            new Date(new Date().setHours(0, 0, 0, 0)),
            new Date()
        );

        if (todaySessions.length < this.goals.daily.target) {
            recommendations.push({
                type: 'daily_goal',
                priority: 'medium',
                message: `You've played ${todaySessions.length}/${this.goals.daily.target} games today. Keep going!`,
                progress: (todaySessions.length / this.goals.daily.target) * 100
            });
        }

        // Suggest difficulty increase for mastered games
        const masteredGames = this.getAllGameProgress('completionRate')
            .filter(game => game.completionRate > 80 && game.sessionsCount >= 3 && game.currentDifficulty === 'easy');

        if (masteredGames.length > 0) {
            recommendations.push({
                type: 'difficulty_increase',
                priority: 'medium',
                message: `Consider increasing difficulty for ${masteredGames[0].name}`,
                game: masteredGames[0].name
            });
        }

        // Encourage streak maintenance
        if (stats.currentStreak >= 3) {
            recommendations.push({
                type: 'streak',
                priority: 'low',
                message: `Great job! You're on a ${stats.currentStreak}-day streak!`,
                streak: stats.currentStreak
            });
        }

        // Suggest assessment if enough time has passed
        const lastAssessment = this.getLastAssessmentDate();
        if (lastAssessment) {
            const daysSinceAssessment = Math.floor((Date.now() - new Date(lastAssessment)) / (1000 * 60 * 60 * 24));
            if (daysSinceAssessment >= 7) {
                recommendations.push({
                    type: 'assessment',
                    priority: 'high',
                    message: `It's been ${daysSinceAssessment} days since your last assessment. Time for a check-up!`
                });
            }
        } else if (stats.totalSessions >= 5) {
            recommendations.push({
                type: 'assessment',
                priority: 'high',
                message: 'Consider taking an assessment to track your recovery progress'
            });
        }

        return recommendations;
    }

    /**
     * Get last assessment date from assessment results
     */
    getLastAssessmentDate() {
        const assessmentResults = localStorage.getItem('assessmentResults');
        if (!assessmentResults) return null;

        try {
            const results = JSON.parse(assessmentResults);
            if (results.length > 0) {
                return results[results.length - 1].timestamp;
            }
        } catch (e) {
            console.error('Error parsing assessment results:', e);
        }
        return null;
    }

    /**
     * Set goals
     */
    setGoals(daily, weekly, custom = []) {
        this.goals.daily = daily;
        this.goals.weekly = weekly;
        this.goals.customGoals = custom;
        this.saveGoals();
    }

    /**
     * Get goal progress
     */
    getGoalProgress() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = this.getSessionsByDateRange(today, new Date());

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekSessions = this.getSessionsByDateRange(weekStart, new Date());

        return {
            daily: {
                target: this.goals.daily.target,
                current: todaySessions.length,
                percentage: (todaySessions.length / this.goals.daily.target) * 100,
                completed: todaySessions.length >= this.goals.daily.target
            },
            weekly: {
                target: this.goals.weekly.target,
                current: weekSessions.length,
                percentage: (weekSessions.length / this.goals.weekly.target) * 100,
                completed: weekSessions.length >= this.goals.weekly.target
            }
        };
    }

    /**
     * Export all data
     */
    exportData() {
        return {
            progression: this.data,
            goals: this.goals,
            stats: this.getOverallStats(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data
     */
    importData(importedData) {
        if (importedData.progression) {
            this.data = importedData.progression;
            this.saveData();
        }
        if (importedData.goals) {
            this.goals = importedData.goals;
            this.saveGoals();
        }
    }

    /**
     * Reset all progression data
     */
    resetData() {
        if (confirm('Are you sure you want to reset all progression data? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.goalsKey);
            this.data = {
                sessions: [],
                gameProgress: {},
                startDate: new Date().toISOString(),
                lastActive: null,
                milestones: []
            };
            this.goals = {
                daily: { target: 3, unit: 'games' },
                weekly: { target: 15, unit: 'games' },
                customGoals: []
            };
            return true;
        }
        return false;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressionTracker;
}
