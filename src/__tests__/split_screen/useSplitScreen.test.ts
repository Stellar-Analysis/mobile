import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useSplitScreen } from '../../hooks/useSplitScreen';

function mockDims(windowWidth: number, screenWidth: number) {
  jest.spyOn(Dimensions, 'get').mockImplementation((dim) => {
    const base = { height: 1024, scale: 2, fontScale: 1 };
    return dim === 'window' ? { ...base, width: windowWidth } : { ...base, width: screenWidth };
  });
}

describe('useSplitScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('mode is full when window = screen width', () => {
    mockDims(1024, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.mode).toBe('full');
    expect(result.current.isActive).toBe(false);
  });

  it('mode is half when ~50% of screen', () => {
    mockDims(512, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.mode).toBe('half');
    expect(result.current.isActive).toBe(true);
  });

  it('mode is two-thirds when ~67% of screen', () => {
    mockDims(680, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.mode).toBe('two-thirds');
  });

  it('mode is one-third when ~33% of screen', () => {
    mockDims(320, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.mode).toBe('one-third');
  });

  it('mode is slide-over when very narrow', () => {
    mockDims(280, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.mode).toBe('slide-over');
    expect(result.current.isSlideOver).toBe(true);
  });

  it('paneBWidth = screenWidth - windowWidth', () => {
    mockDims(512, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.paneBWidth).toBe(512);
  });

  it('getPaneAFlex returns 2 in two-thirds mode', () => {
    mockDims(680, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.getPaneAFlex()).toBe(2);
  });

  it('getPaneBFlex returns 0 in full mode', () => {
    mockDims(1024, 1024);
    const { result } = renderHook(() => useSplitScreen());
    expect(result.current.getPaneBFlex()).toBe(0);
  });

  it('mode is full when windowWidth below minPaneWidth', () => {
    mockDims(200, 1024);
    const { result } = renderHook(() => useSplitScreen({ minPaneWidth: 320 }));
    expect(result.current.mode).toBe('full');
  });
});
