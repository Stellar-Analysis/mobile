import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type {
  ARFeaturesConfig,
  ARFeaturesState,
  ARMarker,
  ARPermissionStatus,
} from '../features/ar_features/types';

const DEFAULT_CONFIG: ARFeaturesConfig = {
  planeDetection: false,
  overlayOnly: true,
  maxMarkers: 20,
  markerTTL: 30000,
};

const INITIAL_STATE: ARFeaturesState = {
  permissionStatus: 'not_requested',
  isSessionActive: false,
  markers: [],
  error: null,
  isLoading: false,
  isSupported: false,
};

export function useARFeatures(config: Partial<ARFeaturesConfig> = {}) {
  const mergedConfig: ARFeaturesConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<ARFeaturesState>(INITIAL_STATE);
  const markerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // ARKit: iOS 11+, ARCore: Android 7.0+ (API 24)
    const supported = Platform.select({
      ios: parseFloat(Platform.Version as string) >= 11,
      android: parseInt(Platform.Version as string, 10) >= 24,
      default: false,
    }) ?? false;
    setState(s => ({ ...s, isSupported: !!supported }));
  }, []);

  useEffect(() => {
    return () => { markerTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  const requestPermission = useCallback(async (): Promise<ARPermissionStatus> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      // Wire to expo-camera or react-native-permissions:
      // const { status } = await Camera.requestCameraPermissionsAsync();
      const status: ARPermissionStatus = 'granted';
      setState(s => ({ ...s, permissionStatus: status, isLoading: false }));
      return status;
    } catch (err: any) {
      const error = err?.message ?? 'Camera permission request failed';
      setState(s => ({ ...s, error, isLoading: false, permissionStatus: 'denied' }));
      return 'denied';
    }
  }, []);

  const startSession = useCallback(async () => {
    if (state.isSessionActive) return;
    let permission = state.permissionStatus;
    if (permission !== 'granted') {
      permission = await requestPermission();
    }
    if (permission !== 'granted') return;
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      // Wire to ViroReact ViroARSceneNavigator or expo-camera
      setState(s => ({ ...s, isSessionActive: true, isLoading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err?.message ?? 'Failed to start AR session', isLoading: false }));
    }
  }, [state.isSessionActive, state.permissionStatus, requestPermission]);

  const stopSession = useCallback(() => {
    markerTimers.current.forEach(t => clearTimeout(t));
    markerTimers.current.clear();
    setState(s => ({ ...s, isSessionActive: false, markers: [] }));
  }, []);

  const addMarker = useCallback((marker: ARMarker) => {
    setState(s => {
      if (s.markers.length >= mergedConfig.maxMarkers) return s;
      const exists = s.markers.find(m => m.id === marker.id);
      if (exists) return s;
      return { ...s, markers: [...s.markers, marker] };
    });

    // Schedule TTL removal
    const timer = setTimeout(() => {
      setState(s => ({ ...s, markers: s.markers.filter(m => m.id !== marker.id) }));
      markerTimers.current.delete(marker.id);
    }, mergedConfig.markerTTL);
    markerTimers.current.set(marker.id, timer);
  }, [mergedConfig.maxMarkers, mergedConfig.markerTTL]);

  const removeMarker = useCallback((id: string) => {
    const timer = markerTimers.current.get(id);
    if (timer) { clearTimeout(timer); markerTimers.current.delete(id); }
    setState(s => ({ ...s, markers: s.markers.filter(m => m.id !== id) }));
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<ARMarker>) => {
    setState(s => ({
      ...s,
      markers: s.markers.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, []);

  const clearMarkers = useCallback(() => {
    markerTimers.current.forEach(t => clearTimeout(t));
    markerTimers.current.clear();
    setState(s => ({ ...s, markers: [] }));
  }, []);

  return {
    ...state,
    config: mergedConfig,
    requestPermission,
    startSession,
    stopSession,
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
  };
}
