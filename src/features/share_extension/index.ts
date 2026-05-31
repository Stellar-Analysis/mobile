export interface SharedItemRecord {
  id: string;
  title: string;
  content: string;
  mimeType: string;
  sourceApp: string;
  receivedAt: string;
}

export const SUPPORTED_MIME_TYPES = ['text/plain', 'text/uri-list', 'application/json'];
