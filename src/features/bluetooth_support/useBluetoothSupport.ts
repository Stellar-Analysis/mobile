import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import type { BluetoothDevice, BluetoothState } from './types';

const BLUETOOTH_CACHE_KEY = 'bluetooth-support-cache:v1';

const demoDevices: BluetoothDevice[] = [
  {
    id: 'ledger-nano-x',
    name: 'Ledger Nano X',
    type: 'hardware_wallet',
    signalStrength: -48,
    paired: false,
    lastSeen: '',
  },
  {
    id: 'stellar-terminal-01',
    name: 'Stellar Payment Terminal',
    type: 'payment_terminal',
    signalStrength: -61,
    paired: false,
    lastSeen: '',
  },
];

const initialState: BluetoothState = {
  isSupported: Platform.OS === 'ios' || Platform.OS === 'android',
  isEnabled: false,
  isOffline: false,
  isLoading: true,
  isScanning: false,
  error: null,
  devices: [],
  pairedDevice: null,
};

async function readCachedDevices(): Promise<BluetoothDevice[]> {
  try {
    const cached = await AsyncStorage.getItem(BLUETOOTH_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(BLUETOOTH_CACHE_KEY);
    return [];
  }
}

async function writeCachedDevices(devices: BluetoothDevice[]): Promise<void> {
  await AsyncStorage.setItem(BLUETOOTH_CACHE_KEY, JSON.stringify(devices));
}

function discoveredDevices(): BluetoothDevice[] {
  const lastSeen = new Date().toISOString();
  return demoDevices.map(device => ({ ...device, lastSeen }));
}

export function useBluetoothSupport() {
  const [state, setState] = useState<BluetoothState>(initialState);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [cachedDevices, netState] = await Promise.all([readCachedDevices(), NetInfo.fetch()]);
        if (!mounted) {
          return;
        }

        setState(current => ({
          ...current,
          devices: cachedDevices,
          pairedDevice: cachedDevices.find(device => device.paired) ?? null,
          isEnabled: current.isSupported,
          isOffline: !netState.isConnected || netState.isInternetReachable === false,
          isLoading: false,
        }));
      } catch (error) {
        if (mounted) {
          setState(current => ({
            ...current,
            isLoading: false,
            error:
              error instanceof Error ? error.message : 'Unable to initialize Bluetooth support.',
          }));
        }
      }
    }

    void initialize();

    const unsubscribe = NetInfo.addEventListener(netState => {
      setState(current => ({
        ...current,
        isOffline: !netState.isConnected || netState.isInternetReachable === false,
      }));
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  const stopScan = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setState(current => ({ ...current, isScanning: false, isLoading: false }));
  }, []);

  const startScan = useCallback(() => {
    setState(current => ({ ...current, error: null, isLoading: true }));

    if (!stateRef.current.isSupported) {
      setState(current => ({
        ...current,
        isLoading: false,
        error: 'Bluetooth is not supported on this device.',
      }));
      return;
    }

    if (!stateRef.current.isEnabled) {
      setState(current => ({
        ...current,
        isLoading: false,
        error: 'Bluetooth is disabled. Enable Bluetooth in device settings and try again.',
      }));
      return;
    }

    setState(current => ({ ...current, isScanning: true }));
    scanTimerRef.current = setTimeout(
      async () => {
        try {
          const devices = discoveredDevices();
          await writeCachedDevices(devices);
          Vibration.vibrate([0, 25, 20, 25]);
          setState(current => ({
            ...current,
            devices,
            isLoading: false,
            isScanning: false,
            error: null,
          }));
        } catch (error) {
          setState(current => ({
            ...current,
            isLoading: false,
            isScanning: false,
            error: error instanceof Error ? error.message : 'Bluetooth scan failed.',
          }));
        }
      },
      Platform.select({ ios: 1200, android: 900, default: 1000 })
    );
  }, []);

  const pairDevice = useCallback(async (deviceId: string) => {
    const existing = stateRef.current.devices.find(device => device.id === deviceId);
    if (!existing) {
      setState(current => ({ ...current, error: 'Bluetooth device not found.' }));
      return;
    }

    const devices = stateRef.current.devices.map(device => ({
      ...device,
      paired: device.id === deviceId,
    }));
    const pairedDevice = devices.find(device => device.id === deviceId) ?? null;

    await writeCachedDevices(devices);
    setState(current => ({ ...current, devices, pairedDevice, error: null }));
  }, []);

  const clearDevices = useCallback(async () => {
    await writeCachedDevices([]);
    setState(current => ({ ...current, devices: [], pairedDevice: null, error: null }));
  }, []);

  return {
    ...state,
    startScan,
    stopScan,
    pairDevice,
    clearDevices,
  };
}
