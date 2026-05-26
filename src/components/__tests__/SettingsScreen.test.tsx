import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SettingsScreen } from '../SettingsScreen';
import { useSettingsScreen } from '@hooks/useSettingsScreen';

jest.mock('@hooks/useSettingsScreen', () => ({
  useSettingsScreen: jest.fn(),
}));

const mockedUseSettingsScreen = useSettingsScreen as jest.MockedFunction<typeof useSettingsScreen>;

describe('SettingsScreen', () => {
  const state = {
    theme: 'light' as const,
    network: 'testnet' as const,
    isOnline: true,
    isSyncing: false,
    platformLabel: 'iOS',
    toggleTheme: jest.fn(),
    toggleNetwork: jest.fn(),
    clearMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSettingsScreen.mockReturnValue(state);
  });

  it('renders correctly', () => {
    const tree = renderer.create(<SettingsScreen />);
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);

    expect(texts).toContain('Settings Screen');
  });

  it('shows offline support feedback', () => {
    mockedUseSettingsScreen.mockReturnValue({ ...state, isOnline: false });

    const tree = renderer.create(<SettingsScreen />);
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);

    expect(texts).toContain('Offline mode active. Changes are saved locally where possible.');
  });

  it('toggles theme from the theme action', () => {
    const tree = renderer.create(<SettingsScreen />);
    const themeButton = tree.root.findByProps({ accessibilityLabel: 'Toggle theme. Current theme is light' });

    act(() => {
      themeButton.props.onPress();
    });

    expect(state.toggleTheme).toHaveBeenCalled();
  });
});
