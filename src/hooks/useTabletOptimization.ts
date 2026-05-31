import { useState, useEffect, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import type { TabletConfig, TabletLayout, TabletState } from '../features/tablet_optimization/types';

const DEFAULT_CONFIG: TabletConfig = {
  layout: 'single',
  breakpoint: 768,
  sidebarWidth: 320,
  contentMaxWidth: 960,
};

function computeState(dims: ScaledSize, config: TabletConfig): TabletState {
  const { width, height } = dims;
  const isTablet = width >= config.breakpoint;
  const isLandscape = width > height;
  let layout: TabletLayout = 'single';
  if (isTablet) {
    layout = isLandscape ? 'master-detail' : 'split';
  }
  return { isTablet, layout, screenWidth: width, screenHeight: height, isLandscape, config };
}

export function useTabletOptimization(config: Partial<TabletConfig> = {}) {
  const mergedConfig: TabletConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<TabletState>(() =>
    computeState(Dimensions.get('window'), mergedConfig),
  );

  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) => {
      setState(computeState(window, mergedConfig));
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub?.remove();
  }, [mergedConfig.breakpoint, mergedConfig.sidebarWidth]);

  const getColumnCount = useCallback((): number => {
    if (!state.isTablet) return 1;
    return state.isLandscape ? 3 : 2;
  }, [state.isTablet, state.isLandscape]);

  const getSidebarWidth = useCallback((): number => {
    return state.isTablet ? mergedConfig.sidebarWidth : 0;
  }, [state.isTablet, mergedConfig.sidebarWidth]);

  return { ...state, getColumnCount, getSidebarWidth };
}
