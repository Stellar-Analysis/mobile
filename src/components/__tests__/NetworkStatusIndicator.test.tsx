import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { NetworkStatusIndicator } from '../NetworkStatusIndicator';
import { useNetworkStatusIndicator } from '@hooks/useNetworkStatusIndicator';

jest.mock('@hooks/useNetworkStatusIndicator', () => ({
  useNetworkStatusIndicator: jest.fn(),
}));

const mockedUseNetworkStatusIndicator = useNetworkStatusIndicator as jest.MockedFunction<typeof useNetworkStatusIndicator>;

describe('NetworkStatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNetworkStatusIndicator.mockReturnValue({
      status: 'offline',
      message: 'Offline mode active',
      isVisible: true,
      isOnline: false,
      isSyncing: false,
      platformOffset: 0,
      dismiss: jest.fn(),
      show: jest.fn(),
    });
  });

  it('renders correctly', () => {
    const tree = renderer.create(<NetworkStatusIndicator />);
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);

    expect(texts).toContain('Network Status Indicator');
    expect(texts).toContain('Offline mode active');
  });

  it('renders nothing when hidden', () => {
    mockedUseNetworkStatusIndicator.mockReturnValue({
      status: 'online',
      message: 'Back online',
      isVisible: false,
      isOnline: true,
      isSyncing: false,
      platformOffset: 0,
      dismiss: jest.fn(),
      show: jest.fn(),
    });

    const tree = renderer.create(<NetworkStatusIndicator />);

    expect(tree.toJSON()).toBeNull();
  });
});
