import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export type GestureAction = 'swipe-left' | 'swipe-right' | 'double-tap' | 'long-press' | 'tap';

const SWIPE_THRESHOLD = 90;
const DOUBLE_TAP_MS = 300;
const LONG_PRESS_MS = 650;

export const GESTURE_LABELS: Record<GestureAction, string> = {
  'swipe-left': 'Swipe left',
  'swipe-right': 'Swipe right',
  'double-tap': 'Double tap',
  'long-press': 'Long press',
  tap: 'Tap',
};

export function getGestureLabel(action: GestureAction): string {
  return GESTURE_LABELS[action] ?? 'Unknown gesture';
}

export function isSwipeGesture(dx: number, dy: number): boolean {
  return Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD / 2;
}

export interface UseGestureControlsResult {
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
  lastGesture: GestureAction | null;
  gestureCount: number;
  isOffline: boolean;
  loading: boolean;
  error: string | null;
}

export function useGestureControls(): UseGestureControlsResult {
  const netInfo = useNetInfo();
  const [isOffline, setIsOffline] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureAction | null>(null);
  const [gestureCount, setGestureCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTap = useRef<number>(0);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsOffline(!(netInfo.isConnected && netInfo.isInternetReachable));
  }, [netInfo]);

  const handleGesture = useCallback(async (gesture: GestureAction) => {
    setLoading(true);
    setError(null);

    try {
      if (!gesture) {
        throw new Error('Gesture action is not recognized.');
      }

      await new Promise(resolve =>
        setTimeout(resolve, Platform.select({ ios: 120, android: 140, default: 100 }) ?? 120)
      );

      setGestureCount(current => current + 1);
      setLastGesture(gesture);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gesture handling failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          longPressTimer.current = setTimeout(() => handleGesture('long-press'), LONG_PRESS_MS);
        },
        onPanResponderMove: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 15 || Math.abs(gestureState.dy) > 15) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          if (isSwipeGesture(gestureState.dx, gestureState.dy)) {
            return handleGesture(gestureState.dx > 0 ? 'swipe-right' : 'swipe-left');
          }

          const now = Date.now();
          if (lastTap.current && now - lastTap.current <= DOUBLE_TAP_MS) {
            if (doubleTapTimer.current) {
              clearTimeout(doubleTapTimer.current);
              doubleTapTimer.current = null;
            }
            lastTap.current = 0;
            return handleGesture('double-tap');
          }

          lastTap.current = now;
          doubleTapTimer.current = setTimeout(() => {
            handleGesture('tap');
            lastTap.current = 0;
            doubleTapTimer.current = null;
          }, DOUBLE_TAP_MS);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        },
      }),
    [handleGesture]
  );

  useEffect(
    () => () => {
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    },
    []
  );

  return {
    panHandlers: panResponder.panHandlers,
    lastGesture,
    gestureCount,
    isOffline,
    loading,
    error,
  };
}
