# Daily Planner Mobile App

A React Native mobile application built with Expo that provides daily planning, task management, and analytics features.

## Features

- **Plan Screen**: Create daily plans with routines and tasks
- **Today Screen**: Track execution of daily plans with status updates
- **Todo Screen**: Manage task backlog with flexible and time-bound tasks
- **Routine Screen**: Create and manage weekly routines
- **Analytics Screen**: View performance insights and execution history

## Tech Stack

- **React Native** (via Expo)
- **React Navigation** (Bottom Tab Navigation)
- **Axios** (API integration)
- **Date-fns** (Date formatting)
- **Expo Vector Icons** (Icons)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo Go app (for testing on mobile device)
- Backend server running on port 5000

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. Start the Expo development server:
   ```bash
   npx expo start
   ```

2. Choose your preferred platform:
   - Press `a` to open on Android
   - Press `i` to open on iOS
   - Press `w` to open in web browser
   - Scan QR code with Expo Go app

### Configuration

The app connects to the backend API at `http://localhost:5000/api`. Make sure your backend server is running before starting the mobile app.

## Project Structure

```
mobile/
├── src/
│   ├── api/           # API integration layer
│   ├── components/    # Reusable UI components
│   ├── context/       # React context providers
│   ├── navigation/    # Navigation configuration
│   └── screens/       # App screens
├── App.js             # Main app component
└── package.json       # Dependencies
```

## API Integration

The app uses the same API endpoints as the web version:

- `/auth` - Authentication
- `/tasks` - Task management
- `/routines` - Routine management
- `/plan` - Daily planning
- `/summary` - Analytics data

## UI Components

### Reusable Components

- **Button**: Customizable button with variants (primary, secondary, outline)
- **Card**: Container component with consistent styling
- **Input**: Text input with styling
- **Loading**: Loading indicator component
- **Header**: Screen header with title and profile button

### Screen Components

- **PlanScreen**: Daily planning interface
- **TodayScreen**: Execution tracking with timeline view
- **TodoScreen**: Task management with active/completed tabs
- **RoutineScreen**: Weekly routine configuration
- **AnalyticsScreen**: Performance metrics and insights

## Navigation

The app uses bottom tab navigation with 5 tabs:

1. **Plan**: Create and edit daily plans
2. **Today**: View and track today's execution
3. **Todos**: Manage task backlog
4. **Routines**: Configure weekly routines
5. **Analytics**: View performance analytics

## Styling

The app uses React Native StyleSheet for consistent styling with:

- **Color Scheme**: Blue primary color (#3B82F6)
- **Typography**: Consistent font weights and sizes
- **Spacing**: Standardized padding and margins
- **Border Radius**: Consistent rounded corners (12-16px)

## Development Notes

- The app maintains the same business logic as the web version
- All API calls are preserved and adapted for mobile
- UI is converted from web components to React Native components
- State management uses React hooks and context
- Navigation replaces web routing with mobile-friendly tab navigation

## Troubleshooting

### Common Issues

1. **API Connection Error**: Ensure backend is running on port 5000
2. **Metro Bundler Issues**: Clear cache with `npx expo start --clear`
3. **Navigation Issues**: Check that all screen components are properly imported
4. **Icon Issues**: Ensure expo-vector-icons is properly installed

### Debugging

- Use Expo DevTools for debugging
- Check console logs in Metro bundler
- Use React DevTools for component inspection

## Future Enhancements

- Push notifications for task reminders
- Offline mode support
- Biometric authentication
- Data synchronization
- Export analytics reports
