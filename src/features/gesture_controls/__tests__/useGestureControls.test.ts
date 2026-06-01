import { getGestureLabel, isSwipeGesture } from '../useGestureControls';

describe('useGestureControls helpers', () => {
  it('returns a readable label for each gesture', () => {
    expect(getGestureLabel('swipe-left')).toBe('Swipe left');
    expect(getGestureLabel('swipe-right')).toBe('Swipe right');
    expect(getGestureLabel('double-tap')).toBe('Double tap');
    expect(getGestureLabel('long-press')).toBe('Long press');
    expect(getGestureLabel('tap')).toBe('Tap');
  });

  it('recognizes swipes based on dx and dy values', () => {
    expect(isSwipeGesture(100, 10)).toBe(true);
    expect(isSwipeGesture(-120, 5)).toBe(true);
    expect(isSwipeGesture(50, 5)).toBe(false);
    expect(isSwipeGesture(100, 80)).toBe(false);
  });
});
