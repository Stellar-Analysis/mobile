import { setupNotifications, NOTIFICATION_CHANNEL_ID } from '../notifications';

// Mutable so individual tests can override Platform.OS
let mockPlatformOS = 'android';

const mockRequestPermission = jest.fn();
const mockOnMessage = jest.fn().mockReturnValue(() => {});
const mockCreateChannel = jest.fn().mockResolvedValue(undefined);
const mockDisplayNotification = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-native-firebase/messaging', () => {
  const messagingInstance = {
    requestPermission: mockRequestPermission,
    onMessage: mockOnMessage,
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0, NOT_DETERMINED: -1 },
  };
  const messaging = jest.fn(() => messagingInstance);
  (messaging as any).AuthorizationStatus = messagingInstance.AuthorizationStatus;
  return { __esModule: true, default: messaging };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: mockCreateChannel,
    displayNotification: mockDisplayNotification,
  },
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('react-native', () => ({
  Platform: {
    get OS() { return mockPlatformOS; },
  },
}));

describe('setupNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = 'android';
  });

  describe('permission denied / error paths', () => {
    it('skips channel and listener setup when permission is DENIED', async () => {
      mockRequestPermission.mockResolvedValue(0); // DENIED
      await setupNotifications();
      expect(mockCreateChannel).not.toHaveBeenCalled();
      expect(mockOnMessage).not.toHaveBeenCalled();
    });

    it('skips channel and listener setup when permission is NOT_DETERMINED', async () => {
      mockRequestPermission.mockResolvedValue(-1); // NOT_DETERMINED
      await setupNotifications();
      expect(mockCreateChannel).not.toHaveBeenCalled();
      expect(mockOnMessage).not.toHaveBeenCalled();
    });

    it('resolves without throwing when requestPermission rejects', async () => {
      mockRequestPermission.mockRejectedValue(new Error('Permission API unavailable'));
      await expect(setupNotifications()).resolves.toBeUndefined();
      expect(mockCreateChannel).not.toHaveBeenCalled();
    });
  });

  describe('permission granted — Android', () => {
    it('creates channel and registers message listener on AUTHORIZED', async () => {
      mockRequestPermission.mockResolvedValue(1); // AUTHORIZED
      await setupNotifications();

      expect(mockCreateChannel).toHaveBeenCalledWith(
        expect.objectContaining({ id: NOTIFICATION_CHANNEL_ID, importance: 4 }),
      );
      expect(mockOnMessage).toHaveBeenCalled();
    });

    it('creates channel and registers message listener on PROVISIONAL', async () => {
      mockRequestPermission.mockResolvedValue(2); // PROVISIONAL
      await setupNotifications();

      expect(mockCreateChannel).toHaveBeenCalledWith(
        expect.objectContaining({ id: NOTIFICATION_CHANNEL_ID }),
      );
      expect(mockOnMessage).toHaveBeenCalled();
    });
  });

  describe('permission granted — iOS', () => {
    beforeEach(() => { mockPlatformOS = 'ios'; });

    it('does NOT create an Android channel on iOS', async () => {
      mockRequestPermission.mockResolvedValue(1); // AUTHORIZED
      await setupNotifications();
      expect(mockCreateChannel).not.toHaveBeenCalled();
      // But message listener IS registered
      expect(mockOnMessage).toHaveBeenCalled();
    });
  });

  describe('foreground message handling', () => {
    let messageHandler: ((msg: any) => Promise<void>) | undefined;

    beforeEach(async () => {
      mockRequestPermission.mockResolvedValue(1);
      mockOnMessage.mockImplementation((handler: (msg: any) => Promise<void>) => {
        messageHandler = handler;
        return () => {};
      });
      await setupNotifications();
    });

    it('displays notification when message has a notification payload', async () => {
      await messageHandler!({ notification: { title: 'Alert', body: 'Ledger ingested' } });

      expect(mockDisplayNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Alert', body: 'Ledger ingested' }),
      );
    });

    it('uses the correct channel ID in the android config', async () => {
      await messageHandler!({ notification: { title: 'T', body: 'B' } });

      expect(mockDisplayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({ channelId: NOTIFICATION_CHANNEL_ID }),
        }),
      );
    });

    it('skips displayNotification when notification payload is absent', async () => {
      await messageHandler!({ notification: undefined });
      expect(mockDisplayNotification).not.toHaveBeenCalled();
    });

    it('skips displayNotification for data-only messages', async () => {
      await messageHandler!({ data: { key: 'value' } });
      expect(mockDisplayNotification).not.toHaveBeenCalled();
    });
  });
});
