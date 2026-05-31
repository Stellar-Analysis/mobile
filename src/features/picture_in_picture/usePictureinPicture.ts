import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface UsePictureinPicture {
  isSupported: boolean;
  isActive: boolean;
  isOffline: boolean;
  loading: boolean;
  error: string | null;
  enterPictureInPicture: () => void;
  exitPictureInPicture: () => void;
}

const supportsPictureInPicture = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function usePictureinPicture(): UsePictureinPicture {
  const [isActive, setIsActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });

    return () => unsubscribe();
  }, []);

  const enterPictureInPicture = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsPictureInPicture()) {
        throw new Error('Picture in picture is not supported on this device.');
      }
      setTimeout(() => {
        setIsActive(true);
        setLoading(false);
      }, 250);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to enter picture in picture mode.');
    }
  }, []);

  const exitPictureInPicture = useCallback(() => {
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setIsActive(false);
      setLoading(false);
    }, 150);
  }, []);

  return {
    isSupported: supportsPictureInPicture(),
    isActive,
    isOffline,
    loading,
    error,
    enterPictureInPicture,
    exitPictureInPicture,
  };
}
