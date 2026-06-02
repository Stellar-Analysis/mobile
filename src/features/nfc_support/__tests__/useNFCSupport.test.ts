import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNFCSupport } from '../useNFCSupport';

jest.useFakeTimers();

describe('useNFCSupport', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('initializes support and loading state', async () => {
    const { result } = renderHook(() => useNFCSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.cachedResults).toEqual([]);
  });

  it('runs and caches a tap to pay session', async () => {
    const { result } = renderHook(() => useNFCSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startSession('tap_to_pay');
    });
    expect(result.current.isScanning).toBe(true);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(result.current.lastResult?.mode).toBe('tap_to_pay');
    });

    expect(result.current.cachedResults).toHaveLength(1);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('stops an active session', async () => {
    const { result } = renderHook(() => useNFCSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startSession('hardware_authentication');
      result.current.stopSession();
    });

    expect(result.current.isScanning).toBe(false);
  });
});
