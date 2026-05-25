import { Platform } from 'react-native';
import { setupNotifications } from './notifications';
import { setupNetworkMonitoring } from './network';
import { loadStoredAuth } from './auth';
import { initializeDatabase } from './database';

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

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}
