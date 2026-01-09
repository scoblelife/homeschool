# Homeschool Mobile App

A React Native mobile app for iOS and Android that provides mobile access to your homeschool management system.

## Features

- **Dashboard**: View today's activities, suggested milestones, star totals, and upcoming events
- **Activity Logging**: Quick activity logging with subject, type, duration, and notes
- **Milestones**: Track learning objectives, mark progress, and earn stars
- **Field Trips & Events**: Plan and manage field trips, park days, playdates, and co-op classes
- **Student Management**: Add and manage multiple students with customizable colors
- **Offline-First**: Data stored locally using SQLite for offline access

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Database**: expo-sqlite (SQLite)
- **State Management**: Zustand
- **UI Components**: Custom mobile-first component library
- **Icons**: @expo/vector-icons (Ionicons)

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: macOS with Xcode
- For Android: Android Studio with SDK

## Getting Started

### Development

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Building for Production

#### Using EAS Build (Recommended)

First, install the EAS CLI and log in:

```bash
npm install -g eas-cli
eas login
```

Build for platforms:

```bash
# Build for iOS (requires Apple Developer account)
npm run build:ios

# Build for Android
npm run build:android

# Build for both platforms
npm run build:all
```

#### Development Builds

For testing on physical devices:

```bash
# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with initialization
│   └── (tabs)/            # Tab navigation screens
│       ├── _layout.tsx    # Tab bar configuration
│       ├── index.tsx      # Dashboard
│       ├── activities.tsx # Activity logging
│       ├── milestones.tsx # Milestone tracking
│       ├── field-trips.tsx# Event planning
│       └── settings.tsx   # Student management
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # Design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── FAB.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── StudentSelector.tsx
│   │   ├── ActivityCard.tsx
│   │   ├── MilestoneCard.tsx
│   │   ├── FieldTripCard.tsx
│   │   └── StarDisplay.tsx
│   ├── database/          # SQLite database layer
│   │   ├── connection.ts  # Database singleton
│   │   ├── schema.ts      # Table creation & seeding
│   │   └── repositories/  # CRUD operations
│   ├── stores/            # Zustand state management
│   │   └── useStore.ts
│   └── types/             # TypeScript definitions
│       └── index.ts
├── assets/                # Images and icons
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── package.json
└── tsconfig.json
```

## Component Library

The app includes a custom mobile-first component library:

### Core Components

- **Button**: Primary, secondary, outline, ghost, and danger variants
- **Card**: Container with shadow and padding options
- **Input/TextArea**: Form inputs with labels and error states
- **Badge**: Status and category labels
- **Chip**: Selectable tags for filters
- **Modal**: Full-screen sheet modal
- **FAB**: Floating action button
- **EmptyState**: Placeholder with icon and action
- **ProgressBar**: Visual progress indicator

### Feature Components

- **StudentSelector**: Horizontal chip selector for switching students
- **ActivityCard**: Display activity with subject, type, and duration
- **MilestoneCard**: Show milestone with status and star value
- **FieldTripCard**: Event card with location, date, and type
- **StarDisplay**: Weekly and all-time star totals

## Database Schema

The mobile app uses the same schema as the desktop app:

- **students**: Student profiles with grade level and color
- **subjects**: Subject categories (Math, Reading, etc.)
- **sessions**: Learning sessions with time tracking
- **activities**: Individual learning activities
- **milestones**: Learning objectives and goals
- **student_rewards**: Star earnings for completed milestones
- **family_goals**: Shared family reward goals
- **field_trips**: Events and activities
- **activity_tasks**: Tasks for field trip planning
- **books**: Library catalog
- **student_books**: Reading progress tracking

## Syncing with Desktop

Currently, the mobile app maintains its own local database. Future versions will include:

- Cloud sync via REST API
- P2P sync with desktop app
- Export/import functionality

## App Store Submission

### iOS (App Store)

1. Update `app.json` with your bundle identifier
2. Configure EAS with your Apple Developer credentials
3. Run `eas build --platform ios --profile production`
4. Submit via `eas submit --platform ios`

### Android (Play Store)

1. Update `app.json` with your package name
2. Create a Google Play service account
3. Run `eas build --platform android --profile production`
4. Submit via `eas submit --platform android`

## Customization

### Changing Colors

Student colors are defined in `settings.tsx`:

```typescript
const colorOptions = [
  { value: 'child1', label: 'Fuchsia', color: '#d946ef' },
  { value: 'child2', label: 'Teal', color: '#14b8a6' },
  // Add more colors...
]
```

### Adding Activity Types

Activity types are defined in `activities.tsx`:

```typescript
const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'worksheet', label: 'Worksheet' },
  // Add more types...
]
```

## Troubleshooting

### Common Issues

**Metro bundler not starting**
```bash
npx expo start --clear
```

**SQLite not working**
```bash
npx expo install expo-sqlite
npx expo prebuild
```

**Build failing**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run typecheck`
5. Submit a pull request

## License

MIT
