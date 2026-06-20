import { Platform } from 'react-native';
import { setupNotifications } from './notifications';
import { setupNetworkMonitoring } from './network';
import { loadStoredAuth } from './auth';
import { initializeDatabase } from './database';
import { createScopedLogger } from './logger';

const log = createScopedLogger('Initialization');

export async function initializeApp(): Promise<void> {
  try {
    // Initialize local database
    await initializeDatabase();

    // Load stored authentication
    await loadStoredAuth();

    // Setup network monitoring
    setupNetworkMonitoring();

    // Setup push notifications
    if (Platform.OS !== 'web') {
      await setupNotifications();
    }

    log.info('App initialized successfully');
  } catch (error) {
    log.error('Failed to initialize app', error);
  }
}
