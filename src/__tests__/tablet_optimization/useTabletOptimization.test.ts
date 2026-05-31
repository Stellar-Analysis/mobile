import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useTabletOptimization } from '../../hooks/useTabletOptimization';

const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 2, fontScale: 1 });
};

describe('useTabletOptimization', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns isTablet=false for phone width (375dp)', () => {
    mockDimensions(375, 812);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.isTablet).toBe(false);
    expect(result.current.layout).toBe('single');
  });

  it('returns isTablet=true for iPad portrait (768dp)', () => {
    mockDimensions(768, 1024);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.isTablet).toBe(true);
  });

  it('layout is split on tablet portrait', () => {
    mockDimensions(768, 1024);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.layout).toBe('split');
  });

  it('layout is master-detail on tablet landscape', () => {
    mockDimensions(1024, 768);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.layout).toBe('master-detail');
  });

  it('getColumnCount returns 1 on phone', () => {
    mockDimensions(375, 812);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.getColumnCount()).toBe(1);
  });

  it('getColumnCount returns 3 on tablet landscape', () => {
    mockDimensions(1024, 768);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.getColumnCount()).toBe(3);
  });

  it('getColumnCount returns 2 on tablet portrait', () => {
    mockDimensions(768, 1024);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.getColumnCount()).toBe(2);
  });

  it('getSidebarWidth returns 0 on phone', () => {
    mockDimensions(375, 812);
    const { result } = renderHook(() => useTabletOptimization());
    expect(result.current.getSidebarWidth()).toBe(0);
  });

  it('getSidebarWidth returns config.sidebarWidth on tablet', () => {
    mockDimensions(768, 1024);
    const { result } = renderHook(() => useTabletOptimization({ sidebarWidth: 280 }));
    expect(result.current.getSidebarWidth()).toBe(280);
  });

  it('respects custom breakpoint', () => {
    mockDimensions(600, 900);
    const { result } = renderHook(() => useTabletOptimization({ breakpoint: 600 }));
    expect(result.current.isTablet).toBe(true);
  });
});
