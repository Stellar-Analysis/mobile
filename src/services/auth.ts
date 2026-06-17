import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '@config/constants';
import { useAuthStore } from '@store/authStore';
import { AuthTokens, User } from '@types/index';
import { apiClient } from './api';
import { storage } from './storage';
import { logger } from './logger';

export async function loadStoredAuth(): Promise<void> {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      const tokens: AuthTokens = JSON.parse(credentials.password);
      useAuthStore.getState().setTokens(tokens);
      logger.auth('Stored auth tokens loaded successfully');

      const userData = storage.getString(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const user: User = JSON.parse(userData);
        useAuthStore.getState().setUser(user);
        logger.auth('User data loaded from storage', { userId: user.id });
      }
    } else {
      logger.debug('No stored auth credentials found');
    }
  } catch (error) {
    logger.error('Failed to load stored auth', error, { source: 'loadStoredAuth' });
  } finally {
    useAuthStore.getState().setLoading(false);
    logger.debug('Auth loading completed');
  }
}

export async function storeAuthTokens(tokens: AuthTokens): Promise<void> {
  try {
    await Keychain.setGenericPassword('auth', JSON.stringify(tokens));
    useAuthStore.getState().setTokens(tokens);
    logger.auth('Auth tokens stored successfully');
  } catch (error) {
    logger.error('Failed to store auth tokens', error, { source: 'storeAuthTokens' });
    throw error;
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await Keychain.resetGenericPassword();
    storage.delete(STORAGE_KEYS.USER_DATA);
    useAuthStore.getState().logout();
    logger.auth('Auth tokens cleared successfully');
  } catch (error) {
    logger.error('Failed to clear auth tokens', error, { source: 'clearAuthTokens' });
    throw error;
  }
}

export async function refreshAuthTokens(): Promise<AuthTokens | null> {
  const { tokens } = useAuthStore.getState();
  if (!tokens?.refreshToken) {
    logger.warn('No refresh token available for token refresh');
    return null;
  }

  try {
    logger.debug('Attempting to refresh auth tokens');
    const newTokens = await apiClient.post<AuthTokens>('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });

    await storeAuthTokens(newTokens);
    logger.auth('Auth tokens refreshed successfully');
    return newTokens;
  } catch (error) {
    logger.error('Failed to refresh tokens', error, { source: 'refreshAuthTokens' });
    return null;
  }
}
