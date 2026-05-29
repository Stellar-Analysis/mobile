import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { IOSProjectSetup } from '../IOSProjectSetup';
import { useIOSProjectSetup } from '@hooks/useIOSProjectSetup';

jest.mock('@hooks/useIOSProjectSetup', () => ({
  useIOSProjectSetup: jest.fn(),
}));

const mockedUseIOSProjectSetup = useIOSProjectSetup as jest.MockedFunction<typeof useIOSProjectSetup>;

const baseResult = {
  status: 'ready' as const,
  isIOS: true,
  osVersion: '16.0',
  isSupported: true,
  recheck: jest.fn(),
};

describe('IOSProjectSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseIOSProjectSetup.mockReturnValue(baseResult);
  });

  it('renders correctly', () => {
    const tree = renderer.create(<IOSProjectSetup />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('iOS Project Setup');
  });

  it('shows Ready status when supported', () => {
    const tree = renderer.create(<IOSProjectSetup />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Ready');
  });

  it('shows Checking… when status is checking', () => {
    mockedUseIOSProjectSetup.mockReturnValue({ ...baseResult, status: 'checking' });
    const tree = renderer.create(<IOSProjectSetup />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Checking…');
  });

  it('shows unsupported status and warning for old iOS', () => {
    mockedUseIOSProjectSetup.mockReturnValue({
      ...baseResult,
      osVersion: '13.0',
      isSupported: false,
    });
    const tree = renderer.create(<IOSProjectSetup />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Unsupported version');
    expect(texts).toContain('iOS 14 or later is required.');
  });

  it('does not show warning when supported', () => {
    const tree = renderer.create(<IOSProjectSetup />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).not.toContain('iOS 14 or later is required.');
  });

  it('has accessibility label on container', () => {
    const tree = renderer.create(<IOSProjectSetup />);
    const root = tree.toJSON() as renderer.ReactTestRendererJSON;
    expect(root.props.accessibilityLabel).toBe('iOS Project Setup');
  });

  it('calls recheck when button is pressed', () => {
    const recheck = jest.fn();
    mockedUseIOSProjectSetup.mockReturnValue({ ...baseResult, recheck });
    const tree = renderer.create(<IOSProjectSetup />);
    const button = tree.root.find(n => n.props.accessibilityRole === 'button');
    button.props.onPress();
    expect(recheck).toHaveBeenCalledTimes(1);
  });
});
