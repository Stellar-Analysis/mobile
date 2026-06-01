import { useCallback, useEffect, useState } from 'react';
import { Platform, GestureResponderEvent } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { DEFAULT_TOUCH_ACTIONS, TouchAction } from './index';

export interface Use3DTouchSupport {
  supported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  actions: TouchAction[];
  lastForce: number | null;
  handlePress: (evt: GestureResponderEvent) => void;
}

export function use3DTouchSupport(): Use3DTouchSupport {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastForce, setLastForce] = useState<number | null>(null);
  const netInfo = useNetInfo();

  useEffect(() => {
    setIsOffline(!netInfo.isConnected || netInfo.isInternetReachable === false);
  }, [netInfo]);

  const handlePress = useCallback((evt: GestureResponderEvent) => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS !== 'ios') throw new Error('3D Touch is only available on supported iOS devices.');
      const force = Math.min(evt.nativeEvent.force ?? 0, 1);
      setLastForce(force);
    } catch (err) {
      setError(err instanceof Error ? err.message : '3D Touch detection failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported: Platform.OS === 'ios',
    loading,
    error,
    isOffline,
    actions: DEFAULT_TOUCH_ACTIONS,
    lastForce,
    handlePress,
  };
}
