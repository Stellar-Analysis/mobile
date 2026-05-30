import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  clearAll,
  getToken,
  getTokenExpiry,
  hasValidToken,
  removeToken,
  saveToken,
} from '@services/tokenStorage';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const mockSet = Keychain.setGenericPassword as jest.Mock;
const mockGet = Keychain.getGenericPassword as jest.Mock;
const mockReset = Keychain.resetGenericPassword as jest.Mock;

const EXPIRY_KEY = '@stellar-insights/token-expiry';

describe('tokenStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockSet.mockResolvedValue(true);
    mockReset.mockResolvedValue(true);
    mockGet.mockResolvedValue(false);
  });

  it('saves the token to the keychain and the expiry to async storage', async () => {
    const expiresAt = Date.now() + 60_000;
    await saveToken('my-token', expiresAt);

    expect(mockSet).toHaveBeenCalledWith('auth-token', 'my-token', {
      service: 'com.stellarinsights.auth',
    });
    await expect(AsyncStorage.getItem(EXPIRY_KEY)).resolves.toBe(
      String(expiresAt),
    );
  });

  it('clears any stale expiry when saving a token without one', async () => {
    await AsyncStorage.setItem(EXPIRY_KEY, '123');
    await saveToken('my-token');

    await expect(AsyncStorage.getItem(EXPIRY_KEY)).resolves.toBeNull();
  });

  it('returns the stored token value', async () => {
    mockGet.mockResolvedValue({ username: 'auth-token', password: 'my-token' });
    await expect(getToken()).resolves.toBe('my-token');
  });

  it('returns null when no token is stored', async () => {
    mockGet.mockResolvedValue(false);
    await expect(getToken()).resolves.toBeNull();
  });

  it('reads and parses the expiry, returning null for missing/invalid values', async () => {
    await expect(getTokenExpiry()).resolves.toBeNull();

    await AsyncStorage.setItem(EXPIRY_KEY, '987654');
    await expect(getTokenExpiry()).resolves.toBe(987654);

    await AsyncStorage.setItem(EXPIRY_KEY, 'not-a-number');
    await expect(getTokenExpiry()).resolves.toBeNull();
  });

  it('removes the token from the keychain and clears the expiry', async () => {
    await AsyncStorage.setItem(EXPIRY_KEY, '123');
    await removeToken();

    expect(mockReset).toHaveBeenCalledWith({
      service: 'com.stellarinsights.auth',
    });
    await expect(AsyncStorage.getItem(EXPIRY_KEY)).resolves.toBeNull();
  });

  it('clears all auth storage', async () => {
    await AsyncStorage.setItem(EXPIRY_KEY, '123');
    await clearAll();

    expect(mockReset).toHaveBeenCalledWith({
      service: 'com.stellarinsights.auth',
    });
    await expect(AsyncStorage.getItem(EXPIRY_KEY)).resolves.toBeNull();
  });

  describe('hasValidToken (initial-route predicate)', () => {
    it('is false when no token is stored', async () => {
      mockGet.mockResolvedValue(false);
      await expect(hasValidToken()).resolves.toBe(false);
    });

    it('is true when a token without expiry is stored', async () => {
      mockGet.mockResolvedValue({ username: 'auth-token', password: 'tok' });
      await expect(hasValidToken()).resolves.toBe(true);
    });

    it('is true when a token with a future expiry is stored', async () => {
      mockGet.mockResolvedValue({ username: 'auth-token', password: 'tok' });
      await AsyncStorage.setItem(EXPIRY_KEY, String(Date.now() + 60_000));
      await expect(hasValidToken()).resolves.toBe(true);
    });

    it('is false when the stored token has expired', async () => {
      mockGet.mockResolvedValue({ username: 'auth-token', password: 'tok' });
      await AsyncStorage.setItem(EXPIRY_KEY, String(Date.now() - 60_000));
      await expect(hasValidToken()).resolves.toBe(false);
    });
  });
});
