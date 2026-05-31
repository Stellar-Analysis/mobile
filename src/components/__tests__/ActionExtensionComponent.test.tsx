import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { ActionExtensionComponent } from '../ActionExtensionComponent';
import { useActionExtension } from '@hooks/useActionExtension';

jest.mock('@hooks/useActionExtension', () => ({
  useActionExtension: jest.fn(),
}));

const mockedHook = useActionExtension as jest.MockedFunction<typeof useActionExtension>;

const baseResult = {
  isSupported: true,
  loading: false,
  error: null,
  isOffline: false,
  actions: [],
  availableActions: [
    { type: 'analyze_anchor', label: 'Analyze Anchor' },
  ],
  executeAction: jest.fn(),
  clearActions: jest.fn(),
  syncOfflineQueue: jest.fn(),
};

describe('ActionExtensionComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHook.mockReturnValue(baseResult);
  });

  it('renders title', () => {
    const tree = renderer.create(<ActionExtensionComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Action Extension');
  });

  it('shows available actions', () => {
    const tree = renderer.create(<ActionExtensionComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Analyze Anchor');
  });

  it('has accessibility label', () => {
    const tree = renderer.create(<ActionExtensionComponent />);
    const root = tree.toJSON() as renderer.ReactTestRendererJSON;
    expect(root.props.accessibilityLabel).toBe('Action extension screen');
  });
});
