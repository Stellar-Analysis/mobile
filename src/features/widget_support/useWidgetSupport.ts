import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { DEFAULT_WIDGETS, WidgetConfig } from './index';

const CACHE_KEY = 'widget-support-cache';
const isSupported = () => Platform.OS === 'ios' || Platform.OS === 'android';

async function loadCached(): Promise<WidgetConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as WidgetConfig[]) : DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

async function saveCached(widgets: WidgetConfig[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(widgets));
  } catch { /* best-effort */ }
}

export interface UseWidgetSupport {
  supported: boolean;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  widgets: WidgetConfig[];
  refresh: () => Promise<void>;
  addWidget: (widget: Omit<WidgetConfig, 'updatedAt'>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
}

export function useWidgetSupport(): UseWidgetSupport {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const net = await NetInfo.fetch();
        if (active) setIsOffline(!net.isConnected || net.isInternetReachable === false);
        const cached = await loadCached();
        if (active) setWidgets(cached);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load widgets.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    const unsub = NetInfo.addEventListener(s =>
      setIsOffline(!s.isConnected || s.isInternetReachable === false),
    );
    return () => { active = false; unsub(); };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupported()) throw new Error('Widgets are not supported on this platform.');
      const refreshed = DEFAULT_WIDGETS.map(w => ({ ...w, updatedAt: new Date().toISOString() }));
      setWidgets(refreshed);
      await saveCached(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh widgets.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addWidget = useCallback(async (widget: Omit<WidgetConfig, 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const newWidget: WidgetConfig = { ...widget, updatedAt: new Date().toISOString() };
      const updated = [...widgets, newWidget];
      setWidgets(updated);
      await saveCached(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add widget.');
    } finally {
      setLoading(false);
    }
  }, [widgets]);

  const removeWidget = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = widgets.filter(w => w.id !== id);
      setWidgets(updated);
      await saveCached(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove widget.');
    } finally {
      setLoading(false);
    }
  }, [widgets]);

  return { supported: isSupported(), loading, error, isOffline, widgets, refresh, addWidget, removeWidget };
}
