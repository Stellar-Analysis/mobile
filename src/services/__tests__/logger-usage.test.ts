/**
 * Verifies that all refactored modules use createScopedLogger instead of
 * raw console.* calls.
 */

// ─── shared top-level mocks ──────────────────────────────────────────────────

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: map => ('ios' in map ? map.ios : map.default),
  },
}));

// Capture the scoped-logger spy so every describe block can inspect it.
const mockLog = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@services/logger', () => ({
  createScopedLogger: jest.fn(() => mockLog),
  logger: mockLog,
}));

// Dependencies used by initialization.ts
const mockSetupNotifications = jest.fn().mockResolvedValue(undefined);
const mockSetupNetworkMonitoring = jest.fn();
const mockLoadStoredAuth = jest.fn().mockResolvedValue(undefined);

jest.mock('@services/notifications', () => ({ setupNotifications: mockSetupNotifications }));
jest.mock('@services/network', () => ({ setupNetworkMonitoring: mockSetupNetworkMonitoring }));
jest.mock('@services/auth', () => ({ loadStoredAuth: mockLoadStoredAuth }));

// Keychain mock used by tokenStorage.ts
const mockGetGenericPassword = jest.fn();
jest.mock('react-native-keychain', () => ({
  getGenericPassword: mockGetGenericPassword,
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly' },
  SECURITY_LEVEL: { SECURE_HARDWARE: 'SECURE_HARDWARE' },
}));

// Storage mock used by useOfflineCaching.ts
const mockStorageGetItem = jest.fn().mockReturnValue(null);
const mockStorageSetItem = jest.fn();
jest.mock('@services/storage', () => ({
  storageUtils: {
    getItem: (...args) => mockStorageGetItem(...args),
    setItem: (...args) => mockStorageSetItem(...args),
  },
}));
jest.mock('@store/appStore', () => ({
  useAppStore: () => ({ isOnline: true }),
}));

// Query client mock used by usePullToRefresh.ts
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// database.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('database — structured logging', () => {
  // Note: database is NOT mocked here; we use the real implementation.
  // jest.mock('@services/database') must NOT appear in this file because Jest
  // hoists jest.mock() calls to the top of the file, which would replace the
  // module under test. All tests that need a fake database (initialization)
  // inline their own require() inside isolateModules.
  const db = require('@services/database');

  beforeEach(() => jest.clearAllMocks());

  it('calls log.info on initializeDatabase', async () => {
    await db.initializeDatabase();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('initialized'));
  });

  it('calls log.info on clearDatabase', async () => {
    await db.clearDatabase();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('cleared'));
  });

  it('never calls console.log directly', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await db.initializeDatabase();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// initialization.ts — uses isolateModules so we can control the database dep
// ─────────────────────────────────────────────────────────────────────────────

describe('initialization — structured logging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls log.info on successful initialization', async () => {
    let initializeApp;
    jest.isolateModules(() => {
      jest.mock('@services/database', () => ({
        initializeDatabase: jest.fn().mockResolvedValue(undefined),
      }));
      ({ initializeApp } = require('@services/initialization'));
    });
    await initializeApp();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('initialized'));
  });

  it('calls log.error when bootstrap throws', async () => {
    let initializeApp;
    jest.isolateModules(() => {
      jest.mock('@services/database', () => ({
        initializeDatabase: jest.fn().mockRejectedValue(new Error('db fail')),
      }));
      ({ initializeApp } = require('@services/initialization'));
    });
    await initializeApp(); // must not re-throw
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize'),
      expect.any(Error)
    );
  });

  it('never calls console.log or console.error directly', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let initializeApp;
    jest.isolateModules(() => {
      jest.mock('@services/database', () => ({
        initializeDatabase: jest.fn().mockResolvedValue(undefined),
      }));
      ({ initializeApp } = require('@services/initialization'));
    });
    await initializeApp();
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tokenStorage.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('tokenStorage — structured logging', () => {
  const { getToken } = require('@services/tokenStorage');

  beforeEach(() => jest.clearAllMocks());

  it('calls log.error when keychain access fails and returns null', async () => {
    mockGetGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    const result = await getToken();
    expect(result).toBeNull();
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining('Secure storage access failed'),
      expect.any(Error)
    );
  });

  it('never calls console.error directly on keychain failure', async () => {
    mockGetGenericPassword.mockRejectedValueOnce(new Error('fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await getToken();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// usePullToRefresh.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('usePullToRefresh — structured logging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('never calls console.warn directly', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    require('@hooks/usePullToRefresh');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createScopedLogger scope contract — each module isolated so factory re-runs
// ─────────────────────────────────────────────────────────────────────────────

describe('createScopedLogger — scope names', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('database.ts registers "Database" scope', () => {
    // The module was loaded during describe-time which complicates mocking
    // and module cache behavior. Assert statically that the implementation
    // registers a scoped logger for the `Database` scope — this enforces
    // the contract without brittle runtime mocks.
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../database.ts'), 'utf8');
    expect(source).toEqual(expect.stringContaining("createScopedLogger('Database')"));
  });

  it('initialization.ts registers "Initialization" scope', () => {
    jest.resetModules();
    jest.mock('@services/logger', () => ({
      createScopedLogger: jest.fn(() => mockLog),
      logger: mockLog,
    }));
    jest.mock('@services/database', () => ({
      initializeDatabase: jest.fn().mockResolvedValue(undefined),
    }));
    require('@services/initialization');
    const { createScopedLogger } = require('@services/logger');
    expect(createScopedLogger).toHaveBeenCalledWith('Initialization');
  });

  it('tokenStorage.ts registers "TokenStorage" scope', () => {
    jest.resetModules();
    jest.mock('@services/logger', () => ({
      createScopedLogger: jest.fn(() => mockLog),
      logger: mockLog,
    }));
    require('@services/tokenStorage');
    const { createScopedLogger } = require('@services/logger');
    expect(createScopedLogger).toHaveBeenCalledWith('TokenStorage');
  });

  it('useOfflineCaching.ts registers "OfflineCaching" scope', () => {
    jest.resetModules();
    jest.mock('@services/logger', () => ({
      createScopedLogger: jest.fn(() => mockLog),
      logger: mockLog,
    }));
    require('@hooks/useOfflineCaching');
    const { createScopedLogger } = require('@services/logger');
    expect(createScopedLogger).toHaveBeenCalledWith('OfflineCaching');
  });

  it('usePullToRefresh.ts registers "PullToRefresh" scope', () => {
    jest.resetModules();
    jest.mock('@services/logger', () => ({
      createScopedLogger: jest.fn(() => mockLog),
      logger: mockLog,
    }));
    require('@hooks/usePullToRefresh');
    const { createScopedLogger } = require('@services/logger');
    expect(createScopedLogger).toHaveBeenCalledWith('PullToRefresh');
  });

  it('contractService.ts registers "MobileContractService" scope', () => {
    jest.resetModules();
    jest.mock('@services/logger', () => ({
      createScopedLogger: jest.fn(() => mockLog),
      logger: mockLog,
    }));
    jest.mock('@services/contractSubmission', () => ({}), { virtual: true });
    try {
      require('@services/contractService');
    } catch {
      // module may have unavailable native deps; logger scope is set at import time
    }
    const { createScopedLogger } = require('@services/logger');
    expect(createScopedLogger).toHaveBeenCalledWith('MobileContractService');
  });
});
