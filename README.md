# 🧠 Concussion Recovery VR Games

A collection of 20 WebXR VR games specifically designed for concussion recovery and cognitive rehabilitation. These therapeutic games focus on gentle exercises that help rebuild various cognitive and physical functions affected by concussion.

## 🎯 Purpose

These games are designed to assist in concussion recovery by providing:
- **Safe, controlled environments** for rehabilitation exercises
- **Gradual difficulty progression** to avoid overstimulation
- **Therapeutic activities** targeting specific recovery needs
- **Calming experiences** to support healing

## ⚠️ Important Medical Disclaimer

**These games are complementary tools and should NOT replace professional medical advice.** Always consult with your healthcare provider about your recovery plan. If you experience increased symptoms, dizziness, or discomfort while using these games, stop immediately and consult your doctor.

## 🎮 Game Categories

### 👁️ Visual Tracking & Focus (4 games)
1. **Smooth Pursuit** - Follow slowly moving objects to rebuild smooth eye tracking
2. **Saccade Training** - Practice quick eye movements between targets
3. **Focus Point** - Maintain central focus while tracking peripheral objects
4. **Peripheral Vision** - Detect objects at the edge of vision

### ⚖️ Balance & Spatial Awareness (4 games)
5. **Balance Beam** - Virtual balance training in a safe environment
6. **Spatial Memory** - Remember and recreate 3D spatial arrangements
7. **Room Navigation** - Navigate through virtual spaces with gentle obstacles
8. **Depth Perception** - Judge distances and depths in 3D space

### 🧩 Memory & Cognitive Function (4 games)
9. **Color Memory** - Match colors in sequence to strengthen short-term memory
10. **Pattern Match** - Identify and match visual patterns
11. **Sequence Recall** - Remember and repeat sequences
12. **Puzzle Assembly** - Assemble 3D puzzles to improve problem-solving

### 🎯 Coordination & Gentle Reaction (4 games)
13. **Bubble Pop** - Pop floating bubbles at your own pace
14. **Gentle Catch** - Catch slowly falling objects
15. **Target Touch** - Touch targets that appear in sequence
16. **Sound Localization** - Locate the source of sounds in 3D space

### 🌸 Calming & Therapeutic (4 games)
17. **Breathing Garden** - Practice breathing exercises in a peaceful garden
18. **Color Therapy** - Immerse in calming color environments
19. **Meditation Space** - Quiet virtual space for relaxation
20. **Nature Walk** - Gentle walk through calming natural scenery

## 📊 Progression Tracking System

The VR Concussion Recovery platform now includes a comprehensive **Progression Tracker** that helps you monitor your recovery journey:

### Key Features

- **Session Tracking**: Automatically records every game session with duration, score, and completion status
- **Progress Dashboard**: Visual charts and statistics showing your recovery progress over time
- **Milestones & Achievements**: Earn badges as you reach recovery milestones
- **Personalized Recommendations**: Get AI-driven suggestions for which games to play next
- **Goal Setting**: Set daily and weekly therapy goals and track your progress
- **Category Analytics**: See which therapy areas you're focusing on most
- **Integration with Assessments**: Connect game progress with clinical assessment results

### How It Works

1. **Automatic Tracking**: Games automatically record your sessions when you play
2. **View Progress**: Click "View Progress" from the main menu to see your dashboard
3. **Set Goals**: Customize your daily and weekly therapy targets
4. **Track Milestones**: Earn achievements as you progress through recovery
5. **Get Recommendations**: Receive personalized suggestions based on your activity

### Progression Dashboard Includes

- 📈 **Progress Charts**: Visual graphs showing sessions over time
- 🎯 **Category Breakdown**: See which therapy areas you've practiced
- 🏆 **Milestones**: Track achievements like "First Session", "Week Streak", etc.
- 💡 **Smart Recommendations**: Suggestions for balanced training
- ⏱️ **Session History**: Review all your past therapy sessions
- 📊 **Goal Progress**: Daily and weekly goal completion tracking

### For Game Developers

To integrate progression tracking in custom games, use the `GameSessionTracker` class:

```javascript
// Include the progression tracker and webxr-utils
<script src="../progression-tracker.js"></script>
<script src="webxr-utils.js"></script>

// Initialize tracker
const tracker = new GameSessionTracker('Game Name', 'category');
tracker.startSession();

// During gameplay
tracker.updateScore(currentScore);
tracker.addMetric('customMetric', value);

// When complete
tracker.markCompleted();
tracker.endSession(); // Automatically saves to progression tracker
```

### Privacy & Data

