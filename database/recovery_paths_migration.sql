-- Recovery Paths Migration
-- This creates the necessary table and policies for the recovery path campaign system

-- Create recovery_paths table
CREATE TABLE IF NOT EXISTS recovery_paths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    current_phase TEXT NOT NULL DEFAULT 'acute',
    phase_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    injury_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_phases TEXT[] DEFAULT ARRAY[]::TEXT[],
    phase_progress JSONB DEFAULT '{}'::JSONB,
    custom_settings JSONB DEFAULT '{
        "skipPhaseRequirements": false,
        "customInjuryDate": null
    }'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_recovery_paths_user_id ON recovery_paths(user_id);

-- Enable Row Level Security
ALTER TABLE recovery_paths ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own recovery path" ON recovery_paths;
DROP POLICY IF EXISTS "Users can insert their own recovery path" ON recovery_paths;
DROP POLICY IF EXISTS "Users can update their own recovery path" ON recovery_paths;
DROP POLICY IF EXISTS "Users can delete their own recovery path" ON recovery_paths;

-- Create RLS policies
CREATE POLICY "Users can view their own recovery path"
    ON recovery_paths FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery path"
    ON recovery_paths FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery path"
    ON recovery_paths FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery path"
    ON recovery_paths FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recovery_paths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS recovery_paths_updated_at ON recovery_paths;
CREATE TRIGGER recovery_paths_updated_at
    BEFORE UPDATE ON recovery_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_paths_updated_at();

-- Add helpful comments
COMMENT ON TABLE recovery_paths IS 'Stores user recovery path progression data for the campaign-style recovery system';
COMMENT ON COLUMN recovery_paths.current_phase IS 'The current phase the user is in (acute, early_recovery, progressive_recovery, advanced_recovery, return_to_play)';
COMMENT ON COLUMN recovery_paths.phase_start_date IS 'When the user started their current phase';
COMMENT ON COLUMN recovery_paths.injury_date IS 'The date of the concussion injury';
COMMENT ON COLUMN recovery_paths.completed_phases IS 'Array of phase IDs that have been completed';
COMMENT ON COLUMN recovery_paths.phase_progress IS 'JSON object storing detailed progress data for each phase';
COMMENT ON COLUMN recovery_paths.custom_settings IS 'User preferences and custom settings for the recovery path';
