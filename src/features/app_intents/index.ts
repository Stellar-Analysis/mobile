export interface AppIntentRecord {
  id: string;
  name: string;
  parameters: Record<string, string>;
  executedAt: string;
  status: 'success' | 'failed';
}

export const DEFAULT_INTENTS: AppIntentRecord[] = [];
