-- Enhanced Database Schema for Real-Time Performance Metrics
-- Add to existing Supabase database

-- Table for detailed real-time metrics during exercises
CREATE TABLE IF NOT EXISTS exercise_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Real-time tracking data
    head_tilt DECIMAL(5,2), -- degrees
    movement_speed DECIMAL(5,2), -- degrees per second
    stability_score DECIMAL(5,2), -- 0-100

    -- Performance metrics
    accuracy DECIMAL(5,2), -- 0-100
    consistency DECIMAL(5,2), -- 0-100
    corrections_count INTEGER DEFAULT 0,

    -- Exercise-specific metrics
    target_hit_rate DECIMAL(5,2),
    reaction_time INTEGER, -- milliseconds
    completion_percentage DECIMAL(5,2),

    -- Additional data
    exercise_phase VARCHAR(50), -- 'warmup', 'active', 'cooldown'
    difficulty_level INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_exercise_metrics_user_id ON exercise_metrics(user_id);
CREATE INDEX idx_exercise_metrics_session_id ON exercise_metrics(session_id);
CREATE INDEX idx_exercise_metrics_timestamp ON exercise_metrics(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE exercise_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own metrics"
    ON exercise_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
    ON exercise_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Table for exercise difficulty progression
CREATE TABLE IF NOT EXISTS exercise_difficulty_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    exercise_id VARCHAR(100) NOT NULL,
    exercise_name VARCHAR(200) NOT NULL,

    previous_difficulty INTEGER,
    new_difficulty INTEGER,

    -- Reasons for change
    performance_score DECIMAL(5,2),
    reason VARCHAR(500),

    -- Adaptive parameters
    parameters JSONB,

    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_difficulty_history_user_id ON exercise_difficulty_history(user_id);
CREATE INDEX idx_difficulty_history_exercise_id ON exercise_difficulty_history(exercise_id);

-- Enable Row Level Security
ALTER TABLE exercise_difficulty_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own difficulty history"
    ON exercise_difficulty_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own difficulty history"
    ON exercise_difficulty_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Table for AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    recommendation_type VARCHAR(50), -- 'exercise', 'difficulty', 'focus_area', 'rest'
    priority VARCHAR(20), -- 'high', 'medium', 'low'

    title VARCHAR(200),
    description TEXT,

    -- Reasoning
    based_on JSONB, -- What data was used for this recommendation
    confidence DECIMAL(5,2), -- 0-100

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'dismissed'
    viewed BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_recommendations_created ON ai_recommendations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recommendations"
    ON ai_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
    ON ai_recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
    ON ai_recommendations FOR UPDATE
    USING (auth.uid() = user_id);

-- Table for session analytics summary
CREATE TABLE IF NOT EXISTS session_analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,

    -- Aggregate metrics
    avg_head_tilt DECIMAL(5,2),
    avg_movement_speed DECIMAL(5,2),
    avg_stability DECIMAL(5,2),

    max_head_tilt DECIMAL(5,2),
    max_movement_speed DECIMAL(5,2),

    -- Performance summary
    overall_performance DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    total_corrections INTEGER,

    -- Improvement indicators
    improvement_vs_previous DECIMAL(5,2), -- percentage
    readiness_for_difficulty_increase BOOLEAN,

    -- AI insights
    strengths TEXT[],
    areas_for_improvement TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_session_analytics_user_id ON session_analytics(user_id);
CREATE INDEX idx_session_analytics_session_id ON session_analytics(session_id);

-- Enable Row Level Security
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analytics"
    ON session_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
    ON session_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- View for user progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
    gs.user_id,
    COUNT(DISTINCT gs.id) as total_sessions,
    COUNT(DISTINCT DATE(gs.timestamp)) as days_active,
    AVG(gs.score) as avg_score,
    AVG(sa.overall_performance) as avg_performance,
    AVG(sa.consistency_score) as avg_consistency,
    SUM(gs.duration) as total_duration_seconds,

    -- Recent performance (last 7 days)
    AVG(CASE WHEN gs.timestamp > NOW() - INTERVAL '7 days' THEN gs.score END) as recent_avg_score,
    COUNT(CASE WHEN gs.timestamp > NOW() - INTERVAL '7 days' THEN 1 END) as recent_session_count,

    -- Improvement trend
    (AVG(CASE WHEN gs.timestamp > NOW() - INTERVAL '7 days' THEN gs.score END) -
     AVG(CASE WHEN gs.timestamp BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days' THEN gs.score END))
     as score_improvement,

    MAX(gs.timestamp) as last_session_date
FROM game_sessions gs
LEFT JOIN session_analytics sa ON gs.id = sa.session_id
GROUP BY gs.user_id;

-- Function to calculate recovery score
CREATE OR REPLACE FUNCTION calculate_recovery_score(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_score DECIMAL(5,2);
    v_session_count INTEGER;
    v_avg_performance DECIMAL(5,2);
    v_consistency DECIMAL(5,2);
    v_streak INTEGER;
BEGIN
    -- Get user stats
    SELECT
        COUNT(*),
        AVG(score),
        AVG(sa.consistency_score)
    INTO v_session_count, v_avg_performance, v_consistency
    FROM game_sessions gs
    LEFT JOIN session_analytics sa ON gs.id = sa.session_id
    WHERE gs.user_id = p_user_id;

    -- Calculate streak
    SELECT COUNT(DISTINCT DATE(timestamp))
    INTO v_streak
    FROM game_sessions
    WHERE user_id = p_user_id
    AND timestamp > NOW() - INTERVAL '30 days';

    -- Calculate recovery score (0-100)
    v_score := LEAST(100,
        (v_session_count * 0.5) + -- Session count contribution
        (COALESCE(v_avg_performance, 0) * 0.3) + -- Performance contribution
        (COALESCE(v_consistency, 0) * 0.2) + -- Consistency contribution
        (v_streak * 2) -- Streak contribution
    );

    RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get skill levels
CREATE OR REPLACE FUNCTION get_skill_levels(p_user_id UUID)
RETURNS TABLE(
    skill_name VARCHAR(50),
    skill_level DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gs.game_category::VARCHAR(50),
        LEAST(100, (COUNT(*) * 5 + AVG(gs.score) * 0.5))::DECIMAL(5,2) as level
    FROM game_sessions gs
    WHERE gs.user_id = p_user_id
    GROUP BY gs.game_category;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain analytics

-- Update session analytics after session insert
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and insert session analytics
    INSERT INTO session_analytics (
        user_id,
        session_id,
        avg_head_tilt,
        avg_stability,
        overall_performance,
        total_corrections,
        created_at
    )
    SELECT
        NEW.user_id,
        NEW.id,
        (NEW.metrics->>'avgHeadTilt')::DECIMAL,
        (NEW.metrics->>'avgStability')::DECIMAL,
        NEW.score,
        (NEW.metrics->>'corrections')::INTEGER,
        NOW()
    WHERE NEW.metrics IS NOT NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_analytics
    AFTER INSERT ON game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_analytics();

-- Comments for documentation
COMMENT ON TABLE exercise_metrics IS 'Real-time performance metrics captured during VR exercises';
COMMENT ON TABLE exercise_difficulty_history IS 'History of difficulty adjustments made by the AI system';
COMMENT ON TABLE ai_recommendations IS 'AI-generated recommendations for users based on their performance';
COMMENT ON TABLE session_analytics IS 'Aggregated analytics for each session';
COMMENT ON VIEW user_progress_summary IS 'Summary view of user progress and trends';
COMMENT ON FUNCTION calculate_recovery_score IS 'Calculates overall recovery score (0-100) based on multiple factors';
COMMENT ON FUNCTION get_skill_levels IS 'Returns skill levels for different exercise categories';
