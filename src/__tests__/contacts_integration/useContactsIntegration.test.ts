import { renderHook, act } from '@testing-library/react-native';
import { useContactsIntegration } from '../../hooks/useContactsIntegration';
import { MOCK_CONTACTS } from '../../features/contacts_integration';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => () => {}),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: { OS: 'ios' },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      PERMISSIONS: { READ_CONTACTS: 'android.permission.READ_CONTACTS' },
      RESULTS: { GRANTED: 'granted' },
    },
  };
});

describe('useContactsIntegration', () => {
  it('initialises with not_requested permission and empty state', () => {
    const { result } = renderHook(() => useContactsIntegration());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.selectedIds).toHaveLength(0);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('requestPermission sets status to granted on iOS', async () => {
    const { result } = renderHook(() => useContactsIntegration());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.error).toBeNull();
  });

  it('loadContacts requires permission', async () => {
    const { result } = renderHook(() => useContactsIntegration());
    await act(async () => {
      await result.current.loadContacts();
    });
    expect(result.current.error).toBe('Contacts permission is required.');
  });

  it('setSearchQuery filters contacts by name', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(MOCK_CONTACTS));
    const { result } = renderHook(() => useContactsIntegration());
    await act(async () => { await Promise.resolve(); });

    act(() => {
      result.current.setSearchQuery('Alice');
    });
    expect(result.current.filteredContacts.length).toBe(1);
    expect(result.current.filteredContacts[0].name).toBe('Alice Johnson');
  });

  it('setSearchQuery with empty string shows all contacts', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(MOCK_CONTACTS));
    const { result } = renderHook(() => useContactsIntegration());
    await act(async () => { await Promise.resolve(); });

    act(() => {
      result.current.setSearchQuery('Alice');
      result.current.setSearchQuery('');
    });
    expect(result.current.filteredContacts.length).toBe(MOCK_CONTACTS.length);
  });

  it('toggleSelection adds contact id', () => {
    const { result } = renderHook(() => useContactsIntegration());
    act(() => {
      result.current.toggleSelection('1');
    });
    expect(result.current.selectedIds).toContain('1');
  });

  it('toggleSelection removes already-selected id', () => {
    const { result } = renderHook(() => useContactsIntegration());
    act(() => {
      result.current.toggleSelection('1');
      result.current.toggleSelection('1');
    });
    expect(result.current.selectedIds).not.toContain('1');
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useContactsIntegration());
    act(() => {
      result.current.toggleSelection('1');
      result.current.toggleSelection('2');
      result.current.clearSelection();
    });
    expect(result.current.selectedIds).toHaveLength(0);
  });

  it('shareWithSelected errors when nothing is selected', () => {
    const { result } = renderHook(() => useContactsIntegration());
    act(() => {
      result.current.shareWithSelected();
    });
    expect(result.current.error).toBe('No contacts selected for sharing.');
  });

  it('shareWithSelected clears error when contacts are selected', () => {
    const { result } = renderHook(() => useContactsIntegration());
    act(() => {
      result.current.toggleSelection('1');
      result.current.shareWithSelected();
    });
    expect(result.current.error).toBeNull();
  });

  it('reflects offline state', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => useContactsIntegration());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOffline).toBe(true);
  });
});
