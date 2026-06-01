import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { LiveActivity, DEFAULT_LIVE_ACTIVITIES } from '@features/live_activities';

const STORAGE_KEY = 'live-activities-log';
const isSupported = () => Platform.OS === 'ios';

export interface UseLiveActivities {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  activities: LiveActivity[];
  startActivity: (title: string, subtitle: string) => Promise<void>;
  endActivity: (id: string) => Promise<void>;
  clearActivities: () => Promise<void>;
}

export function useLiveActivities(): UseLiveActivities {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<LiveActivity[]>(DEFAULT_LIVE_ACTIVITIES);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && stored) setActivities(JSON.parse(stored));
      } catch { /* best-effort */ } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const persist = async (updated: LiveActivity[]) => {
    setActivities(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const startActivity = useCallback(async (title: string, subtitle: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupported()) throw new Error('Live Activities are only supported on iOS.');
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const activity: LiveActivity = { id: Date.now().toString(), title, subtitle, startedAt: new Date().toISOString(), status: 'active' };
      await persist([activity, ...activities].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Live Activity.');
    } finally {
      setLoading(false);
    }
  }, [activities]);

  const endActivity = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = activities.map(a => a.id === id ? { ...a, status: 'ended' as const } : a);
      await persist(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end Live Activity.');
    } finally {
      setLoading(false);
    }
  }, [activities]);

  const clearActivities = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setActivities([]);
    } catch { /* best-effort */ }
  }, []);

  return { isSupported: isSupported(), loading, error, activities, startActivity, endActivity, clearActivities };
}
