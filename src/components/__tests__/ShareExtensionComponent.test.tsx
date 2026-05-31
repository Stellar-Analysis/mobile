import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { ShareExtensionComponent } from '../ShareExtensionComponent';
import { useShareExtension } from '@hooks/useShareExtension';

jest.mock('@hooks/useShareExtension', () => ({
  useShareExtension: jest.fn(),
}));

const mockedHook = useShareExtension as jest.MockedFunction<typeof useShareExtension>;

const baseResult = {
  isSupported: true,
  loading: false,
  error: null,
  isOffline: false,
  sharedItems: [],
  receiveShare: jest.fn(),
  clearShares: jest.fn(),
  syncOfflineQueue: jest.fn(),
};

describe('ShareExtensionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHook.mockReturnValue(baseResult);
  });

  it('renders title', () => {
    const tree = renderer.create(<ShareExtensionComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Share Extension');
  });

  it('shows offline message', () => {
    mockedHook.mockReturnValue({ ...baseResult, isOffline: true });
    const tree = renderer.create(<ShareExtensionComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Offline — shares will be queued until connected.');
  });

  it('has accessibility label', () => {
    const tree = renderer.create(<ShareExtensionComponent />);
    const root = tree.toJSON() as renderer.ReactTestRendererJSON;
    expect(root.props.accessibilityLabel).toBe('Share extension screen');
  });
});
