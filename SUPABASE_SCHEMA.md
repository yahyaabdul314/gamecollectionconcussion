# Supabase Database Schema

This document describes the database schema for the VR Concussion Recovery progression tracking system using Supabase.

## Database Tables

### 1. user_profiles

Stores user profile information.

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

### 2. game_sessions

Stores all game session data with detailed metrics.

```sql
CREATE TABLE game_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    game_name TEXT NOT NULL,
    game_category TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    difficulty TEXT DEFAULT 'easy',
    score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    metrics JSONB DEFAULT '{}'::jsonb,
    physics_data JSONB,
    symptoms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_timestamp ON game_sessions(timestamp DESC);
CREATE INDEX idx_game_sessions_game_name ON game_sessions(game_name);
CREATE INDEX idx_game_sessions_game_category ON game_sessions(game_category);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sessions"
    ON game_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON game_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON game_sessions FOR DELETE
    USING (auth.uid() = user_id);
```

### 3. user_goals

Stores user-defined therapy goals.

```sql
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    daily_goal JSONB DEFAULT '{"target": 3, "unit": "games"}'::jsonb,
    weekly_goal JSONB DEFAULT '{"target": 15, "unit": "games"}'::jsonb,
    custom_goals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals"
    ON user_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON user_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON user_goals FOR UPDATE
    USING (auth.uid() = user_id);
```

### 4. user_milestones

Stores earned milestones and achievements.

```sql
CREATE TABLE user_milestones (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    milestone_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

-- Create index
CREATE INDEX idx_user_milestones_user_id ON user_milestones(user_id);

-- Enable Row Level Security
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own milestones"
    ON user_milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
    ON user_milestones FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

## Setup Instructions

### Step 1: Create Tables

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each CREATE TABLE statement above
4. Execute each statement

### Step 2: Enable Row Level Security

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

### Step 3: Test the Schema

Run these test queries to verify the setup:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'game_sessions', 'user_goals', 'user_milestones');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## API Usage Examples

### JavaScript Client Examples

```javascript
// Get Supabase client
const supabase = getSupabaseClient();

// Insert a game session
const { data, error } = await supabase
    .from('game_sessions')
    .insert([{
        user_id: user.id,
        game_name: 'Smooth Pursuit',
        game_category: 'visual',
        duration: 120,
        score: 500,
        completed: true
    }]);

// Get all sessions for current user
const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*')
    .order('timestamp', { ascending: false });

// Update user goals
const { error } = await supabase
    .from('user_goals')
    .upsert({
        user_id: user.id,
        daily_goal: { target: 5, unit: 'games' },
        weekly_goal: { target: 25, unit: 'games' }
    });

// Get user milestones
const { data: milestones } = await supabase
    .from('user_milestones')
    .select('*')
    .order('earned_at', { ascending: false });
```

## Data Migration

### Migrate from localStorage to Supabase

If users have existing data in localStorage, it can be migrated:

```javascript
async function migrateLocalDataToSupabase() {
    const supabase = getSupabaseClient();
    const authManager = getAuthManager();
    const user = await authManager.getCurrentUser();

    if (!user) {
        console.error('User not authenticated');
        return;
    }

    // Get local data
    const localData = JSON.parse(localStorage.getItem('concussion_progression') || '{}');
    const localGoals = JSON.parse(localStorage.getItem('concussion_goals') || '{}');

    // Migrate sessions
    if (localData.sessions && localData.sessions.length > 0) {
        const sessionsToInsert = localData.sessions.map(session => ({
            user_id: user.id,
            timestamp: session.timestamp,
            game_name: session.gameName,
            game_category: session.gameCategory,
            duration: session.duration,
            difficulty: session.difficulty,
            score: session.score,
            completed: session.completed,
            metrics: session.metrics,
            physics_data: session.physicsData,
            symptoms: session.symptoms
        }));

        const { error } = await supabase
            .from('game_sessions')
            .insert(sessionsToInsert);

        if (error) {
            console.error('Error migrating sessions:', error);
        } else {
            console.log(`Migrated ${sessionsToInsert.length} sessions`);
        }
    }

    // Migrate goals
    if (localGoals.daily || localGoals.weekly) {
        const { error } = await supabase
            .from('user_goals')
            .upsert({
                user_id: user.id,
                daily_goal: localGoals.daily,
                weekly_goal: localGoals.weekly,
                custom_goals: localGoals.customGoals || []
            });

        if (error) {
            console.error('Error migrating goals:', error);
        } else {
            console.log('Goals migrated successfully');
        }
    }

    // Migrate milestones
    if (localData.milestones && localData.milestones.length > 0) {
        const milestonesToInsert = localData.milestones.map(m => ({
            user_id: user.id,
            milestone_id: m.id,
            name: m.name,
            description: m.description,
            earned_at: m.earnedAt
        }));

        const { error } = await supabase
            .from('user_milestones')
            .insert(milestonesToInsert);

        if (error) {
            console.error('Error migrating milestones:', error);
        } else {
            console.log(`Migrated ${milestonesToInsert.length} milestones`);
        }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('concussion_progression');
    localStorage.removeItem('concussion_goals');
    console.log('Migration complete! Local data cleared.');
}
```

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled to prevent unauthorized access
2. **User Isolation**: Policies ensure users can only access their own data
3. **API Keys**: Never expose your service role key in client-side code
4. **Authentication**: All operations require authenticated users via Supabase Auth

## Performance Optimization

1. **Indexes**: Created on frequently queried columns (user_id, timestamp, game_name)
2. **JSONB**: Used for flexible data storage (metrics, physics_data)
3. **Cascading Deletes**: User deletion automatically removes all related data

## Backup and Export

Users can export their data at any time:

```javascript
async function exportAllUserData() {
    const supabase = getSupabaseClient();
    const authManager = getAuthManager();
    const user = await authManager.getCurrentUser();

    if (!user) return null;

    const { data: sessions } = await supabase
        .from('game_sessions')
        .select('*');

    const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .single();

    const { data: milestones } = await supabase
        .from('user_milestones')
        .select('*');

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .single();

    return {
        profile,
        sessions,
        goals,
        milestones,
        exportDate: new Date().toISOString()
    };
}
```

## Support

For Supabase-related issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
