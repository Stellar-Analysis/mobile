import { renderHook, act } from '@testing-library/react-native';
import { useARFeatures } from '../../hooks/useARFeatures';
import type { ARMarker } from '../../features/ar_features/types';

const makeMarker = (id: string): ARMarker => ({
  id,
  type: 'price_ticker',
  label: 'XLM/USD',
  value: '0.12',
  screenPos: { x: 100, y: 200 },
  visible: true,
});

describe('useARFeatures', () => {
  it('initialises with not_requested permission and session inactive', () => {
    const { result } = renderHook(() => useARFeatures());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.markers).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('addMarker adds a marker', () => {
    const { result } = renderHook(() => useARFeatures());
    act(() => result.current.addMarker(makeMarker('m1')));
    expect(result.current.markers).toHaveLength(1);
    expect(result.current.markers[0].id).toBe('m1');
  });

  it('addMarker ignores duplicate ids', () => {
    const { result } = renderHook(() => useARFeatures());
    act(() => result.current.addMarker(makeMarker('m1')));
    act(() => result.current.addMarker(makeMarker('m1')));
    expect(result.current.markers).toHaveLength(1);
  });

  it('removeMarker removes a marker by id', () => {
    const { result } = renderHook(() => useARFeatures());
    act(() => result.current.addMarker(makeMarker('m1')));
    act(() => result.current.removeMarker('m1'));
    expect(result.current.markers).toHaveLength(0);
  });

  it('updateMarker updates marker fields', () => {
    const { result } = renderHook(() => useARFeatures());
    act(() => result.current.addMarker(makeMarker('m1')));
    act(() => result.current.updateMarker('m1', { value: '0.99' }));
    expect(result.current.markers[0].value).toBe('0.99');
  });

  it('clearMarkers empties all markers', () => {
    const { result } = renderHook(() => useARFeatures());
    act(() => result.current.addMarker(makeMarker('m1')));
    act(() => result.current.addMarker(makeMarker('m2')));
    act(() => result.current.clearMarkers());
    expect(result.current.markers).toHaveLength(0);
  });

  it('respects maxMarkers config', () => {
    const { result } = renderHook(() => useARFeatures({ maxMarkers: 2 }));
    act(() => result.current.addMarker(makeMarker('m1')));
    act(() => result.current.addMarker(makeMarker('m2')));
    act(() => result.current.addMarker(makeMarker('m3')));
    expect(result.current.markers).toHaveLength(2);
  });

  it('uses default config values', () => {
    const { result } = renderHook(() => useARFeatures());
    expect(result.current.config.maxMarkers).toBe(20);
    expect(result.current.config.markerTTL).toBe(30000);
    expect(result.current.config.overlayOnly).toBe(true);
  });

  it('merges custom config', () => {
    const { result } = renderHook(() => useARFeatures({ maxMarkers: 5 }));
    expect(result.current.config.maxMarkers).toBe(5);
    expect(result.current.config.overlayOnly).toBe(true);
  });
});
