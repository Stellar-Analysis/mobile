export interface ActionExtensionRecord {
  id: string;
  actionType: string;
  payload: string;
  status: 'pending' | 'completed' | 'failed';
  executedAt: string;
}

export const AVAILABLE_ACTIONS = [
  { type: 'analyze_anchor', label: 'Analyze Anchor' },
  { type: 'track_corridor', label: 'Track Corridor' },
  { type: 'export_data', label: 'Export Data' },
];
