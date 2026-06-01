import { renderHook, act } from '@testing-library/react-native';
import { usePhotoGallery } from '../../hooks/usePhotoGallery';

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
    Platform: { OS: 'ios', Version: '16' },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      PERMISSIONS: {
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
        READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
      },
      RESULTS: { GRANTED: 'granted' },
    },
  };
});

describe('usePhotoGallery', () => {
  it('initialises with not_requested permission and empty selection', () => {
    const { result } = renderHook(() => usePhotoGallery());
    expect(result.current.permissionStatus).toBe('not_requested');
    expect(result.current.selectedIds).toHaveLength(0);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('requestPermission sets status to granted on iOS', async () => {
    const { result } = renderHook(() => usePhotoGallery());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.error).toBeNull();
  });

  it('loadPhotos requires permission', async () => {
    const { result } = renderHook(() => usePhotoGallery());
    await act(async () => {
      await result.current.loadPhotos();
    });
    expect(result.current.error).toBe('Photo library permission is required.');
  });

  it('toggleSelection adds a photo id to selection', () => {
    const { result } = renderHook(() => usePhotoGallery());
    act(() => {
      result.current.toggleSelection('1');
    });
    expect(result.current.selectedIds).toContain('1');
  });

  it('toggleSelection removes already-selected photo id', () => {
    const { result } = renderHook(() => usePhotoGallery());
    act(() => {
      result.current.toggleSelection('1');
    });
    act(() => {
      result.current.toggleSelection('1');
    });
    expect(result.current.selectedIds).not.toContain('1');
  });

  it('toggleSelection supports multi-select', () => {
    const { result } = renderHook(() => usePhotoGallery());
    act(() => {
      result.current.toggleSelection('1');
      result.current.toggleSelection('2');
      result.current.toggleSelection('3');
    });
    expect(result.current.selectedIds).toHaveLength(3);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => usePhotoGallery());
    act(() => {
      result.current.toggleSelection('1');
      result.current.toggleSelection('2');
      result.current.clearSelection();
    });
    expect(result.current.selectedIds).toHaveLength(0);
  });

  it('uploadSelected errors when nothing is selected', async () => {
    const { result } = renderHook(() => usePhotoGallery());
    await act(async () => {
      await result.current.uploadSelected();
    });
    expect(result.current.error).toBe('No photos selected for upload.');
  });

  it('uploadSelected errors when offline', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => usePhotoGallery());
    await act(async () => { await Promise.resolve(); });
    act(() => { result.current.toggleSelection('1'); });
    await act(async () => {
      await result.current.uploadSelected();
    });
    expect(result.current.error).toContain('Cannot upload while offline');
  });

  it('reflects offline state', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const { result } = renderHook(() => usePhotoGallery());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isOffline).toBe(true);
  });
});
