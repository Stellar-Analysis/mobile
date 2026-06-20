# Stellar Insights Mobile

React Native mobile application for Stellar Insights payment analytics.

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 Secure authentication with SEP-10
- 🌐 Network switching (testnet/mainnet)
- 📴 Offline-first architecture
- 🔔 Push notifications via Firebase Cloud Messaging
- 🔒 Biometric authentication
- 🎨 Native UI patterns

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode 14+ (for iOS)
- Android Studio Hedgehog+ (for Android)
- CocoaPods (for iOS)
- A Firebase project with iOS and Android apps registered

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

## Firebase Integration

### Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project (or use an existing one).
2. Register an **Android** app and an **iOS** app under the same project.

### Android setup

1. Download `google-services.json` from the Firebase console (Project Settings → Android app).
2. Place it at `android/app/google-services.json`.
3. Confirm `android/build.gradle` contains the Google Services classpath:

```groovy
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

4. Confirm `android/app/build.gradle` applies the plugin at the bottom:

```groovy
apply plugin: 'com.google.gms.google-services'
```

5. Rebuild the Android project:

```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### iOS setup

1. Download `GoogleService-Info.plist` from the Firebase console (Project Settings → iOS app).
2. Open Xcode: `open ios/StellarInsights.xcworkspace`
3. Drag `GoogleService-Info.plist` into the `StellarInsights` target in Xcode (check "Copy items if needed").
4. Ensure **Push Notifications** and **Background Modes → Remote notifications** capabilities are enabled in Xcode (Signing & Capabilities tab).
5. Re-run pod install:

```bash
cd ios && pod install && cd ..
npm run ios
```

### Environment variables

Add the following to your `.env` (values from Firebase console):

```
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
```

### Validating notifications

- **iOS simulator**: FCM token is issued but remote push delivery is blocked on simulator. Use a physical device or APNs sandbox for end-to-end validation.
- **Android emulator**: Requires Google Play Services. Use an AVD image with Play Store.
- Request permission and log the FCM token in development to confirm registration:

```typescript
import messaging from '@react-native-firebase/messaging';
const token = await messaging().getToken();
console.log('FCM token:', token); // send a test message from Firebase console
```

---

## Offline Mode Architecture

The app follows an **offline-first** pattern: all reads are served from a local cache and network data refreshes the cache in the background.

### What is cached

| Data type | Storage layer | TTL |
|-----------|---------------|-----|
| Corridors list | MMKV (via `useOfflineCaching`) | 24 hours |
| Anchors list | MMKV (via `useOfflineCaching`) | 24 hours |
| Dashboard stats | React Query in-memory + MMKV | 24 hours |
| Auth token | Platform keychain | Until expiry |
| Token expiry | AsyncStorage | Until expiry |

### How the cache is managed

- `useOfflineCaching` (`src/hooks/useOfflineCaching.ts`) wraps React Query with a persistent MMKV layer. Cache entries are JSON-serialised with an `expiresAt` timestamp. Expired entries are pruned on read.
- `useOfflineQueue` (`src/hooks/useOfflineQueue.ts`) holds write operations (e.g. pending transactions) while the device is offline.
- Network state is tracked by `@react-native-community/netinfo` via `src/services/network.ts`.

### Sync on reconnect

When connectivity is restored:

1. `MobileContractService` fires a `processQueue` sweep for any queued transactions.
2. React Query's `refetchOnReconnect` flag triggers background refetches for stale queries.
3. `usePullToRefresh` lets users manually trigger a full invalidation when online.

### Cache failure handling

- Read failures are logged as warnings via the structured logger and the stale in-memory cache is returned.
- Write failures are logged; the app continues with the last valid cached state.
- If offline cache is fully unavailable, the UI renders a "no data available offline" empty state.

### Offline indicators

- Stale data is marked with staleness indicators in the UI.
- `NetworkStatusIndicator` shows a banner when the device is offline.

---

## Production Build & Release

### Environment separation

Use `react-native-config` to load environment-specific `.env` files:

| File | Usage |
|------|-------|
| `.env` | Local development |
| `.env.staging` | Staging / QA |
| `.env.production` | Production release |

Set `ENVFILE=.env.production` when running release builds (see platform steps below).

### Android

**Generate a keystore** (one-time setup):

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore android/app/release.keystore \
  -alias stellar-insights \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Configure signing** in `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'stellar-insights'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Build release APK / AAB:**

```bash
# APK (for direct install / testing)
ENVFILE=.env.production cd android && ./gradlew assembleRelease

