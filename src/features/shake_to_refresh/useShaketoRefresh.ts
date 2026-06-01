import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { DEFAULT_SHAKE_CONFIG, ShakeConfig } from './index';

export interface UseShaketoRefresh {
  supported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  shakeCount: number;
  lastShakeAt: number | null;
  triggerRefresh: () => Promise<void>;
  reset: () => void;
}

export function useShaketoRefresh(
  onRefresh?: () => Promise<void>,
  config: ShakeConfig = DEFAULT_SHAKE_CONFIG,
): UseShaketoRefresh {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [lastShakeAt, setLastShakeAt] = useState<number | null>(null);
  const lastShakeRef = useRef<number>(0);
  const netInfo = useNetInfo();

  useEffect(() => {
    setIsOffline(!netInfo.isConnected || netInfo.isInternetReachable === false);
  }, [netInfo]);

  // Accelerometer-based shake detection (RN DeviceEventEmitter / Accelerometer)
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    try {
      // Use RN's built-in DeviceEventEmitter for shake on iOS debug builds;
      // on production / Android we rely on the manual triggerRefresh fallback.
      const { DeviceEventEmitter } = require('react-native');
      subscription = DeviceEventEmitter.addListener('shake', () => {
        const now = Date.now();
        if (now - lastShakeRef.current < config.cooldownMs) return;
        lastShakeRef.current = now;
        setShakeCount(c => c + 1);
        setLastShakeAt(now);
        void triggerRefresh();
      });
    } catch { /* DeviceEventEmitter shake not available */ }
    return () => { subscription?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.cooldownMs]);

  const triggerRefresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed.');
    } finally {
      setLoading(false);
    }
  }, [loading, onRefresh]);

  const reset = useCallback(() => {
    setShakeCount(0);
    setLastShakeAt(null);
    setError(null);
  }, []);

  return {
    supported: Platform.OS === 'ios' || Platform.OS === 'android',
    loading,
    error,
    isOffline,
    shakeCount,
    lastShakeAt,
    triggerRefresh,
    reset,
  };
}
