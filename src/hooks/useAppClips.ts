import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AppClip, DEFAULT_APP_CLIPS } from '@features/app_clips';

const STORAGE_KEY = 'app-clips-log';
const isSupported = () => Platform.OS === 'ios';

export interface UseAppClips {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  clips: AppClip[];
  launchClip: (url: string, title: string) => Promise<void>;
  clearClips: () => Promise<void>;
}

export function useAppClips(): UseAppClips {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<AppClip[]>(DEFAULT_APP_CLIPS);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && stored) setClips(JSON.parse(stored));
      } catch { /* best-effort */ } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const launchClip = useCallback(async (url: string, title: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupported()) throw new Error('App Clips are only supported on iOS.');
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const clip: AppClip = { id: Date.now().toString(), url, title, launchedAt: new Date().toISOString(), status: 'success' };
      const updated = [clip, ...clips].slice(0, 20);
      setClips(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch App Clip.');
    } finally {
      setLoading(false);
    }
  }, [clips]);

  const clearClips = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setClips([]);
    } catch { /* best-effort */ }
  }, []);

  return { isSupported: isSupported(), loading, error, clips, launchClip, clearClips };
}
