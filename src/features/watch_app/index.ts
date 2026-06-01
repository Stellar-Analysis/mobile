export interface WatchMessage {
  id: string;
  type: string;
  payload: Record<string, string>;
  sentAt: string;
  status: 'sent' | 'failed';
}

export const DEFAULT_WATCH_MESSAGES: WatchMessage[] = [];
