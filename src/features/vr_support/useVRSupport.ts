import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const VR_MODE_STORAGE_KEY = 'vr-support-session';

export interface UseVRSupport {
  isSupported: boolean;
  isInVrMode: boolean;
  loading: boolean;
  error: string | null;
  enterVr: () => Promise<void>;
  exitVr: () => Promise<void>;
}

const supportsVr = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function useVRSupport(): UseVRSupport {
  const [isInVrMode, setIsInVrMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const stored = await AsyncStorage.getItem(VR_MODE_STORAGE_KEY);
        if (active && stored === 'active') {
          setIsInVrMode(true);
        }
      } catch {
        // Ignore storage failures, preserve initial state.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const enterVr = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsVr()) {
        throw new Error('VR support is unavailable on this platform.');
      }
      await AsyncStorage.setItem(VR_MODE_STORAGE_KEY, 'active');
      setIsInVrMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enter VR mode.');
    } finally {
      setLoading(false);
    }
  }, []);

  const exitVr = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await AsyncStorage.setItem(VR_MODE_STORAGE_KEY, 'inactive');
      setIsInVrMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to exit VR mode.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported: supportsVr(),
    isInVrMode,
    loading,
    error,
    enterVr,
    exitVr,
  };
}
