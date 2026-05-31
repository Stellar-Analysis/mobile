import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const SHORTCUTS_STORAGE_KEY = 'shortcuts-support-list';

export interface Shortcut {
  id: string;
  title: string;
  phrase: string;
  createdAt: string;
}

export interface UseShortcutsSupport {
  isSupported: boolean;
  loading: boolean;
  error: string | null;
  shortcuts: Shortcut[];
  addShortcut: (title: string, phrase: string) => Promise<void>;
  removeShortcut: (id: string) => Promise<void>;
}

const supportsShortcuts = () => Platform.OS === 'ios' || Platform.OS === 'android';

export function useShortcutsSupport(): UseShortcutsSupport {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    let active = true;

    async function loadShortcuts() {
      try {
        const stored = await AsyncStorage.getItem(SHORTCUTS_STORAGE_KEY);
        if (active && stored) {
          setShortcuts(JSON.parse(stored));
        }
      } catch {
        // Ignore storage failures.
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadShortcuts();
    return () => { active = false; };
  }, []);

  const persist = useCallback(async (updated: Shortcut[]) => {
    await AsyncStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addShortcut = useCallback(async (title: string, phrase: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsShortcuts()) {
        throw new Error('Shortcuts are not supported on this platform.');
      }

      const shortcut: Shortcut = {
        id: Date.now().toString(),
        title,
        phrase,
        createdAt: new Date().toISOString(),
      };
      const updated = [...shortcuts, shortcut];
      setShortcuts(updated);
      await persist(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shortcut.');
    } finally {
      setLoading(false);
    }
  }, [shortcuts, persist]);

  const removeShortcut = useCallback(async (id: string) => {
    try {
      const updated = shortcuts.filter(s => s.id !== id);
      setShortcuts(updated);
      await persist(updated);
    } catch {
      // Best-effort.
    }
  }, [shortcuts, persist]);

  return {
    isSupported: supportsShortcuts(),
    loading,
    error,
    shortcuts,
    addShortcut,
    removeShortcut,
  };
}
