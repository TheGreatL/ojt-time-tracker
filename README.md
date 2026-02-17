# OJTally Multi-Profile App

A React Native internship tracker with multi-profile support, SQLite persistence, and intelligent completion date prediction.

## Features Implemented

✅ **Multi-Profile System** - Netflix-style profile selection (up to 5 profiles)
✅ **SQLite Database** - Complete data persistence with profile isolation  
✅ **Custom Scheduling** - Flexible weekly schedule with daily/weekly hour caps
✅ **Interactive Calendar** - Color-coded dates with manual hour entry
✅ **Prediction Engine** - Intelligent completion date calculation
✅ **Mobile-Native UI** - Smooth transitions, large touch targets

## Project Structure

```
src/
├── database/          # SQLite schema, operations, initialization
├── context/           # ProfileContext for global state
├── screens/           # All app screens
├── components/        # Reusable UI components
├── navigation/        # Stack navigator setup
├── utils/             # Prediction engine
└── styles/            # Theme and global styles
```

## Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run on web
npm run web
```

## Key Components

- **ProfileSelectionScreen** - Grid of user profiles with add/delete
- **DashboardScreen** - Progress tracking with gold completion date
- **SettingsScreen** - Hour requirements and schedule configuration
- **CalendarScreen** - Interactive calendar with color-coded dates
- **DateEntryModal** - Manual hour entry and date exclusions

## Database Schema

- **profiles** - User profiles with avatars
- **settings** - Per-profile configuration (hours, caps, schedule)
- **attendance_logs** - Daily hour logs and exclusions

## Prediction Algorithm

Iterates through future dates respecting:
- Custom weekly schedule (selected work days)
- Daily hour caps
- Weekly hour caps  
- Excluded dates (cannot attend)
- Logged hours to date

Returns estimated completion date displayed prominently on dashboard.
