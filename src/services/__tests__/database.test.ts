import {
  initializeDatabase,
  clearDatabase,
  getRow,
  getAllRows,
  upsertRow,
  deleteRow,
  enqueueSyncAction,
  getPendingSyncActions,
  markSyncActionStatus,
  removeSyncAction,
} from '../database';
import { storageUtils } from '@services/storage';

jest.mock('@services/storage', () => ({
  storageUtils: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedStorageUtils = storageUtils as jest.Mocked<typeof storageUtils>;

/** In-memory backing store so getItem reflects prior setItem calls within a test. */
function useFakeStorageBackend() {
  const backend = new Map<string, string>();

  mockedStorageUtils.getItem.mockImplementation(key => backend.get(key));
  mockedStorageUtils.setItem.mockImplementation((key, value) => {
    backend.set(key, value);
  });
  mockedStorageUtils.removeItem.mockImplementation(key => {
    backend.delete(key);
  });

  return backend;
}

describe('database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFakeStorageBackend();
  });

  describe('initializeDatabase', () => {
    it('creates all four tables as empty arrays', async () => {
      await initializeDatabase();

      expect(mockedStorageUtils.setItem).toHaveBeenCalledWith('db:v1:corridors', '[]');
      expect(mockedStorageUtils.setItem).toHaveBeenCalledWith('db:v1:anchors', '[]');
      expect(mockedStorageUtils.setItem).toHaveBeenCalledWith('db:v1:assets', '[]');
      expect(mockedStorageUtils.setItem).toHaveBeenCalledWith('db:v1:sync_queue', '[]');
    });

    it('does not overwrite a table that already has data', async () => {
      await upsertRow('corridors', { id: 'us-mx' });
      jest.clearAllMocks();

      await initializeDatabase();

      expect(mockedStorageUtils.setItem).not.toHaveBeenCalledWith('db:v1:corridors', '[]');
      await expect(getAllRows('corridors')).resolves.toEqual([{ id: 'us-mx' }]);
    });
  });

  describe('clearDatabase', () => {
    it('removes every table', async () => {
      await initializeDatabase();
      jest.clearAllMocks();

      await clearDatabase();

      expect(mockedStorageUtils.removeItem).toHaveBeenCalledWith('db:v1:corridors');
      expect(mockedStorageUtils.removeItem).toHaveBeenCalledWith('db:v1:anchors');
      expect(mockedStorageUtils.removeItem).toHaveBeenCalledWith('db:v1:assets');
      expect(mockedStorageUtils.removeItem).toHaveBeenCalledWith('db:v1:sync_queue');
    });
  });

  describe('row CRUD helpers', () => {
    it('returns null for a row that does not exist', async () => {
      await expect(getRow('anchors', 'missing')).resolves.toBeNull();
    });

    it('upserts and reads back a row', async () => {
      await upsertRow('anchors', { id: 'anchor-1', name: 'Acme' });

      await expect(getRow('anchors', 'anchor-1')).resolves.toEqual({
        id: 'anchor-1',
        name: 'Acme',
      });
    });

    it('replaces an existing row with the same id instead of duplicating it', async () => {
      await upsertRow('anchors', { id: 'anchor-1', name: 'Acme' });
      await upsertRow('anchors', { id: 'anchor-1', name: 'Acme Renamed' });

      await expect(getAllRows('anchors')).resolves.toEqual([
        { id: 'anchor-1', name: 'Acme Renamed' },
      ]);
    });

    it('deletes a row by id', async () => {
      await upsertRow('assets', { id: 'asset-1' });
      await upsertRow('assets', { id: 'asset-2' });

      await deleteRow('assets', 'asset-1');

      await expect(getAllRows('assets')).resolves.toEqual([{ id: 'asset-2' }]);
    });

    it('resets a table that contains corrupted JSON instead of throwing', async () => {
      mockedStorageUtils.getItem.mockReturnValue('{not-json');

      await expect(getAllRows('corridors')).resolves.toEqual([]);
    });
  });

  describe('sync_queue helpers', () => {
    it('enqueues a pending action with a client timestamp', async () => {
      const row = await enqueueSyncAction({
        id: 'action-1',
        method: 'POST',
        resource: 'corridor:us-mx',
        payload: { rate: 1.2 },
      });

      expect(row).toMatchObject({
        id: 'action-1',
        method: 'POST',
        resource: 'corridor:us-mx',
        status: 'pending',
        retryCount: 0,
      });
      expect(typeof row.clientTimestamp).toBe('string');
    });

    it('only returns pending actions from getPendingSyncActions', async () => {
      await enqueueSyncAction({ id: 'a1', method: 'POST', resource: 'corridor:1' });
      await enqueueSyncAction({ id: 'a2', method: 'PUT', resource: 'corridor:2' });
      await markSyncActionStatus('a2', 'applied');

      const pending = await getPendingSyncActions();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('a1');
    });

    it('marks an action failed and increments its retry count', async () => {
      await enqueueSyncAction({ id: 'a1', method: 'DELETE', resource: 'anchor:1' });

      await markSyncActionStatus('a1', 'failed', 'network unreachable');
      const failedOnce = await getRow('sync_queue', 'a1');
      expect(failedOnce).toMatchObject({ status: 'failed', retryCount: 1, lastError: 'network unreachable' });

      await markSyncActionStatus('a1', 'failed', 'network unreachable');
      const failedTwice = await getRow('sync_queue', 'a1');
      expect(failedTwice).toMatchObject({ retryCount: 2 });
    });

    it('marking an unknown action id is a no-op', async () => {
      await expect(markSyncActionStatus('does-not-exist', 'applied')).resolves.toBeUndefined();
    });

    it('removes an action from the queue once applied', async () => {
      await enqueueSyncAction({ id: 'a1', method: 'POST', resource: 'asset:1' });

      await removeSyncAction('a1');

      await expect(getAllRows('sync_queue')).resolves.toEqual([]);
    });
  });
});
