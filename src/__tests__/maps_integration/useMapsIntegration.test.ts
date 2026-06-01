import { renderHook, act } from '@testing-library/react-native';
import { useMapsIntegration } from '../../hooks/useMapsIntegration';

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
      PERMISSIONS: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
      RESULTS: { GRANTED: 'granted' },
    },
  };
});

global.navigator = {
  ...global.navigator,
  geolocation: {
    getCurrentPosition: jest.fn((success) =>
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } }),
    ),
  },
};

describe('useMapsIntegration', () => {
  it('initialises with not_requested permission and no location', () => {
    const { result } = renderHook(() => useMapsIntegration());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.markers).toHaveLength(0);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('requestPermission sets status to granted on iOS', async () => {
    const { result } = renderHook(() => useMapsIntegration());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.error).toBeNull();
  });

  it('getCurrentLocation requires permission first', async () => {
    const { result } = renderHook(() => useMapsIntegration());
    await act(async () => {
      await result.current.getCurrentLocation();
    });
    expect(result.current.error).toBe('Location permission is required.');
  });

  it('getCurrentLocation sets currentLocation after permission granted', async () => {
    const { result } = renderHook(() => useMapsIntegration());
    await act(async () => {
      await result.current.requestPermission();
    });
    await act(async () => {
      await result.current.getCurrentLocation();
    });
    expect(result.current.currentLocation).not.toBeNull();
    expect(result.current.currentLocation?.latitude).toBe(37.7749);
    expect(result.current.currentLocation?.longitude).toBe(-122.4194);
  });

  it('addMarker adds a marker to the list', async () => {
    const { result } = renderHook(() => useMapsIntegration());
    act(() => {
      result.current.addMarker({ latitude: 40.7128, longitude: -74.006, title: 'NYC' });
    });
    expect(result.current.markers).toHaveLength(1);
    expect(result.current.markers[0].title).toBe('NYC');
  });

  it('addMarker can add multiple markers', () => {
    const { result } = renderHook(() => useMapsIntegration());
    act(() => {
      result.current.addMarker({ latitude: 1, longitude: 2 });
      result.current.addMarker({ latitude: 3, longitude: 4 });
    });
    expect(result.current.markers).toHaveLength(2);
  });

  it('clearMarkers empties the markers list', () => {
    const { result } = renderHook(() => useMapsIntegration());
    act(() => {
      result.current.addMarker({ latitude: 1, longitude: 2 });
      result.current.clearMarkers();
    });
    expect(result.current.markers).toHaveLength(0);
  });

  it('reflects offline state when network is down', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => useMapsIntegration());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isOffline).toBe(true);
  });
});
