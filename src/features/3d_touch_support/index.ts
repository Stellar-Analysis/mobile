export interface TouchAction {
  id: string;
  title: string;
  subtitle: string;
  type: 'peek' | 'pop' | 'quick-action';
}

export const DEFAULT_TOUCH_ACTIONS: TouchAction[] = [
  { id: 'dashboard', title: 'Open Dashboard', subtitle: 'View analytics', type: 'quick-action' },
  { id: 'anchors', title: 'View Anchors', subtitle: 'Browse anchors', type: 'peek' },
  { id: 'corridors', title: 'View Corridors', subtitle: 'Browse corridors', type: 'peek' },
];
