import { renderHook, act } from '@testing-library/react-native';
import { useBackgroundLocation } from '../../hooks/useBackgroundLocation';
import type { LocationCoordinates } from '../../features/background_location/types';

const mockCoords = (lat: number, lng: number): LocationCoordinates => ({
  latitude: lat, longitude: lng, altitude: null,
  accuracy: 10, speed: null, heading: null, timestamp: Date.now(),
});

describe('useBackgroundLocation', () => {
  it('initialises with not_requested permission and not tracking', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.isTracking).toBe(false);
    expect(result.current.lastLocation).toBeNull();
    expect(result.current.locationHistory).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('onLocationUpdate sets lastLocation', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    act(() => result.current.onLocationUpdate(mockCoords(1.234, 5.678)));
    expect(result.current.lastLocation?.latitude).toBe(1.234);
  });

  it('onLocationUpdate appends to locationHistory', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    act(() => result.current.onLocationUpdate(mockCoords(1, 2)));
    act(() => result.current.onLocationUpdate(mockCoords(3, 4)));
    expect(result.current.locationHistory).toHaveLength(2);
  });

  it('locationHistory is capped at 100 entries', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    act(() => {
      for (let i = 0; i < 105; i++) result.current.onLocationUpdate(mockCoords(i, i));
    });
    expect(result.current.locationHistory.length).toBeLessThanOrEqual(100);
  });

  it('clearHistory empties locationHistory and lastLocation', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    act(() => result.current.onLocationUpdate(mockCoords(1, 2)));
    act(() => result.current.clearHistory());
    expect(result.current.locationHistory).toHaveLength(0);
    expect(result.current.lastLocation).toBeNull();
  });

  it('uses default config values', () => {
    const { result } = renderHook(() => useBackgroundLocation());
    expect(result.current.config.distanceFilter).toBe(10);
    expect(result.current.config.interval).toBe(30000);
  });

  it('merges custom config', () => {
    const { result } = renderHook(() => useBackgroundLocation({ distanceFilter: 50 }));
    expect(result.current.config.distanceFilter).toBe(50);
    expect(result.current.config.interval).toBe(30000);
  });
});
