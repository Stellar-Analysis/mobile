import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { MapLocation, MapsState, DEFAULT_LOCATION } from '../features/maps_integration';

const MAPS_CACHE_KEY = 'maps-integration-cache';

export interface UseMapsIntegration extends MapsState {
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  addMarker: (marker: MapLocation) => void;
  clearMarkers: () => void;
}

async function loadCachedLocation(): Promise<MapLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(MAPS_CACHE_KEY);
    return cached ? (JSON.parse(cached) as MapLocation) : null;
  } catch {
    return null;
  }
}

async function cacheLocation(location: MapLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(MAPS_CACHE_KEY, JSON.stringify(location));
  } catch {
    // best effort
  }
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to show maps.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS permission is handled at the native level via Info.plist
  return true;
}

export function useMapsIntegration(): UseMapsIntegration {
  const [permissionStatus, setPermissionStatus] = useState<MapsState['permissionStatus']>('not_requested');
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);
  const [markers, setMarkers] = useState<MapLocation[]>([]);
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
      const cached = await loadCachedLocation();
      if (active && cached) {
        setCurrentLocation(cached);
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
      const granted = await requestLocationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) {
        setError('Location permission denied. Enable it in Settings to use maps.');
      }
    } catch (err) {
      setPermissionStatus('unavailable');
      setError(err instanceof Error ? err.message : 'Failed to request location permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      setError('Location permission is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use navigator.geolocation (available via react-native)
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const loc: MapLocation = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              title: 'Current Location',
            };
            setCurrentLocation(loc);
            void cacheLocation(loc);
            resolve();
          },
          err => reject(new Error(err.message)),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
      });
    } catch (err) {
      const fallback = await loadCachedLocation();
      if (fallback) {
        setCurrentLocation(fallback);
        setError('Using cached location — could not get current position.');
      } else {
        setCurrentLocation(DEFAULT_LOCATION);
        setError('Location unavailable. Showing default location.');
      }
    } finally {
      setLoading(false);
    }
  }, [permissionStatus]);

  const addMarker = useCallback((marker: MapLocation) => {
    setMarkers(prev => [...prev, marker]);
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  return {
    permissionStatus,
    currentLocation,
    markers,
    loading,
    error,
    isOffline,
    requestPermission,
    getCurrentLocation,
    addMarker,
    clearMarkers,
  };
}
