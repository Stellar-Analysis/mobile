# Stellar Insights Mobile

React Native mobile application for Stellar Insights payment analytics.

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 Secure authentication with SEP-10
- 🌐 Network switching (testnet/mainnet)
- 📴 Offline-first architecture
- 🔔 Push notifications
- 🔒 Biometric authentication
- 🎨 Native UI patterns

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install iOS pods:

```bash
cd ios && pod install && cd ..
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the app:

```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   └── main/         # Main app screens
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and business logic
│   │   ├── api.ts        # API client
│   │   ├── auth.ts       # Authentication service
│   │   ├── storage.ts    # Local storage
│   │   ├── network.ts    # Network monitoring
│   │   └── notifications.ts # Push notifications
│   ├── store/            # State management (Zustand)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── config/           # App configuration
│   └── App.tsx           # Root component
├── android/              # Android native code
├── ios/                  # iOS native code
└── package.json
```

## Key Dependencies

- **React Native**: Cross-platform framework
- **React Navigation**: Navigation library
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **Axios**: HTTP client
- **MMKV**: Fast local storage
- **React Native Keychain**: Secure credential storage
- **Notifee**: Local notifications
- **Firebase**: Push notifications

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Network Switching

The app supports runtime network switching between testnet and mainnet:

1. Go to Settings
2. Tap "Current Network"
3. Select desired network
4. App will clear cache and reconnect

## Offline Mode

The app works offline with cached data:

- Cached data is marked with staleness indicators
- Write operations are queued
- Automatic sync when connection is restored

## Push Notifications

Configure Firebase for push notifications:

1. Add `google-services.json` (Android) to `android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `ios/`
3. Set Firebase credentials in `.env`

## Security

- Tokens stored in platform keychain
- Biometric authentication support
- Certificate pinning (production)
- Secure local storage with encryption

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace StellarInsights.xcworkspace -scheme StellarInsights -configuration Release
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Metro bundler issues

```bash
npm start -- --reset-cache
```

### iOS build issues

```bash
cd ios
pod deintegrate
pod install
```

### Android build issues

```bash
cd android
./gradlew clean
```

## Contributing

See main repository CONTRIBUTING.md

## License

See main repository LICENSE
