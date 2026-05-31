import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BeaconSupportRecord, DEFAULT_BEACONS } from '../features/beacon_support';

const BEACON_CACHE_KEY = 'beacon-support-cache';

const supportsBeacon = () => Platform.OS === 'ios' || Platform.OS === 'android';

export interface UseBeaconSupport {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  isScanning: boolean;
  isOffline: boolean;
  beacons: BeaconSupportRecord[];
  startScan: () => void;
  stopScan: () => void;
}

async function loadCachedBeacons(): Promise<BeaconSupportRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(BEACON_CACHE_KEY);
    return cached ? (JSON.parse(cached) as BeaconSupportRecord[]) : DEFAULT_BEACONS;
  } catch {
    return DEFAULT_BEACONS;
  }
}

async function saveCachedBeacons(beacons: BeaconSupportRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BEACON_CACHE_KEY, JSON.stringify(beacons));
  } catch {
    // best effort caching only
  }
}

export function useBeaconSupport(): UseBeaconSupport {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [beacons, setBeacons] = useState<BeaconSupportRecord[]>(DEFAULT_BEACONS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      const netState = await NetInfo.fetch();
      setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
      const cached = await loadCachedBeacons();
      if (active) {
        setBeacons(cached);
      }
    }

    void init();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });

    return () => {
      active = false;
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const stopScan = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLoading(false);
    setIsScanning(false);
  }, []);

  const startScan = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!supportsBeacon()) {
      setError('Beacon scanning is not supported on this device.');
      setLoading(false);
      return;
    }

    setIsScanning(true);
    timerRef.current = setTimeout(async () => {
      try {
        const foundBeacons: BeaconSupportRecord[] = [
          {
            id: 'Beacon-001',
            signalStrength: -56,
            lastSeen: new Date().toLocaleTimeString(),
          },
          {
            id: 'Beacon-007',
            signalStrength: -63,
            lastSeen: new Date().toLocaleTimeString(),
          },
          {
            id: 'Beacon-011',
            signalStrength: -71,
            lastSeen: new Date().toLocaleTimeString(),
          },
        ];

        Vibration.vibrate([0, 30, 20, 30]);
        setBeacons(foundBeacons);
        await saveCachedBeacons(foundBeacons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beacon scan failed.');
      } finally {
        setLoading(false);
      }
    }, 900);
  }, []);

  return {
    isSupported: supportsBeacon(),
    loading,
    error,
    isScanning,
    isOffline,
    beacons,
    startScan,
    stopScan,
  };
}