- All progression data is stored **locally** in your browser
- No data is sent to external servers
- Export your data anytime as JSON
- Reset your progress at any time from the dashboard

## 🚀 Getting Started

### Requirements
- A WebXR-compatible VR headset (Meta Quest, HTC Vive, etc.)
- A modern web browser with WebXR support
- Internet connection to load Three.js library

### How to Use
1. Open `index.html` in a WebXR-compatible browser
2. Browse the game categories
3. Click on any game to start
4. Click "Enter VR" to begin the experience
5. Start with "Easy" difficulty games and progress gradually

### Local Development
Simply open the `index.html` file in your browser. No build process or dependencies to install - everything runs directly in the browser.

## 🏗️ Project Structure

```
gamecollectionconcussion/
├── index.html                 # Main game selection page
├── assessment.html            # Assessment suite hub
├── progression.html           # NEW: Progression tracking dashboard
├── progression-tracker.js     # NEW: Progression tracking module
├── styles.css                 # Styling for all pages
├── README.md                  # This file
├── games/
│   ├── webxr-utils.js        # Shared WebXR utilities (includes GameSessionTracker)
│   ├── smooth-pursuit.html
│   ├── saccade-training.html
│   ├── focus-point.html
│   ├── peripheral-vision.html
│   ├── balance-beam.html
│   ├── spatial-memory.html
│   ├── room-navigation.html
│   ├── depth-perception.html
│   ├── color-memory.html
│   ├── pattern-match.html
│   ├── sequence-recall.html
│   ├── puzzle-assembly.html
│   ├── bubble-pop.html
│   ├── gentle-catch.html
│   ├── target-touch.html
│   ├── sound-localization.html
│   ├── breathing-garden.html
│   ├── color-therapy.html
│   ├── meditation-space.html
│   └── nature-walk.html
└── assessment/
    ├── symptom-checklist.html
    ├── balance-bess.html
    ├── voms-assessment.html
    ├── reaction-time.html
    ├── cognitive-test.html
    └── results.html
```

## 💡 Usage Tips

### For Best Results:
- **Start slowly** - Begin with 5-10 minute sessions
- **Choose appropriate difficulty** - Start with "Easy" games
- **Take breaks** - Rest if you feel any discomfort
- **Be consistent** - Regular, short sessions are better than long, infrequent ones
- **Track progress** - Use the Progression Tracker to monitor which games become easier over time
- **Use headphones** - For games with spatial audio (Sound Localization)
- **Review your data** - Check your progression dashboard regularly for insights and recommendations

### Recommended Progression:
1. Week 1: Calming games (Breathing Garden, Color Therapy, Meditation Space)
2. Week 2: Add visual tracking (Smooth Pursuit, Focus Point)
3. Week 3: Add memory games (Color Memory, Spatial Memory)
4. Week 4+: Gradually introduce coordination and balance games

## 🛠️ Technology Stack

- **Three.js** - 3D graphics library
- **WebXR API** - VR functionality
- **Pure HTML/CSS/JavaScript** - No build process required
- **CDN-hosted dependencies** - No installation needed

## 🎨 Design Philosophy

Each game is designed with concussion recovery in mind:
- **Gentle visuals** - Soft colors, no harsh contrasts
- **Slow movements** - No rapid or jarring motion
- **Clear feedback** - Visual and audio cues for success
- **No time pressure** - Progress at your own pace
- **Calming aesthetics** - Therapeutic environments

## 🔧 Customization

The games can be easily customized by modifying:
- **Speed**: Adjust movement speeds in the render() functions
- **Colors**: Change color values to your preference
- **Difficulty**: Modify timing, object counts, or distances
- **Duration**: Adjust game session lengths

## 📱 Browser Compatibility

Works with:
- Meta Quest Browser
- Chrome (with WebXR Device API)
- Firefox Reality
- Edge (with WebXR support)

## 🤝 Contributing

This project is designed for therapeutic use. If you'd like to contribute:
- Ensure changes maintain the calming, therapeutic nature
- Test thoroughly on VR devices
- Follow accessibility guidelines
- Document any new features

## 📄 License

This project is open source and available for use in concussion recovery and rehabilitation.

## 🙏 Acknowledgments

Created with care for those recovering from concussion. Recovery takes time - be patient with yourself.

## 📞 Support

If you experience technical issues:
1. Ensure your browser supports WebXR
2. Check that your VR headset is properly connected
3. Try a different browser if issues persist
4. Ensure you have a stable internet connection

---

**Remember**: These games are tools to assist in recovery, not medical treatment. Always work with healthcare professionals for your recovery plan.

Stay strong, take your time, and trust the healing process. 💪❤️
