import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  DEFAULT_QUICK_ACTIONS,
  QuickActionRecord,
} from '@features/quick_actions';

const QUICK_ACTIONS_CACHE_KEY = 'quick-actions-cache';

const supportsQuickActions = () => Platform.OS === 'ios' || Platform.OS === 'android';

export interface UseQuickActions {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  actions: QuickActionRecord[];
  refreshActions: () => Promise<void>;
  pinAction: (actionId: string) => Promise<void>;
}

async function loadCachedActions(): Promise<QuickActionRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(QUICK_ACTIONS_CACHE_KEY);
    return cached ? (JSON.parse(cached) as QuickActionRecord[]) : DEFAULT_QUICK_ACTIONS;
  } catch {
    return DEFAULT_QUICK_ACTIONS;
  }
}

async function saveCachedActions(actions: QuickActionRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUICK_ACTIONS_CACHE_KEY, JSON.stringify(actions));
  } catch {
    // best-effort offline cache
  }
}

export function useQuickActions(): UseQuickActions {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [actions, setActions] = useState<QuickActionRecord[]>(DEFAULT_QUICK_ACTIONS);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const netState = await NetInfo.fetch();
        if (active) {
          setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
        }
        const cached = await loadCachedActions();
        if (active) {
          setActions(cached);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load quick actions.');
        }
      } finally {
        if (active) setLoading(false);
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

  const refreshActions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsQuickActions()) {
        throw new Error('Quick actions are not supported on this platform.');
      }

      const refreshed = DEFAULT_QUICK_ACTIONS.map(action => ({
        ...action,
        createdAt: new Date().toISOString(),
      }));
      setActions(refreshed);
      await saveCachedActions(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh quick actions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const pinAction = useCallback(async (actionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const pinned = actions.find(a => a.id === actionId);
      if (!pinned) {
        throw new Error('Quick action not found.');
      }

      const updated = [
        pinned,
        ...actions.filter(a => a.id !== actionId),
      ];
      setActions(updated);
      await saveCachedActions(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin quick action.');
    } finally {
      setLoading(false);
    }
  }, [actions]);

  return {
    isSupported: supportsQuickActions(),
    loading,
    error,
    isOffline,
    actions,
    refreshActions,
    pinAction,
  };
}
