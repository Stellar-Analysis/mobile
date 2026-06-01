import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { WearOSMessage, DEFAULT_WEAR_OS_MESSAGES } from '@features/wear_os_app';

const STORAGE_KEY = 'wear-os-app-log';
const isSupported = () => Platform.OS === 'android';

export interface UseWearOSApp {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  messages: WearOSMessage[];
  sendMessage: (type: string, payload: Record<string, string>) => Promise<void>;
  clearMessages: () => Promise<void>;
}

export function useWearOSApp(): UseWearOSApp {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WearOSMessage[]>(DEFAULT_WEAR_OS_MESSAGES);

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
      if (!isSupported()) throw new Error('Wear OS App is only supported on Android.');
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const msg: WearOSMessage = { id: Date.now().toString(), type, payload, sentAt: new Date().toISOString(), status: 'sent' };
      const updated = [msg, ...messages].slice(0, 20);
      setMessages(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send Wear OS message.');
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
