# Recovery Path Campaign System - Setup Guide

## Overview

The Recovery Path is a campaign-like progression system that guides users through their concussion recovery journey from initial injury to full recovery. It features:

- **5 Progressive Phases** aligned with clinical recovery stages
- **Game Unlocking System** - games unlock as users advance through phases
- **Progress Tracking** - detailed requirements and milestones for each phase
- **Visual Roadmap** - interactive timeline showing recovery journey
- **Clinical Markers** - evidence-based indicators for phase advancement

## Database Setup

### Step 1: Run the Migration

To enable the recovery path system, you need to create the `recovery_paths` table in your Supabase database.

1. Go to your Supabase project dashboard: https://app.supabase.com/project/zaomjxiyzeimtdullgvn
2. Click on the **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `/database/recovery_paths_migration.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

The migration will:
- Create the `recovery_paths` table
- Set up Row-Level Security (RLS) policies
- Create indexes for performance
- Add triggers for automatic timestamp updates

### Step 2: Verify the Setup

After running the migration, verify it was successful:

```sql
-- Check if the table exists
SELECT * FROM recovery_paths LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'recovery_paths';
```

You should see the table created with appropriate policies.

## Recovery Path Structure

### Phase 1: Acute Phase (Days 0-7)
- **Focus**: Rest and initial assessment
- **Unlocked Games**: All calming games (4 games)
- **Requirements**:
  - 5 sessions
  - Complete initial assessment
  - Daily limit: 2 sessions
  - Max difficulty: Easy

### Phase 2: Early Recovery (Days 8-14)
- **Focus**: Light cognitive and visual exercises
- **Unlocked Games**: Calming + basic visual tracking (8 games total)
- **Requirements**:
  - 12 sessions
  - 5-day streak
  - Daily limit: 3 sessions
  - Max difficulty: Easy

### Phase 3: Progressive Recovery (Days 15-30)
- **Focus**: Increased difficulty and variety
- **Unlocked Games**: +Balance, Memory games (15 games total)
- **Requirements**:
  - 25 sessions
  - 7-day streak
  - 120 total minutes
  - Reassessment required
  - Max difficulty: Medium

### Phase 4: Advanced Recovery (Days 30-60)
- **Focus**: Complex tasks and coordination
- **Unlocked Games**: +Coordination games (19 games total)
- **Requirements**:
  - 35 sessions
  - 10-day streak
  - 300 total minutes
  - Reassessment required
  - All categories must be played
  - Max difficulty: Hard

### Phase 5: Return to Play (Days 60+)
- **Focus**: Full activity resumption
- **Unlocked Games**: All 20 games
- **Requirements**:
  - 50 sessions
  - 14-day streak
  - 600 total minutes
  - Final reassessment required
  - All categories required

## Features

### 1. Automatic Phase Progression
- Users advance through phases by completing requirements
- Progress is tracked automatically through gameplay
- Clear visual feedback on completion status

### 2. Game Locking/Unlocking
- Games are locked based on current phase
- Locked games show a lock icon and redirect to recovery path page
- Unlocked games display a checkmark badge

### 3. Progress Tracking
- Real-time progress bars for each requirement
- Session counts, streaks, and total time tracked
- Integration with existing progression tracker

### 4. Clinical Guidance
- Each phase includes clinical markers to watch for
- Tips and recommendations for safe progression
- Daily session limits to prevent overexertion

### 5. Injury Date Tracking
- Users set their concussion injury date
- Days since injury displayed prominently
- Recommended phase based on time elapsed

## User Experience Flow

1. **First Time**: User is placed in Acute Phase
2. **Set Injury Date**: User enters their concussion date
3. **View Current Phase**: See requirements and unlocked games
4. **Play Games**: Complete sessions with unlocked games
5. **Track Progress**: Monitor requirements completion
6. **Take Assessments**: Complete required assessments
7. **Advance Phase**: When ready, progress to next phase
8. **Continue Journey**: Repeat until full recovery

## Files Added

### Core Files
- `/recovery-path.js` - RecoveryPathManager class (main logic)
- `/recovery-path.html` - Visual roadmap UI page
- `/game-unlock-checker.js` - Game locking utility (optional)
- `/database/recovery_paths_migration.sql` - Database schema

### Modified Files
- `/index.html` - Added Recovery Path card and unlock badges
- All game pages can optionally include unlock checking

## Integration with Existing Systems

### Progression Tracker
- Uses existing `ProgressionTracker` class for session data
- Shares milestone and goal tracking
- Compatible with both authenticated and guest users

### Assessment Suite
- Phase requirements check for recent assessments
- Seamlessly integrates with existing assessment system

### Authentication
- Authenticated users: Data synced to Supabase
- Guest users: Data stored in localStorage
- Automatic migration when user logs in

## Customization Options

### Disable Phase Requirements
Users can skip phase requirements by setting:
```javascript
pathManager.pathData.custom_settings.skipPhaseRequirements = true;
await pathManager.savePathData();
```

### Custom Injury Date
Users can set a custom injury date:
```javascript
await pathManager.setInjuryDate(new Date('2024-01-01'));
```

### Disable Recovery Path System
To disable the recovery path system entirely:
```javascript
localStorage.setItem('recovery_path_enabled', 'false');
```

## Testing the System

### Test Scenarios

1. **New User Journey**
   - Visit index.html
   - Should see "Acute Phase" indicator
   - Only calming games should be unlocked
   - Other games show lock icons

2. **Phase Progression**
   - Complete 5 game sessions
   - Take an assessment
   - Visit recovery-path.html
   - Click "Advance to Next Phase"
   - Verify new games unlock

3. **Progress Tracking**
   - Play various games
   - Check progress bars update
   - Verify streak tracking
   - Check total time accumulation

4. **Guest vs. Authenticated**
   - Test as guest (localStorage)
   - Create account and log in
   - Verify data persists (Supabase)

## Troubleshooting

### Games Not Showing Lock Status
- Check browser console for errors
- Verify recovery-path.js is loaded
- Check that progression-tracker.js is loaded first

### Database Errors
- Verify migration ran successfully
- Check RLS policies are enabled
- Ensure user is authenticated (for Supabase storage)

### Phase Not Advancing
- Check all requirements are met
- Verify assessment is recent (within 7 days)
- Check browser console for errors

## Future Enhancements

Potential additions to the recovery path system:

1. **Custom Phase Creation** - Allow healthcare providers to create custom phases
2. **Team/Coach Dashboard** - Let providers monitor patient progress
3. **Reminders & Notifications** - Daily reminders to maintain streaks
4. **Social Features** - Share progress with family/support network
5. **Advanced Analytics** - Machine learning for personalized recommendations
6. **Export Reports** - Generate PDF reports for healthcare providers

## Clinical Disclaimer

This recovery path is based on general concussion recovery guidelines. Individual recovery varies significantly. Users should:
- Consult with healthcare providers
- Follow medical advice over app recommendations
- Stop if symptoms worsen
- Obtain medical clearance before full return to activities

## Support

For issues or questions:
- Check browser console for error messages
- Verify all files are properly uploaded
- Ensure Supabase database migration completed
- Test in a modern browser with WebXR support
