import { renderHook, act } from '@testing-library/react-native';
import { useShaketoRefresh } from '../../features/shake_to_refresh/useShaketoRefresh';

describe('useShaketoRefresh', () => {
  it('is supported on iOS and Android', () => {
    const { result } = renderHook(() => useShaketoRefresh());
    expect(result.current.supported).toBe(true);
  });

  it('starts with zero shake count', () => {
    const { result } = renderHook(() => useShaketoRefresh());
    expect(result.current.shakeCount).toBe(0);
    expect(result.current.lastShakeAt).toBeNull();
  });

  it('calls onRefresh when triggerRefresh is invoked', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShaketoRefresh(onRefresh));
    await act(async () => { await result.current.triggerRefresh(); });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('sets error when onRefresh throws', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useShaketoRefresh(onRefresh));
    await act(async () => { await result.current.triggerRefresh(); });
    expect(result.current.error).toBe('Network error');
  });

  it('resets state on reset()', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useShaketoRefresh(onRefresh));
    await act(async () => { await result.current.triggerRefresh(); });
    act(() => { result.current.reset(); });
    expect(result.current.error).toBeNull();
    expect(result.current.shakeCount).toBe(0);
  });
});