# AAB (for Google Play submission)
ENVFILE=.env.production cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS

**Configure signing in Xcode:**

1. Open `ios/StellarInsights.xcworkspace` in Xcode.
2. Set the team and provisioning profile under Signing & Capabilities.
3. Set the scheme to **Release**: Product → Scheme → Edit Scheme → Run → Build Configuration = Release.

**Archive and export:**

```bash
# Build archive
ENVFILE=.env.production xcodebuild \
  -workspace ios/StellarInsights.xcworkspace \
  -scheme StellarInsights \
  -configuration Release \
  -archivePath ios/build/StellarInsights.xcarchive \
  archive

# Export IPA (requires ExportOptions.plist)
xcodebuild -exportArchive \
  -archivePath ios/build/StellarInsights.xcarchive \
  -exportPath ios/build/export \
  -exportOptionsPlist ios/ExportOptions.plist
```

**Upload to TestFlight:**

```bash
xcrun altool --upload-app \
  --type ios \
  --file ios/build/export/StellarInsights.ipa \
  --username "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD"
```

### Common build issues

| Symptom | Fix |
|---------|-----|
| Metro bundler cache stale | `npm start -- --reset-cache` |
| iOS pod conflicts after `npm install` | `cd ios && pod deintegrate && pod install` |
| Android build cache issues | `cd android && ./gradlew clean` |
| `google-services.json` not found | Confirm file is at `android/app/google-services.json` |
| `GoogleService-Info.plist` not found | Confirm file is in Xcode project tree (not just filesystem) |
| FCM token not issued on iOS | Enable Push Notifications capability in Xcode |

---

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   └── main/         # Main app screens
│   ├── navigation/       # Navigation configuration
│   ├── services/
│   │   ├── api.ts        # REST API client
│   │   ├── auth.ts       # SEP-10 authentication
│   │   ├── database.ts   # Local DB initialization
│   │   ├── initialization.ts  # App bootstrap
│   │   ├── logger.ts     # Structured logging service
│   │   ├── network.ts    # Network state monitoring
│   │   ├── notifications.ts   # FCM / Notifee setup
│   │   └── tokenStorage.ts    # Keychain token persistence
│   ├── hooks/
│   │   ├── useOfflineCaching.ts   # MMKV-backed offline cache
│   │   ├── useOfflineQueue.ts     # Write-op queue for offline mode
│   │   └── usePullToRefresh.ts    # Pull-to-refresh with query invalidation
│   ├── store/            # Zustand state (auth, app)
│   ├── types/            # TypeScript types
│   ├── config/           # App constants
│   └── App.tsx           # Root component
├── android/              # Android native code
├── ios/                  # iOS native code
└── package.json
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-native-firebase/messaging` | FCM push notifications |
| `@notifee/react-native` | Local notification display |
| `@tanstack/react-query` | Server-state fetching and caching |
| `react-native-mmkv` | Fast synchronous local storage |
| `react-native-keychain` | Secure credential storage (keychain/keystore) |
| `react-native-config` | Environment variable management |
| `zustand` | Lightweight global state |
| `axios` | HTTP client |

## Development

### Running tests

```bash
npm test
```

### Type checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Logging

All modules use a centralised structured logger (`src/services/logger.ts`) instead of raw `console.*` calls:

```typescript
import { createScopedLogger } from '@services/logger';
const log = createScopedLogger('MyModule');

log.info('Something happened');
log.warn('Degraded state', { reason: 'cache miss' });
log.error('Request failed', error, { endpoint: '/api/data' });
```

- **Development**: all levels printed to console with timestamps and platform tag.
- **Production**: `debug`/`info` suppressed; `warn`/`error` always emitted; errors forwarded to Crashlytics.
- Sensitive data (Stellar keys, JWTs, email addresses) is automatically redacted before output.

## Security

- Auth tokens stored in platform keychain (iOS Keychain / Android Keystore).
- Biometric authentication support.
- Certificate pinning enabled in production builds.
- Structured logger redacts PII and Stellar keys automatically.

## Network Switching

1. Go to Settings.
2. Tap "Current Network".
3. Select testnet or mainnet.
4. The app clears its cache and reconnects.

## Contributing

See the root `CONTRIBUTING.md`.

## License

See the root `LICENSE`.
