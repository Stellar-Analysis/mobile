import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  SharedItemRecord,
  SUPPORTED_MIME_TYPES,
} from '@features/share_extension';

const SHARE_EXTENSION_CACHE_KEY = 'share-extension-items';
const SHARE_QUEUE_KEY = 'share-extension-offline-queue';

const supportsShareExtension = () => Platform.OS === 'ios' || Platform.OS === 'android';

export interface UseShareExtension {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  sharedItems: SharedItemRecord[];
  receiveShare: (title: string, content: string, mimeType?: string, sourceApp?: string) => Promise<void>;
  clearShares: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
}

async function loadCachedShares(): Promise<SharedItemRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(SHARE_EXTENSION_CACHE_KEY);
    return cached ? (JSON.parse(cached) as SharedItemRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveCachedShares(items: SharedItemRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SHARE_EXTENSION_CACHE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // best-effort
  }
}

export function useShareExtension(): UseShareExtension {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [sharedItems, setSharedItems] = useState<SharedItemRecord[]>([]);

  useEffect(() => {
    let active = true;

    async function init() {
      const netState = await NetInfo.fetch();
      if (active) {
        setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
        setSharedItems(await loadCachedShares());
        setLoading(false);
      }
    }

    void init();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const receiveShare = useCallback(async (
    title: string,
    content: string,
    mimeType = 'text/plain',
    sourceApp = 'Unknown',
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsShareExtension()) {
        throw new Error('Share extension is not supported on this platform.');
      }

      if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported content type: ${mimeType}`);
      }

      const item: SharedItemRecord = {
        id: Date.now().toString(),
        title,
        content,
        mimeType,
        sourceApp,
        receivedAt: new Date().toISOString(),
      };

      const updated = [item, ...sharedItems];
      setSharedItems(updated);

      if (isOffline) {
        const queueRaw = await AsyncStorage.getItem(SHARE_QUEUE_KEY);
        const queue = queueRaw ? (JSON.parse(queueRaw) as SharedItemRecord[]) : [];
        await AsyncStorage.setItem(SHARE_QUEUE_KEY, JSON.stringify([item, ...queue]));
      }

      await saveCachedShares(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive shared content.');
    } finally {
      setLoading(false);
    }
  }, [sharedItems, isOffline]);

  const clearShares = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SHARE_EXTENSION_CACHE_KEY);
      setSharedItems([]);
    } catch {
      // best-effort
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (isOffline) return;

    setLoading(true);
    setError(null);

    try {
      const queueRaw = await AsyncStorage.getItem(SHARE_QUEUE_KEY);
      if (!queueRaw) return;

      const queue = JSON.parse(queueRaw) as SharedItemRecord[];
      const merged = [...queue, ...sharedItems];
      const unique = merged.filter(
        (item, index, arr) => arr.findIndex(i => i.id === item.id) === index,
      );
      setSharedItems(unique);
      await saveCachedShares(unique);
      await AsyncStorage.removeItem(SHARE_QUEUE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync offline share queue.');
    } finally {
      setLoading(false);
    }
  }, [isOffline, sharedItems]);

  return {
    isSupported: supportsShareExtension(),
    loading,
    error,
    isOffline,
    sharedItems,
    receiveShare,
    clearShares,
    syncOfflineQueue,
  };
}
