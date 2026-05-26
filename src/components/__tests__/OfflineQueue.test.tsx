import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { OfflineQueue } from '../OfflineQueue';
import { useOfflineQueue } from '@hooks/useOfflineQueue';
import { useAppStore } from '@store/appStore';

jest.mock('@hooks/useOfflineQueue', () => ({
  useOfflineQueue: jest.fn(),
}));

jest.mock('@store/appStore', () => ({
  useAppStore: jest.fn(),
}));

const mockedUseOfflineQueue = useOfflineQueue as jest.MockedFunction<typeof useOfflineQueue>;
const mockedUseAppStore = useAppStore as unknown as jest.Mock;

describe('OfflineQueue', () => {
  const queueState = {
    items: [],
    isProcessing: false,
    enqueue: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    retryFailed: jest.fn(),
    processQueue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseOfflineQueue.mockReturnValue(queueState);
    mockedUseAppStore.mockImplementation(selector => selector({ isOnline: true }));
  });

  it('renders correctly', () => {
    const tree = renderer.create(<OfflineQueue />);
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);

    expect(texts).toContain('Offline Queue');
  });

  it('shows offline feedback when the device is offline', () => {
    mockedUseAppStore.mockImplementation(selector => selector({ isOnline: false }));

    const tree = renderer.create(<OfflineQueue />);
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);

    expect(texts).toContain('Offline mode active');
  });

  it('renders queued requests and removes an item', () => {
    const remove = jest.fn();
    mockedUseOfflineQueue.mockReturnValue({
      ...queueState,
      remove,
      items: [
        {
          id: 'queued-request',
          method: 'POST',
          url: '/payments',
          payload: { amount: 10 },
          retryCount: 1,
          status: 'failed',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          lastError: 'Network unavailable',
        },
      ],
    });

    const tree = renderer.create(<OfflineQueue />);
    const removeButton = tree.root.findByProps({ accessibilityLabel: 'Remove queued request queued-request' });

    act(() => {
      removeButton.props.onPress();
    });

    expect(remove).toHaveBeenCalledWith('queued-request');
  });
});
