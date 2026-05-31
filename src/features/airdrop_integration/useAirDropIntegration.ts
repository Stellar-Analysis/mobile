import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Share } from 'react-native';

const AIRDROP_HISTORY_KEY = 'airdrop-integration-history';

export interface AirDropItem {
  id: string;
  title: string;
  sharedAt: string;
}

export interface UseAirDropIntegration {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  history: AirDropItem[];
  shareContent: (title: string, message: string, url?: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const supportsAirDrop = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function useAirDropIntegration(): UseAirDropIntegration {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AirDropItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const stored = await AsyncStorage.getItem(AIRDROP_HISTORY_KEY);
        if (active && stored) {
          setHistory(JSON.parse(stored));
        }
      } catch {
        // Ignore storage failures.
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHistory();
    return () => { active = false; };
  }, []);

  const shareContent = useCallback(async (title: string, message: string, url?: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsAirDrop()) {
        throw new Error('Sharing is not supported on this platform.');
      }

      const result = await Share.share({ title, message, url });

      if (result.action === Share.sharedAction) {
        const item: AirDropItem = {
          id: Date.now().toString(),
          title,
          sharedAt: new Date().toISOString(),
        };
        const updated = [item, ...history].slice(0, 20);
        setHistory(updated);
        await AsyncStorage.setItem(AIRDROP_HISTORY_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share content.');
    } finally {
      setLoading(false);
    }
  }, [history]);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AIRDROP_HISTORY_KEY);
      setHistory([]);
    } catch {
      // Best-effort.
    }
  }, []);

  return {
    isSupported: supportsAirDrop(),
    loading,
    error,
    history,
    shareContent,
    clearHistory,
  };
}
