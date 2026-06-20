// Placeholder for local database initialization
// In production, use SQLite or Realm for offline data storage

import { createScopedLogger } from './logger';

const log = createScopedLogger('Database');
// Export the internal logger for tests to inspect without relying on
// fragile module-resolution tricks.
export const __logger = log;

export async function initializeDatabase(): Promise<void> {
  // TODO: Initialize SQLite database
  // Create tables for offline caching:
  // - corridors
  // - anchors
  // - assets
  // - sync_queue (for offline mutations)
  log.info('Database initialized');
}

export async function clearDatabase(): Promise<void> {
  // TODO: Clear all cached data
  log.info('Database cleared');
}
