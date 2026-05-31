import { useCallback, useEffect, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { Platform, Vibration } from 'react-native';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const PATTERN_MAP: Record<HapticPattern, number | number[]> = {
  light: 20,
  medium: [0, 30, 40],
  heavy: [0, 40, 30, 40],
  success: [0, 30, 20, 30, 10],
  warning: [0, 50, 20, 50, 20],
};

const supportsHaptics = () => Platform.OS === 'ios' || Platform.OS === 'android';

interface UseHapticPatterns {
  supported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  lastPattern: HapticPattern | null;
  triggerPattern: (pattern: HapticPattern) => Promise<void>;
}

export function useHapticPatterns(): UseHapticPatterns {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPattern, setLastPattern] = useState<HapticPattern | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const netInfo = useNetInfo();

  useEffect(() => {
    setIsOffline(!netInfo.isConnected || netInfo.isInternetReachable === false);
  }, [netInfo]);

  const triggerPattern = useCallback(async (pattern: HapticPattern) => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsHaptics()) {
        throw new Error('Haptics are not supported on this platform.');
      }
      const patternValue = PATTERN_MAP[pattern];
      Vibration.vibrate(patternValue);
      setLastPattern(pattern);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trigger haptic pattern.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported: supportsHaptics(),
    loading,
    error,
    isOffline,
    lastPattern,
    triggerPattern,
  };
}
