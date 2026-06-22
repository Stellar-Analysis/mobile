// Local persistence layer for offline-first mobile storage.
//
// Implemented as a table-oriented store on top of the existing MMKV-backed
// `storageUtils` (see ./storage.ts) rather than a native SQLite binding, so
// it stays fully unit-testable in Jest without native module mocking. The
// table/row API below is intentionally SQL-shaped (tables, rows keyed by
// `id`) so it can be swapped for a real SQLite driver (e.g. expo-sqlite)
// later without changing call sites.

import { storageUtils } from './storage';
import { createScopedLogger } from './logger';

const log = createScopedLogger('Database');
// Export the internal logger for tests to inspect without relying on
// fragile module-resolution tricks.
export const __logger = log;

const DB_KEY_PREFIX = 'db:v1:';

const TABLES = ['corridors', 'anchors', 'assets', 'sync_queue'] as const;
export type TableName = (typeof TABLES)[number];

export interface TableRow {
  id: string;
}

export type SyncQueueMethod = 'POST' | 'PUT' | 'DELETE';
export type SyncQueueStatus = 'pending' | 'applied' | 'failed';

/**
 * A queued offline mutation, durably persisted in the `sync_queue` table.
 *
 * `id` doubles as the idempotency key shared with the backend reconciliation
 * contract (see docs/offline-sync.md) — it must stay stable across retries
 * so replays are safe to de-duplicate server-side.
 */
export interface SyncQueueRow extends TableRow {
  method: SyncQueueMethod;
  resource: string;
  payload?: unknown;
  status: SyncQueueStatus;
  clientTimestamp: string;
  retryCount: number;
  lastError?: string;
}

function tableKey(table: TableName): string {
  return `${DB_KEY_PREFIX}${table}`;
}

function readTable<T extends TableRow>(table: TableName): T[] {
  const raw = storageUtils.getItem(tableKey(table));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    log.warn(`Failed to parse table "${table}", resetting it`, { error });
    return [];
  }
}

function writeTable<T extends TableRow>(table: TableName, rows: T[]): void {
  storageUtils.setItem(tableKey(table), JSON.stringify(rows));
}

/**
 * Initializes all local tables (corridors, anchors, assets, sync_queue).
 * Safe to call multiple times — existing tables are left untouched.
 */
export async function initializeDatabase(): Promise<void> {
  for (const table of TABLES) {
    if (storageUtils.getItem(tableKey(table)) == null) {
      writeTable(table, []);
    }
  }
  log.info('Database initialized', { tables: TABLES });
}

/** Clears all cached data and the offline sync queue. */
export async function clearDatabase(): Promise<void> {
  for (const table of TABLES) {
    storageUtils.removeItem(tableKey(table));
  }
  log.info('Database cleared');
}

/** Reads a single row by id from the given table, or null if absent. */
export async function getRow<T extends TableRow>(
  table: TableName,
  id: string
): Promise<T | null> {
  const rows = readTable<T>(table);
  return rows.find(row => row.id === id) ?? null;
}

/** Reads every row currently stored in the given table. */
export async function getAllRows<T extends TableRow>(table: TableName): Promise<T[]> {
  return readTable<T>(table);
}

/** Inserts a row, or replaces the existing row with the same id. */
export async function upsertRow<T extends TableRow>(table: TableName, row: T): Promise<void> {
  const rows = readTable<T>(table);
  const index = rows.findIndex(existing => existing.id === row.id);

  if (index >= 0) {
    rows[index] = row;
  } else {
    rows.push(row);
  }

  writeTable(table, rows);
}

/** Removes a row by id. No-op if the row does not exist. */
export async function deleteRow(table: TableName, id: string): Promise<void> {
  const rows = readTable<TableRow>(table);
  writeTable(table, rows.filter(row => row.id !== id));
}

export interface EnqueueSyncActionInput {
  id: string;
  method: SyncQueueMethod;
  resource: string;
  payload?: unknown;
}

/** Persists a new offline mutation in the `sync_queue` table as `pending`. */
export async function enqueueSyncAction(input: EnqueueSyncActionInput): Promise<SyncQueueRow> {
  const row: SyncQueueRow = {
    ...input,
    status: 'pending',
    retryCount: 0,
    clientTimestamp: new Date().toISOString(),
  };

  await upsertRow('sync_queue', row);
  log.info('Queued offline sync action', { id: row.id, method: row.method, resource: row.resource });

  return row;
}

/** Returns every `sync_queue` row that has not yet been successfully applied. */
export async function getPendingSyncActions(): Promise<SyncQueueRow[]> {
  const rows = await getAllRows<SyncQueueRow>('sync_queue');
  return rows.filter(row => row.status === 'pending');
}

/**
 * Marks a queued action as applied or failed. Failed rows have their
 * `retryCount` incremented so callers can cap retries.
 */
export async function markSyncActionStatus(
  id: string,
  status: SyncQueueStatus,
  lastError?: string
): Promise<void> {
  const row = await getRow<SyncQueueRow>('sync_queue', id);

  if (!row) {
    return;
  }

  await upsertRow('sync_queue', {
    ...row,
    status,
    lastError,
    retryCount: status === 'failed' ? row.retryCount + 1 : row.retryCount,
  });
}

/** Removes an action from the queue once it has been durably applied. */
export async function removeSyncAction(id: string): Promise<void> {
  await deleteRow('sync_queue', id);
}
