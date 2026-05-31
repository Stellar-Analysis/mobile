export interface QuickActionRecord {
  id: string;
  title: string;
  icon: string;
  route: string;
  createdAt: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickActionRecord[] = [
  { id: 'dashboard', title: 'Dashboard', icon: 'chart', route: 'Dashboard', createdAt: '' },
  { id: 'anchors', title: 'Anchors', icon: 'anchor', route: 'Anchors', createdAt: '' },
  { id: 'corridors', title: 'Corridors', icon: 'route', route: 'Corridors', createdAt: '' },
];
