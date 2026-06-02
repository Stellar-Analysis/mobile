# NFC Support

NFC support covers tap-to-pay readiness and hardware-authentication workflows for iOS and Android.

The hook initializes support state, tracks network availability, exposes loading and scanning states, and stores recent sessions in AsyncStorage so the UI can show the latest cached NFC activity while offline.

## API

`useNFCSupport()` returns:

- `isSupported`, `isEnabled`, `isOffline`, `isLoading`, `isScanning`, and `error`
- `lastResult` and `cachedResults`
- `startSession(mode)`, `stopSession()`, and `clearCachedResults()`

`mode` can be `tap_to_pay` or `hardware_authentication`.
