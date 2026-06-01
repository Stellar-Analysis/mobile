export interface WidgetConfig {
  id: string;
  title: string;
  kind: 'small' | 'medium' | 'large';
  route: string;
  updatedAt: string;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'dashboard', title: 'Dashboard', kind: 'medium', route: 'Dashboard', updatedAt: '' },
  { id: 'anchors', title: 'Anchors', kind: 'small', route: 'Anchors', updatedAt: '' },
  { id: 'corridors', title: 'Corridors', kind: 'small', route: 'Corridors', updatedAt: '' },
];
