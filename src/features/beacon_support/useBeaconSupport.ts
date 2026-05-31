import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';

const LAST_BEACONS_KEY = 'beacon-support-last-seen';

export interface UseBeaconSupport {
  isSupported: boolean;
  isScanning: boolean;
  loading: boolean;
  error: string | null;
  beacons: string[];
  startScan: () => void;
  stopScan: () => void;
}

const supportsBeacon = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function useBeaconSupport(): UseBeaconSupport {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beacons, setBeacons] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLastBeacons() {
      try {
        const stored = await AsyncStorage.getItem(LAST_BEACONS_KEY);
        if (active && stored) {
          setBeacons(JSON.parse(stored));
        }
      } catch {
        // Ignore storage issues, keep scanning available.
      }
    }

    void loadLastBeacons();

    return () => {
      active = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const updateBeaconCache = useCallback(async (foundBeacons: string[]) => {
    try {
      await AsyncStorage.setItem(LAST_BEACONS_KEY, JSON.stringify(foundBeacons));
    } catch {
      // Best-effort persistence only.
    }
  }, []);

  const stopScan = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsScanning(false);
    setLoading(false);
  }, []);

  const startScan = useCallback(() => {
    setLoading(true);
    setError(null);
    setIsScanning(true);

    timerRef.current = setTimeout(async () => {
      const discovered = ['Beacon-A1', 'Beacon-B6', 'Beacon-C3'];
      setBeacons(discovered);
      Vibration.vibrate([0, 40, 30, 40]);
      await updateBeaconCache(discovered);
      setLoading(false);
    }, 900);
  }, [updateBeaconCache]);

  return {
    isSupported: supportsBeacon(),
    isScanning,
    loading,
    error,
    beacons,
    startScan,
    stopScan,
  };
}
