import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { use3DTouchSupport } from '../../features/3d_touch_support/use3DTouchSupport';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
}));

describe('use3DTouchSupport', () => {
  it('reports supported on iOS', () => {
    const { result } = renderHook(() => use3DTouchSupport());
    expect(result.current.supported).toBe(true);
  });

  it('returns default touch actions', () => {
    const { result } = renderHook(() => use3DTouchSupport());
    expect(result.current.actions.length).toBeGreaterThan(0);
  });

  it('records force on press', async () => {
    const { result } = renderHook(() => use3DTouchSupport());
    const mockEvt = { nativeEvent: { force: 0.6, locationX: 50, locationY: 80 } } as any;
    await act(async () => { result.current.handlePress(mockEvt); });
    expect(result.current.lastForce).toBeCloseTo(0.6);
    expect(result.current.error).toBeNull();
  });

  it('clamps force to max 1', async () => {
    const { result } = renderHook(() => use3DTouchSupport());
    const mockEvt = { nativeEvent: { force: 2.0, locationX: 0, locationY: 0 } } as any;
    await act(async () => { result.current.handlePress(mockEvt); });
    expect(result.current.lastForce).toBeLessThanOrEqual(1);
  });

  it('starts with no error and no force', () => {
    const { result } = renderHook(() => use3DTouchSupport());
    expect(result.current.error).toBeNull();
    expect(result.current.lastForce).toBeNull();
  });
});
