/**
 * Mobile debug diagnostics service.
 *
 * All exported functions are no-ops (return null) in production builds
 * (`__DEV__` is false). They expose non-sensitive runtime state useful for
 * local troubleshooting of offline queue, sync, and notification health.
 *
 * Usage (Flipper / Metro console):
 *   import { getFullDiagnosticReport } from '@services/debugService';
 *   getFullDiagnosticReport().then(console.log);
 */

import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { storageUtils } from '@services/storage';

const OFFLINE_QUEUE_STORAGE_KEY = 'offline-queue:v1';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OfflineQueueDiagnostics {
  totalItems: number;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  oldestItemAge: number | null; // ms since createdAt of the oldest item
}

export interface SyncStatus {
  isOnline: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  lastCheckedAt: string;
}

export interface NotificationHealth {
  /** Always null on platforms where Notifee is unavailable (e.g. web/sim) */
  channelCreated: boolean | null;
  platform: string;
  devMode: boolean;
}

export interface MobileDiagnosticReport {
  timestamp: string;
  platform: string;
  isDev: boolean;
  offlineQueue: OfflineQueueDiagnostics;
  sync: SyncStatus;
  notifications: NotificationHealth;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function readQueueItems(): Array<{
  id: string;
  status: string;
  createdAt: string;
}> {
  try {
    const raw = storageUtils.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns offline queue diagnostic counters.
 * Returns null in production.
 */
export function getOfflineQueueDiagnostics(): OfflineQueueDiagnostics | null {
  if (!__DEV__) return null;

  const items = readQueueItems();
  const now = Date.now();

  const pending = items.filter(i => i.status === 'pending').length;
  const processing = items.filter(i => i.status === 'processing').length;
  const failed = items.filter(i => i.status === 'failed').length;

  const oldest =
    items.length > 0
      ? Math.min(...items.map(i => new Date(i.createdAt).getTime()))
      : null;

  return {
    totalItems: items.length,
    pendingCount: pending,
    processingCount: processing,
    failedCount: failed,
    oldestItemAge: oldest !== null ? now - oldest : null,
  };
}

/**
 * Returns the current network / sync status.
 * Returns null in production.
 */
export async function getSyncStatus(): Promise<SyncStatus | null> {
  if (!__DEV__) return null;

  let state: NetInfoState;
  try {
    state = await NetInfo.fetch();
  } catch {
    return {
      isOnline: false,
      connectionType: null,
      isInternetReachable: null,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  return {
    isOnline: !!(state.isConnected && state.isInternetReachable),
    connectionType: state.type ?? null,
    isInternetReachable: state.isInternetReachable ?? null,
    lastCheckedAt: new Date().toISOString(),
  };
}

/**
 * Returns notification channel health information.
 * Returns null in production.
 *
 * Notifee is loaded via require() to gracefully degrade in environments where
 * the native module is unavailable (e.g. unit test runner, web simulators).
 */
export async function getNotificationHealth(): Promise<NotificationHealth | null> {
  if (!__DEV__) return null;

  let channelCreated: boolean | null = null;

  if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const notifee = require('@notifee/react-native').default as {
        getChannels: () => Promise<Array<{ id: string }>>;
      };
      const channels = await notifee.getChannels();
      channelCreated = channels.some(ch => ch.id === 'default');
    } catch {
      channelCreated = null;
    }
  }

  return {
    channelCreated,
    platform: Platform.OS,
    devMode: __DEV__,
  };
}

/**
 * Aggregates all diagnostic information into a single report object.
 * Returns null in production.
 */
export async function getFullDiagnosticReport(): Promise<MobileDiagnosticReport | null> {
  if (!__DEV__) return null;

  const [syncStatus, notifHealth] = await Promise.all([
    getSyncStatus(),
    getNotificationHealth(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    isDev: __DEV__,
    offlineQueue: getOfflineQueueDiagnostics() ?? {
      totalItems: 0,
      pendingCount: 0,
      processingCount: 0,
      failedCount: 0,
      oldestItemAge: null,
    },
    sync: syncStatus ?? {
      isOnline: false,
      connectionType: null,
      isInternetReachable: null,
      lastCheckedAt: new Date().toISOString(),
    },
    notifications: notifHealth ?? {
      channelCreated: null,
      platform: Platform.OS,
      devMode: __DEV__,
    },
  };
}
