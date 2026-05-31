export type SplitMode =
  | 'full'
  | 'half'
  | 'one-third'
  | 'two-thirds'
  | 'slide-over';

export type SplitOrientation = 'horizontal' | 'vertical';

export interface SplitScreenConfig {
  minPaneWidth: number;
  defaultSplit: SplitMode;
  orientation: SplitOrientation;
  resizable: boolean;
}

export interface SplitScreenState {
  mode: SplitMode;
  isActive: boolean;
  paneAWidth: number;
  paneBWidth: number;
  totalWidth: number;
  orientation: SplitOrientation;
}
