import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Contact, ContactsState, MOCK_CONTACTS } from '../features/contacts_integration';

const CONTACTS_CACHE_KEY = 'contacts-integration-cache';

export interface UseContactsIntegration extends Omit<ContactsState, 'selectedIds'> {
  selectedIds: string[];
  requestPermission: () => Promise<void>;
  loadContacts: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  shareWithSelected: () => void;
}

async function loadCachedContacts(): Promise<Contact[]> {
  try {
    const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Contact[]) : MOCK_CONTACTS;
  } catch {
    return MOCK_CONTACTS;
  }
}

async function cacheContacts(contacts: Contact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(contacts));
  } catch {
    // best effort
  }
}

async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission',
        message: 'This app needs access to your contacts for sharing.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

function filterContacts(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return contacts;
  const lower = query.toLowerCase();
  return contacts.filter(
    c =>
      c.name.toLowerCase().includes(lower) ||
      c.emails?.some(e => e.toLowerCase().includes(lower)) ||
      c.phoneNumbers?.some(p => p.includes(query)),
  );
}

export function useContactsIntegration(): UseContactsIntegration {
  const [permissionStatus, setPermissionStatus] = useState<ContactsState['permissionStatus']>('not_requested');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQueryState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      const netState = await NetInfo.fetch();
      if (active) {
        setIsOffline(!netState.isConnected || netState.isInternetReachable === false);
      }
      const cached = await loadCachedContacts();
      if (active) {
        setContacts(cached);
        setFilteredContacts(cached);
      }
    }

    void init();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const granted = await requestContactsPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) {
        setError('Contacts permission denied. Enable it in Settings to access contacts.');
      }
    } catch (err) {
      setPermissionStatus('unavailable');
      setError(err instanceof Error ? err.message : 'Failed to request contacts permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      setError('Contacts permission is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cached = await loadCachedContacts();
      setContacts(cached);
      setFilteredContacts(filterContacts(cached, searchQuery));
      await cacheContacts(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, [permissionStatus, searchQuery]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setFilteredContacts(prev => filterContacts(contacts, query));
  }, [contacts]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const shareWithSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      setError('No contacts selected for sharing.');
      return;
    }
    setError(null);
    // Sharing handled by the calling screen/flow
  }, [selectedIds]);

  return {
    permissionStatus,
    contacts,
    filteredContacts,
    selectedIds: Array.from(selectedIds),
    searchQuery,
    loading,
    error,
    isOffline,
    requestPermission,
    loadContacts,
    setSearchQuery,
    toggleSelection,
    clearSelection,
    shareWithSelected,
  };
}
