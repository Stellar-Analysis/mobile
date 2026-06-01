import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWidgetSupport } from '../../features/widget_support/useWidgetSupport';

describe('useWidgetSupport', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });

  it('loads default widgets', async () => {
    const { result } = renderHook(() => useWidgetSupport());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.supported).toBe(true);
    expect(result.current.widgets.length).toBeGreaterThan(0);
  });

  it('refreshes widgets with updated timestamps', async () => {
    const { result } = renderHook(() => useWidgetSupport());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.widgets[0].updatedAt).not.toBe('');
  });

  it('adds a new widget', async () => {
    const { result } = renderHook(() => useWidgetSupport());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.widgets.length;
    await act(async () => {
      await result.current.addWidget({ id: 'test', title: 'Test', kind: 'small', route: 'Test' });
    });
    expect(result.current.widgets.length).toBe(before + 1);
  });

  it('removes a widget by id', async () => {
    const { result } = renderHook(() => useWidgetSupport());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const idToRemove = result.current.widgets[0].id;
    await act(async () => { await result.current.removeWidget(idToRemove); });
    expect(result.current.widgets.find(w => w.id === idToRemove)).toBeUndefined();
  });

  it('returns no error on successful operations', async () => {
    const { result } = renderHook(() => useWidgetSupport());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
