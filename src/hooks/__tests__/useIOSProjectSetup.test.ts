import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useIOSProjectSetup } from '../useIOSProjectSetup';

describe('useIOSProjectSetup', () => {
  afterEach(() => jest.clearAllMocks());

  it('starts in checking status', () => {
    const { result } = renderHook(() => useIOSProjectSetup());
    expect(result.current.status).toBe('checking');
  });

  it('transitions to ready after mount', async () => {
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('reports correct platform on Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.isIOS).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('marks iOS 14 as supported', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('14.0');
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.isIOS).toBe(true);
    expect(result.current.isSupported).toBe(true);
  });

  it('marks iOS 13 as unsupported', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('13.0');
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.isSupported).toBe(false);
  });

  it('recheck() resets status to checking then ready', async () => {
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.recheck());
    expect(result.current.status).toBe('checking');

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('exposes osVersion as a string', async () => {
    const { result } = renderHook(() => useIOSProjectSetup());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(typeof result.current.osVersion).toBe('string');
  });
});
