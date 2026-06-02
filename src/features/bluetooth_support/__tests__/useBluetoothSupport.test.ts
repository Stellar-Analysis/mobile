import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBluetoothSupport } from '../useBluetoothSupport';

jest.useFakeTimers();

describe('useBluetoothSupport', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('initializes support and cached devices', async () => {
    const { result } = renderHook(() => useBluetoothSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.devices).toEqual([]);
  });

  it('discovers and caches devices', async () => {
    const { result } = renderHook(() => useBluetoothSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startScan();
    });
    expect(result.current.isScanning).toBe(true);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThan(0);
    });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('pairs a discovered device', async () => {
    const { result } = renderHook(() => useBluetoothSupport());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startScan();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.pairDevice('ledger-nano-x');
    });

    expect(result.current.pairedDevice?.id).toBe('ledger-nano-x');
  });
});
