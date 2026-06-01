import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { CalendarEvent, CalendarState, MOCK_EVENTS } from '../features/calendar_integration';

const CALENDAR_CACHE_KEY = 'calendar-integration-cache';

export interface UseCalendarIntegration extends CalendarState {
  requestPermission: () => Promise<void>;
  loadEvents: (date?: string) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: string) => void;
}

async function loadCachedEvents(): Promise<CalendarEvent[]> {
  try {
    const cached = await AsyncStorage.getItem(CALENDAR_CACHE_KEY);
    return cached ? (JSON.parse(cached) as CalendarEvent[]) : MOCK_EVENTS;
  } catch {
    return MOCK_EVENTS;
  }
}

async function cacheEvents(events: CalendarEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(events));
  } catch {
    // best effort
  }
}

async function requestCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const [readGranted, writeGranted] = await Promise.all([
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CALENDAR, {
        title: 'Calendar Read Permission',
        message: 'This app needs to read your calendar events.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      }),
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR, {
        title: 'Calendar Write Permission',
        message: 'This app needs to create calendar events.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      }),
    ]);
    return (
      readGranted === PermissionsAndroid.RESULTS.GRANTED &&
      writeGranted === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}

let nextId = 100;

export function useCalendarIntegration(): UseCalendarIntegration {
  const [permissionStatus, setPermissionStatus] = useState<CalendarState['permissionStatus']>('not_requested');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDateState] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      const netState = await NetInfo.fetch();
      if (active) {
        setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
      }
      const cached = await loadCachedEvents();
      if (active) {
        setEvents(cached);
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

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const granted = await requestCalendarPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) {
        setError('Calendar permission denied. Enable it in Settings to manage events.');
      }
    } catch (err) {
      setPermissionStatus('unavailable');
      setError(err instanceof Error ? err.message : 'Failed to request calendar permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async (_date?: string) => {
    if (permissionStatus !== 'granted') {
      setError('Calendar permission is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cached = await loadCachedEvents();
      setEvents(cached);
      await cacheEvents(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  }, [permissionStatus]);

  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    if (permissionStatus !== 'granted') {
      setError('Calendar permission is required to create events.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newEvent: CalendarEvent = { ...event, id: String(nextId++) };
      const updated = [...events, newEvent];
      setEvents(updated);
      await cacheEvents(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calendar event.');
    } finally {
      setLoading(false);
    }
  }, [permissionStatus, events]);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      void cacheEvents(updated);
      return updated;
    });
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
  }, []);

  return {
    permissionStatus,
    events,
    selectedDate,
    loading,
    error,
    isOffline,
    requestPermission,
    loadEvents,
    createEvent,
    deleteEvent,
    setSelectedDate,
  };
}
