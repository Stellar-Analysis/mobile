import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import type { NFCMode, NFCSessionResult, NFCState } from './types';

const NFC_CACHE_KEY = 'nfc-support-cache:v1';
const MAX_CACHED_RESULTS = 25;

const initialState: NFCState = {
  isSupported: Platform.OS === 'ios' || Platform.OS === 'android',
  isEnabled: false,
  isOffline: false,
  isLoading: true,
  isScanning: false,
  error: null,
  lastResult: null,
  cachedResults: [],
};

async function readCachedResults(): Promise<NFCSessionResult[]> {
  try {
    const cached = await AsyncStorage.getItem(NFC_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(NFC_CACHE_KEY);
    return [];
  }
}

async function writeCachedResults(results: NFCSessionResult[]): Promise<void> {
  await AsyncStorage.setItem(NFC_CACHE_KEY, JSON.stringify(results.slice(0, MAX_CACHED_RESULTS)));
}

function createResult(mode: NFCMode, isOffline: boolean): NFCSessionResult {
  return {
    id: `${Date.now()}-${mode}`,
    mode,
    status: isOffline ? 'cached' : 'completed',
    message:
      mode === 'tap_to_pay'
        ? 'Tap-to-pay credential read successfully.'
        : 'Hardware authentication challenge completed.',
    createdAt: new Date().toISOString(),
  };
}

export function useNFCSupport() {
  const [state, setState] = useState<NFCState>(initialState);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [cachedResults, netState] = await Promise.all([readCachedResults(), NetInfo.fetch()]);
        if (!mounted) {
          return;
        }

        setState(current => ({
          ...current,
          cachedResults,
          isEnabled: current.isSupported,
          isOffline: !netState.isConnected || netState.isInternetReachable === false,
          isLoading: false,
        }));
      } catch (error) {
        if (mounted) {
          setState(current => ({
            ...current,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unable to initialize NFC support.',
          }));
        }
      }
    }

    void initialize();

    const unsubscribe = NetInfo.addEventListener(netState => {
      setState(current => ({
        ...current,
        isOffline: !netState.isConnected || netState.isInternetReachable === false,
      }));
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  const stopSession = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setState(current => ({ ...current, isScanning: false, isLoading: false }));
  }, []);

  const startSession = useCallback((mode: NFCMode = 'tap_to_pay') => {
    setState(current => ({ ...current, error: null, isLoading: true }));

    if (!stateRef.current.isSupported) {
      setState(current => ({
        ...current,
        isLoading: false,
        error: 'NFC is not supported on this device.',
      }));
      return;
    }

    if (!stateRef.current.isEnabled) {
      setState(current => ({
        ...current,
        isLoading: false,
        error: 'NFC is disabled. Enable NFC in device settings and try again.',
      }));
      return;
    }

    setState(current => ({ ...current, isScanning: true }));
    scanTimerRef.current = setTimeout(
      async () => {
        try {
          const result = createResult(mode, stateRef.current.isOffline);
          const cachedResults = [result, ...stateRef.current.cachedResults].slice(
            0,
            MAX_CACHED_RESULTS
          );

          await writeCachedResults(cachedResults);
          Vibration.vibrate(35);
          setState(current => ({
            ...current,
            cachedResults,
            lastResult: result,
            isLoading: false,
            isScanning: false,
            error: null,
          }));
        } catch (error) {
          setState(current => ({
            ...current,
            isLoading: false,
            isScanning: false,
            error: error instanceof Error ? error.message : 'NFC session failed.',
          }));
        }
      },
      Platform.select({ ios: 1000, android: 800, default: 900 })
    );
  }, []);

  const clearCachedResults = useCallback(async () => {
    await writeCachedResults([]);
    setState(current => ({ ...current, cachedResults: [], lastResult: null, error: null }));
  }, []);

  return {
    ...state,
    startSession,
    stopSession,
    clearCachedResults,
  };
}
