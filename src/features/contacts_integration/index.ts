export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
  thumbnailUri?: string;
}

export interface ContactsState {
  permissionStatus: 'not_requested' | 'granted' | 'denied' | 'unavailable';
  contacts: Contact[];
  filteredContacts: Contact[];
  selectedIds: Set<string>;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Alice Johnson', emails: ['alice@example.com'], phoneNumbers: ['+1-555-0101'] },
  { id: '2', name: 'Bob Smith', emails: ['bob@example.com'], phoneNumbers: ['+1-555-0102'] },
  { id: '3', name: 'Carol White', emails: ['carol@example.com'], phoneNumbers: ['+1-555-0103'] },
];
