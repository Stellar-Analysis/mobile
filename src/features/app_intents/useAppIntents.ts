import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const APP_INTENTS_STORAGE_KEY = 'app-intents-log';

export interface AppIntent {
  id: string;
  name: string;
  parameters: Record<string, string>;
  executedAt: string;
  status: 'success' | 'failed';
}

export interface UseAppIntents {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  intents: AppIntent[];
  executeIntent: (name: string, parameters?: Record<string, string>) => Promise<void>;
  clearIntents: () => Promise<void>;
}

const supportsIntents = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function useAppIntents(): UseAppIntents {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intents, setIntents] = useState<AppIntent[]>([]);

  useEffect(() => {
    let active = true;

    async function loadIntents() {
      try {
        const stored = await AsyncStorage.getItem(APP_INTENTS_STORAGE_KEY);
        if (active && stored) {
          setIntents(JSON.parse(stored));
        }
      } catch {
        // Ignore storage failures.
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadIntents();
    return () => { active = false; };
  }, []);

  const executeIntent = useCallback(async (name: string, parameters: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsIntents()) {
        throw new Error('App Intents are not supported on this platform.');
      }

      // Simulate intent execution
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      const intent: AppIntent = {
        id: Date.now().toString(),
        name,
        parameters,
        executedAt: new Date().toISOString(),
        status: 'success',
      };
      const updated = [intent, ...intents].slice(0, 20);
      setIntents(updated);
      await AsyncStorage.setItem(APP_INTENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute intent.');
    } finally {
      setLoading(false);
    }
  }, [intents]);

  const clearIntents = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(APP_INTENTS_STORAGE_KEY);
      setIntents([]);
    } catch {
      // Best-effort.
    }
  }, []);

  return {
    isSupported: supportsIntents(),
    loading,
    error,
    intents,
    executeIntent,
    clearIntents,
  };
}
