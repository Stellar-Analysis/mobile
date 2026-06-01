export interface AppClip {
  id: string;
  url: string;
  title: string;
  launchedAt: string;
  status: 'success' | 'failed';
}

export const DEFAULT_APP_CLIPS: AppClip[] = [];
