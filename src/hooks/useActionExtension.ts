import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  ActionExtensionRecord,
  AVAILABLE_ACTIONS,
} from '@features/action_extension';

const ACTION_EXTENSION_CACHE_KEY = 'action-extension-log';
const ACTION_OFFLINE_QUEUE_KEY = 'action-extension-offline-queue';

const supportsActionExtension = () => Platform.OS === 'ios' || Platform.OS === 'android';

export interface UseActionExtension {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  actions: ActionExtensionRecord[];
  availableActions: typeof AVAILABLE_ACTIONS;
  executeAction: (actionType: string, payload?: string) => Promise<void>;
  clearActions: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
}

async function loadCachedActions(): Promise<ActionExtensionRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(ACTION_EXTENSION_CACHE_KEY);
    return cached ? (JSON.parse(cached) as ActionExtensionRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveCachedActions(actions: ActionExtensionRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTION_EXTENSION_CACHE_KEY, JSON.stringify(actions.slice(0, 30)));
  } catch {
    // best-effort
  }
}

export function useActionExtension(): UseActionExtension {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [actions, setActions] = useState<ActionExtensionRecord[]>([]);

  useEffect(() => {
    let active = true;

    async function init() {
      const netState = await NetInfo.fetch();
      if (active) {
        setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
        setActions(await loadCachedActions());
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

  const executeAction = useCallback(async (actionType: string, payload = '') => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsActionExtension()) {
        throw new Error('Action extension is not supported on this platform.');
      }

      const known = AVAILABLE_ACTIONS.some(a => a.type === actionType);
      if (!known) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      await new Promise<void>(resolve => setTimeout(resolve, 400));

      const record: ActionExtensionRecord = {
        id: Date.now().toString(),
        actionType,
        payload,
        status: isOffline ? 'pending' : 'completed',
        executedAt: new Date().toISOString(),
      };

      const updated = [record, ...actions];
      setActions(updated);
      await saveCachedActions(updated);

      if (isOffline) {
        const queueRaw = await AsyncStorage.getItem(ACTION_OFFLINE_QUEUE_KEY);
        const queue = queueRaw ? (JSON.parse(queueRaw) as ActionExtensionRecord[]) : [];
        await AsyncStorage.setItem(ACTION_OFFLINE_QUEUE_KEY, JSON.stringify([record, ...queue]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action.');
    } finally {
      setLoading(false);
    }
  }, [actions, isOffline]);

  const clearActions = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ACTION_EXTENSION_CACHE_KEY);
      setActions([]);
    } catch {
      // best-effort
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (isOffline) return;

    setLoading(true);
    setError(null);

    try {
      const queueRaw = await AsyncStorage.getItem(ACTION_OFFLINE_QUEUE_KEY);
      if (!queueRaw) return;

      const queue = JSON.parse(queueRaw) as ActionExtensionRecord[];
      const completed = queue.map(item => ({ ...item, status: 'completed' as const }));
      const updated = [...completed, ...actions].slice(0, 30);
      setActions(updated);
      await saveCachedActions(updated);
      await AsyncStorage.removeItem(ACTION_OFFLINE_QUEUE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync offline action queue.');
    } finally {
      setLoading(false);
    }
  }, [isOffline, actions]);

  return {
    isSupported: supportsActionExtension(),
    loading,
    error,
    isOffline,
    actions,
    availableActions: AVAILABLE_ACTIONS,
    executeAction,
    clearActions,
    syncOfflineQueue,
  };
}
