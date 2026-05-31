export type TabletLayout = 'single' | 'split' | 'master-detail';

export interface TabletConfig {
  layout: TabletLayout;
  breakpoint: number;
  sidebarWidth: number;
  contentMaxWidth?: number;
}

export interface TabletState {
  isTablet: boolean;
  layout: TabletLayout;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
  config: TabletConfig;
}
