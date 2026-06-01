import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { WatchMessage, DEFAULT_WATCH_MESSAGES } from '@features/watch_app';

const STORAGE_KEY = 'watch-app-log';
const isSupported = () => Platform.OS === 'ios';

export interface UseWatchApp {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  messages: WatchMessage[];
  sendMessage: (type: string, payload: Record<string, string>) => Promise<void>;
  clearMessages: () => Promise<void>;
}

export function useWatchApp(): UseWatchApp {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WatchMessage[]>(DEFAULT_WATCH_MESSAGES);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && stored) setMessages(JSON.parse(stored));
      } catch { /* best-effort */ } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const sendMessage = useCallback(async (type: string, payload: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupported()) throw new Error('Watch App is only supported on iOS.');
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const msg: WatchMessage = { id: Date.now().toString(), type, payload, sentAt: new Date().toISOString(), status: 'sent' };
      const updated = [msg, ...messages].slice(0, 20);
      setMessages(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send Watch message.');
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setMessages([]);
    } catch { /* best-effort */ }
  }, []);

  return { isSupported: isSupported(), loading, error, messages, sendMessage, clearMessages };
}
