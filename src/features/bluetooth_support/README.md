# Bluetooth Support

Bluetooth support provides hardware-wallet and payment-terminal discovery for iOS and Android.

The hook initializes platform support, tracks offline status, exposes loading/scanning state, caches discovered devices, and keeps the selected paired device available across sessions.

## API

`useBluetoothSupport()` returns:

- `isSupported`, `isEnabled`, `isOffline`, `isLoading`, `isScanning`, and `error`
- `devices` and `pairedDevice`
- `startScan()`, `stopScan()`, `pairDevice(deviceId)`, and `clearDevices()`
