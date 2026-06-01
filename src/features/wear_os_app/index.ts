export interface WearOSMessage {
  id: string;
  type: string;
  payload: Record<string, string>;
  sentAt: string;
  status: 'sent' | 'failed';
}

export const DEFAULT_WEAR_OS_MESSAGES: WearOSMessage[] = [];
