import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useQuickActions } from '../useQuickActions';

describe('useQuickActions', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads default actions', async () => {
    const { result } = renderHook(() => useQuickActions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.actions.length).toBeGreaterThan(0);
  });

  it('refreshes actions', async () => {
    const { result } = renderHook(() => useQuickActions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshActions();
    });

    expect(result.current.actions[0].createdAt).not.toBe('');
  });

  it('pins action to top', async () => {
    const { result } = renderHook(() => useQuickActions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const lastId = result.current.actions[result.current.actions.length - 1].id;

    await act(async () => {
      await result.current.pinAction(lastId);
    });

    expect(result.current.actions[0].id).toBe(lastId);
  });
});
