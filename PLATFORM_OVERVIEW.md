# NeuroRecover - AI-Powered VR Concussion Rehabilitation Platform

## 🎯 Overview

NeuroRecover is a comprehensive, intelligent VR rehabilitation platform designed for concussion recovery. The system uses AI to automatically select exercises, track real-time performance metrics, provide live feedback, and adapt difficulty levels based on individual progress.

## ✨ Key Features

### 1. **AI-Driven Exercise Selection**
- Analyzes user performance history
- Identifies skill gaps and weak areas
- Automatically selects optimal exercises for each session
- Provides detailed rationale for exercise selection

### 2. **Real-Time Performance Tracking**
- **Head Tilt Monitoring**: Tracks neck angle and posture
- **Movement Speed**: Measures head rotation velocity
- **Stability Score**: Calculates overall balance and steadiness
- **Performance Metrics**: Real-time accuracy and consistency tracking

### 3. **Live Feedback System**
- Instant corrections for improper form (e.g., "Your neck is too tilted")
- Speed guidance (e.g., "You're moving too fast, slow down")
- Positive reinforcement for excellent performance
- Visual metrics display during exercises

### 4. **Adaptive Difficulty**
- Automatically increases difficulty when user performs well (>85% score)
- Decreases difficulty if struggling (<50% score)
- Tracks difficulty history and progression
- Personalized parameter adjustment per exercise

### 5. **Immersive 360° Environments**
- Beautiful real-world environments (beaches, forests, mountains)
- Calming, therapeutic settings
- Random environment selection for variety

### 6. **Comprehensive Dashboard**
- Recovery score calculation
- Progressive charts (30-day trends)
- Skills assessment radar chart
- Training distribution visualization
- Recent activity tracking
- AI-generated recommendations

## 🏗️ Architecture

### File Structure

```
├── landing.html              # Professional landing page
├── auth.html                  # Authentication (login/signup)
├── dashboard.html             # Main dashboard with charts
├── vr-session.html            # VR exercise interface
├── vr-controller.js           # VR session controller
├── exercise-ai.js             # AI exercise selection algorithm
├── progression-tracker.js     # Progress tracking system
├── supabase-config.js         # Supabase authentication
├── METRICS_SCHEMA.sql         # Database schema for metrics
└── SUPABASE_SCHEMA.md         # Original database documentation
```

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **VR Framework**: A-Frame 1.4.0
- **Charts**: Chart.js 4.4.0
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Real-time Tracking**: WebXR API, Device Orientation API

## 🎮 User Flow

### 1. Landing Page → Login
- User visits site, sees professional landing page
- Creates account or logs in
- Redirects to dashboard

### 2. Dashboard
- View recovery progress and stats
- See AI recommendations
- View progression charts
- Click "Enter VR Session" to start exercises

### 3. Exercise Selection
- System analyzes user performance
- AI selects 3 optimal exercises
- Shows rationale and exercise details
- User clicks "Enter VR Environment"

### 4. VR Session
- Immersive 360° environment loads
- Exercise starts with timer and progress bar
- Real-time metrics displayed (HUD overlay):
  - Head tilt
  - Movement speed
  - Stability
  - Performance score
- Live feedback messages appear as needed
- Progress through 3 exercises

### 5. Completion
- Session summary with stats
- Performance feedback
- Option to view dashboard or start new session
- All data automatically saved to cloud

## 🤖 AI Exercise Selection Algorithm

### Analysis Factors
1. **Total Sessions**: How many exercises completed
2. **Performance History**: Average scores and completion rates
3. **Skill Levels**: Individual assessment per category:
   - Visual Tracking
   - Balance
   - Cognitive
   - Coordination
   - Vestibular

### Selection Process
1. **Identify Weak Areas**: Find skills with lowest scores
2. **Select Primary Exercise**: Target weakest skill
3. **Balance Selection**: Choose complementary exercises
4. **Configure Difficulty**: Set parameters based on skill level
5. **Generate Rationale**: Explain selections to user

### Adaptive Difficulty Algorithm

```javascript
Performance Score >= 85% → Increase difficulty (+1 level)
Performance Score 70-84% → Maintain difficulty
Performance Score < 50% → Decrease difficulty (-1 level)
```

Each exercise has 10 difficulty levels with configurable parameters:
- Speed (deg/s)
- Size/Distance
- Complexity
- Distractors
- Duration

## 📊 Real-Time Tracking System

### Tracked Metrics

#### Head Tracking
- **Head Tilt** (X, Y, Z rotation in degrees)
- **Movement Speed** (degrees per second)
- **Stability Score** (0-100)

#### Performance Metrics
- **Accuracy** (0-100)
- **Consistency** (0-100)
- **Corrections Count**

### Feedback Thresholds

| Metric | Good | Warning | Correction |
|--------|------|---------|-----------|
| Head Tilt | <15° | 15-25° | >25° |
| Movement Speed | <50°/s | 50-100°/s | >100°/s |
| Stability | >80% | 60-80% | <60% |

### Live Feedback Examples
- ⚠️ "Your head is tilted. Please straighten your neck."
- ⚠️ "You're moving too fast. Slow down your movements."
- 💡 "Try to keep your head more stable."
- ✅ "Excellent form! Keep it up!"

## 📈 Progress Tracking

