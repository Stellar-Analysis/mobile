import { useState, useEffect, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import type { SplitMode, SplitScreenConfig, SplitScreenState } from '../features/split_screen/types';

const DEFAULT_CONFIG: SplitScreenConfig = {
  minPaneWidth: 320,
  defaultSplit: 'half',
  orientation: 'horizontal',
  resizable: false,
};

function detectMode(windowWidth: number, screenWidth: number, config: SplitScreenConfig): SplitMode {
  if (windowWidth < config.minPaneWidth) return 'full';
  const ratio = windowWidth / screenWidth;
  if (ratio >= 0.95) return 'full';
  if (ratio >= 0.60) return 'two-thirds';
  if (ratio >= 0.45) return 'half';
  if (ratio >= 0.30) return 'one-third';
  return 'slide-over';
}

function computeState(window: ScaledSize, screen: ScaledSize, config: SplitScreenConfig): SplitScreenState {
  const mode = detectMode(window.width, screen.width, config);
  return {
    mode,
    isActive: mode !== 'full',
    paneAWidth: window.width,
    paneBWidth: Math.max(0, screen.width - window.width),
    totalWidth: screen.width,
    orientation: config.orientation,
  };
}

export function useSplitScreen(config: Partial<SplitScreenConfig> = {}) {
  const mergedConfig: SplitScreenConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<SplitScreenState>(() =>
    computeState(Dimensions.get('window'), Dimensions.get('screen'), mergedConfig),
  );

  useEffect(() => {
    const handler = ({ window, screen }: { window: ScaledSize; screen: ScaledSize }) => {
      setState(computeState(window, screen, mergedConfig));
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub?.remove();
  }, [mergedConfig.minPaneWidth]);

  const getPaneAFlex = useCallback((): number => {
    switch (state.mode) {
      case 'two-thirds': return 2;
      case 'half': return 1;
      case 'one-third': return 1;
      case 'slide-over': return 0;
      default: return 1;
    }
  }, [state.mode]);

  const getPaneBFlex = useCallback((): number => {
    switch (state.mode) {
      case 'two-thirds': return 1;
      case 'half': return 1;
      case 'one-third': return 2;
      case 'slide-over': return 3;
      default: return 0;
    }
  }, [state.mode]);

  return {
    ...state,
    getPaneAFlex,
    getPaneBFlex,
    isSplitActive: state.isActive,
    isSlideOver: state.mode === 'slide-over',
  };
}
