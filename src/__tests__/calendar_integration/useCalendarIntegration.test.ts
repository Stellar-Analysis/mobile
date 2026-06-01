import { renderHook, act } from '@testing-library/react-native';
import { useCalendarIntegration } from '../../hooks/useCalendarIntegration';
import { MOCK_EVENTS } from '../../features/calendar_integration';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => () => {}),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: { OS: 'ios' },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      PERMISSIONS: {
        READ_CALENDAR: 'android.permission.READ_CALENDAR',
        WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
      },
      RESULTS: { GRANTED: 'granted' },
    },
  };
});

describe('useCalendarIntegration', () => {
  it('initialises with not_requested permission and today as selected date', () => {
    const { result } = renderHook(() => useCalendarIntegration());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.events).toHaveLength(0);
    expect(result.current.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('requestPermission sets status to granted on iOS', async () => {
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.error).toBeNull();
  });

  it('loadEvents requires permission', async () => {
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.loadEvents();
    });
    expect(result.current.error).toBe('Calendar permission is required.');
  });

  it('loadEvents loads cached events after permission', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(MOCK_EVENTS));
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.requestPermission();
      await result.current.loadEvents();
    });
    expect(result.current.events.length).toBeGreaterThan(0);
  });

  it('createEvent requires permission', async () => {
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.createEvent({
        title: 'Test',
        startDate: '2026-06-01T10:00:00Z',
        endDate: '2026-06-01T11:00:00Z',
        hasReminder: false,
      });
    });
    expect(result.current.error).toBe('Calendar permission is required to create events.');
  });

  it('createEvent adds a new event after permission', async () => {
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.requestPermission();
    });
    await act(async () => {
      await result.current.createEvent({
        title: 'New Meeting',
        startDate: '2026-06-10T10:00:00Z',
        endDate: '2026-06-10T11:00:00Z',
        hasReminder: true,
        reminderMinutes: 30,
      });
    });
    expect(result.current.events.some(e => e.title === 'New Meeting')).toBe(true);
  });

  it('deleteEvent removes the event by id', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(MOCK_EVENTS));
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => {
      await result.current.requestPermission();
      await result.current.loadEvents();
    });
    const initialCount = result.current.events.length;
    act(() => {
      result.current.deleteEvent(result.current.events[0].id);
    });
    expect(result.current.events.length).toBe(initialCount - 1);
  });

  it('setSelectedDate updates the selected date', () => {
    const { result } = renderHook(() => useCalendarIntegration());
    act(() => {
      result.current.setSelectedDate('2026-07-04');
    });
    expect(result.current.selectedDate).toBe('2026-07-04');
  });

  it('reflects offline state', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => useCalendarIntegration());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOffline).toBe(true);
  });
});