### Metrics Stored
1. **Session Data**:
   - Game name, category, duration
   - Score, completion status
   - Difficulty level

2. **Real-Time Metrics**:
   - Average head tilt, speed, stability
   - Corrections count
   - Performance scores

3. **Analytics**:
   - Improvement vs. previous sessions
   - Readiness for difficulty increase
   - Strengths and areas for improvement

### Recovery Score Calculation

```javascript
Recovery Score =
  (Sessions * 0.5) +                    // Volume
  (Average Performance * 0.3) +         // Quality
  (Consistency Score * 0.2) +           // Reliability
  (Streak Days * 2)                     // Commitment
```

Max Score: 100

## 🗄️ Database Schema

### Core Tables
- `user_profiles`: User information
- `game_sessions`: Exercise session records
- `exercise_metrics`: Real-time tracking data
- `session_analytics`: Aggregated performance data
- `exercise_difficulty_history`: Difficulty adjustments
- `ai_recommendations`: AI-generated suggestions
- `user_goals`: Personal goals
- `user_milestones`: Achievements

### Advanced Features
- **Row-Level Security**: Users can only access their own data
- **Automatic Analytics**: Triggers update analytics after each session
- **Views**: Pre-computed progress summaries
- **Functions**: Calculate recovery score and skill levels

## 🎯 Exercise Library

### Visual Tracking
- **Smooth Pursuit**: Follow moving objects
- **Saccade Training**: Quick eye movements
- **Peripheral Vision**: Detect objects at edges

### Balance & Vestibular
- **Balance Beam**: Walk virtual beam
- **Head Stabilization**: Maintain head position
- **Gaze Stabilization**: Focus during movement

### Cognitive
- **Working Memory**: Remember sequences
- **Dual Task**: Perform multiple tasks simultaneously

### Coordination
- **Hand-Eye Coordination**: Track and interact with targets

## 🚀 Deployment Instructions

### Prerequisites
1. Supabase account
2. Web server or hosting platform
3. Modern web browser with WebXR support

### Setup Steps

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com and create new project
   ```

2. **Run Database Migrations**
   ```sql
   # Execute SUPABASE_SCHEMA.md scripts
   # Execute METRICS_SCHEMA.sql scripts
   ```

3. **Update Configuration**
   ```javascript
   // In supabase-config.js, update:
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

4. **Deploy Files**
   ```bash
   # Upload all files to web server
   # Ensure index.html is the entry point
   ```

5. **Test**
   - Visit landing page
   - Create account
   - Start VR session
   - Verify data saves to Supabase

## 🔒 Security

- **Authentication**: Supabase Auth with email/password
- **Row-Level Security**: All tables protected
- **Data Isolation**: Users can only access their own data
- **HTTPS**: All connections encrypted
- **API Keys**: Anon key safe for client-side use

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (iOS 15+)

### VR Headset Support
- ✅ Meta Quest 2/3
- ✅ Meta Quest Pro
- ✅ Pico VR
- ✅ Any WebXR-compatible headset

### Desktop Mode
- ✅ Mouse + keyboard controls
- ✅ Full functionality without VR headset

## 🎨 Customization

### Adding New Exercises

```javascript
// In exercise-ai.js, add to exerciseLibrary:
{
    id: 'new-exercise',
    name: 'New Exercise',
    category: 'visual',
    skillTargets: ['visual', 'coordination'],
    baselineDifficulty: 2,
    maxDifficulty: 10,
    duration: 180,
    description: 'Exercise description',
    metrics: ['accuracy', 'speed'],
    adaptiveParams: {
        speed: { min: 10, max: 60, unit: 'deg/s' },
        size: { min: 5, max: 20, unit: 'cm' }
    }
}
```

### Adding New Environments

```javascript
// In vr-controller.js, add to environments:
{
    id: 'custom',
    name: 'Custom Environment',
    url: 'https://your-360-image-url.jpg'
}
```

## 📊 Performance Optimization

### Database Indexes
- All user_id columns indexed
- Timestamp columns indexed
- Session lookups optimized

### Client-Side
- Real-time tracking throttled to 100ms
- Charts lazy-loaded
- Metrics batched for upload

### VR Rendering
- Low-poly 3D models
- Efficient A-Frame components
- 60fps target maintained

## 🐛 Troubleshooting

### VR Not Loading
- Check WebXR browser support
- Enable VR permissions
- Try different browser

### Data Not Saving
- Check Supabase connection
- Verify authentication
- Check browser console for errors

### Performance Issues
- Reduce graphics quality
- Close other applications
- Try different environment

## 📝 Future Enhancements

### Planned Features
- [ ] Multiplayer rehabilitation sessions
- [ ] Voice-guided exercises
- [ ] Integration with wearable devices
- [ ] Physical therapist dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced AI models (TensorFlow.js)
- [ ] Social features (friends, leaderboards)
- [ ] Custom exercise builder

## 📄 License

This project is designed for medical rehabilitation purposes. Always consult with healthcare professionals.

## 🤝 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase configuration
3. Review database permissions
4. Test with different browsers

## 📚 Documentation

- **SUPABASE_SCHEMA.md**: Database schema details
- **METRICS_SCHEMA.sql**: Advanced metrics tables
- **README.md**: Original project documentation
- **PLATFORM_OVERVIEW.md**: This file

---

**Built with ❤️ for concussion recovery and rehabilitation**
