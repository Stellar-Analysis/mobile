export interface LiveActivity {
  id: string;
  title: string;
  subtitle: string;
  startedAt: string;
  status: 'active' | 'ended';
}

export const DEFAULT_LIVE_ACTIVITIES: LiveActivity[] = [];
