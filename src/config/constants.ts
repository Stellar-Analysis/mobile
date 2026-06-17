import Config from 'react-native-config';

// SEC-004: Strict runtime validation for mobile configuration
const validateConfig = () => {
  const isProduction = Config.APP_ENV === 'production';
  const errors: string[] = [];

  if (isProduction) {
    if (!Config.API_BASE_URL || Config.API_BASE_URL.includes('localhost')) {
      errors.push('API_BASE_URL must be a valid production URL');
    }
    if (Config.STELLAR_NETWORK !== 'mainnet') {
      errors.push('STELLAR_NETWORK must be mainnet in production');
    }
  }

  if (errors.length > 0) {
    // Fail-fast to prevent misconfigured builds from running
    throw new Error(`Mobile Configuration Error:\n- ${errors.join('\n- ')}`);
  }
};

validateConfig();

export const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL || 'http://localhost:8080',
  TIMEOUT: parseInt(Config.API_TIMEOUT || '30000', 10),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const STELLAR_CONFIG = {
  NETWORK: (Config.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  HORIZON_URL: Config.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  NETWORK_PREFERENCE: '@network_preference',
  THEME_PREFERENCE: '@theme_preference',
  BIOMETRIC_ENABLED: '@biometric_enabled',
} as const;

export const CACHE_KEYS = {
  CORRIDORS: 'corridors',
  ANCHORS: 'anchors',
  ASSETS: 'assets',
  ANALYTICS: 'analytics',
} as const;

export const FEATURE_FLAGS = {
  BIOMETRIC_AUTH: Config.ENABLE_BIOMETRIC_AUTH === 'true',
  PUSH_NOTIFICATIONS: Config.ENABLE_PUSH_NOTIFICATIONS === 'true',
  OFFLINE_MODE: Config.ENABLE_OFFLINE_MODE === 'true',
} as const;
