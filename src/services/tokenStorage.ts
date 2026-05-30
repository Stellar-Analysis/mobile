import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

/**
 * Secure auth-token storage.
 *
 * The token itself is held in the platform-native encrypted store via
 * `react-native-keychain` (iOS Keychain / Android Keystore). Non-sensitive
 * metadata (the expiry timestamp) is kept in `AsyncStorage` so the app can
 * cheaply decide the initial route on launch without unlocking the keychain.
 */

const KEYCHAIN_SERVICE = 'com.stellarinsights.auth';
const TOKEN_ACCOUNT = 'auth-token';
const EXPIRY_KEY = '@stellar-insights/token-expiry';

/**
 * Persist an auth token in encrypted storage.
 *
 * @param token - The auth token to store.
 * @param expiresAt - Optional expiry as a Unix epoch in milliseconds.
 */
export async function saveToken(
  token: string,
  expiresAt?: number,
): Promise<void> {
  await Keychain.setGenericPassword(TOKEN_ACCOUNT, token, {
    service: KEYCHAIN_SERVICE,
  });

  if (typeof expiresAt === 'number') {
    await AsyncStorage.setItem(EXPIRY_KEY, String(expiresAt));
  } else {
    await AsyncStorage.removeItem(EXPIRY_KEY);
  }
}

/**
 * Read the stored auth token.
 *
 * @returns The token, or `null` when none is stored.
 */
export async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
  return credentials ? credentials.password : null;
}

/**
 * Read the stored token expiry timestamp.
 *
 * @returns Expiry as a Unix epoch in milliseconds, or `null` when unset.
 */
export async function getTokenExpiry(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(EXPIRY_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Remove the stored auth token and its expiry metadata.
 */
export async function removeToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await AsyncStorage.removeItem(EXPIRY_KEY);
}

/**
 * Clear all auth-related storage (token + metadata).
 */
export async function clearAll(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await AsyncStorage.multiRemove([EXPIRY_KEY]);
}

/**
 * Determine whether a usable (present and unexpired) token exists. This is the
 * predicate the app uses to choose between the authenticated and login routes.
 *
 * @returns `true` when a non-expired token is stored.
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getToken();
  if (!token) {
    return false;
  }

  const expiry = await getTokenExpiry();
  if (expiry !== null && expiry <= Date.now()) {
    return false;
  }

  return true;
}
