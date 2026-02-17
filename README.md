# OJTally Multi-Profile App 🎓

A professional-grade React Native application for tracking internship progress across multiple profiles. Featuring cloud synchronization, offline resilience, and intelligent completion predictions.

## ✨ Latest Features

### 🔄 Cloud & Offline Sync
- **Supabase Integration** - Real-time cloud sync for all your profiles and logs.
- **Offline-First Resilience** - Full local SQLite persistence allows tracking without internet; syncs automatically when reconnected.
- **Cross-Device Recovery** - Restore your data easily using your profile name on any device.

### 📱 Premium Responsive Design
- **Fully Responsive** - Custom-built scaling system that adapts the UI perfectly for small phones, large phones, and tablets.
- **Universal Scrolling** - Guaranteed accessibility with `ScrollView` implementation on every page, preventing content cut-off.
- **Adaptive Grid** - Profiles selection grid dynamically changes from 2 to 4 columns based on screen width.

### 📋 Intelligent Tracking
- **Prediction Engine** - Calculates your graduation date based on your unique work schedule and daily/weekly caps.
- **Visual Progress** - Netflix-style profile picker and intuitive progress bars.
- **Custom Avatars** - Supports custom images from your gallery or a library of professional emojis.

### 🏆 Team & Social
- **Team Progress Sharing** - Toggle progress sharing to see how you rank against fellow interns.
- **Progress Broadcast** - Optional sharing of your "Road to Graduation" status.

## 🛠️ Tech Stack
- **Framework**: React Native (Expo)
- **State Management**: React Context API
- **Local Storage**: SQLite (via Expo SQLite)
- **Cloud Provider**: Supabase (Database & Storage)
- **Styling**: Theme-based Design Tokens with Responsive Scaling
- **Icons**: Lucide React Native

## 📂 Project Structure
```
src/
├── assets/            # Static assets and images
├── components/        # Reusable UI elements (ProgressBar, WeekdaySelector)
├── context/           # Profile and Toast global state
├── database/          # SQLite schema and cross-platform operations
├── navigation/        # Stack and Bottom Tab navigation logic
├── screens/           # Main screen implementations
├── styles/            # Design system (theme, global styles)
├── utils/             # Business logic (prediction engine, cloud sync, responsive scaling)
└── supabase_setup.sql # Database schema for Supabase
```

## 🚀 Getting Started
1. **Clone & Install**:
   ```bash
   git clone https://github.com/TheGreatL/ojt-time-tracker.git
   npm install
   ```
2. **Environment Setup**:
   Configure your Supabase URL and Key in the `.env` file.
3. **Run**:
   ```bash
   npm run web    # Web Preview
   npm start      # Launch Expo for Mobile Testing
   ```

## 💡 Key Screens
- **Profile Selection** - Multi-user hub with profile isolation.
- **Dashboard** - Core progress hub with estimated completion date.
- **Settings** - Configuration for hour goals, weekly schedule, and privacy settings.
- **Team Status** - Collective progress tracking for your team.
- **Date Entry Modal** - Detailed logging of daily hours and notes.
