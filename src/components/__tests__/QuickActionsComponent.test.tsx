import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { QuickActionsComponent } from '../QuickActionsComponent';
import { useQuickActions } from '@hooks/useQuickActions';

jest.mock('@hooks/useQuickActions', () => ({
  useQuickActions: jest.fn(),
}));

const mockedHook = useQuickActions as jest.MockedFunction<typeof useQuickActions>;

const baseResult = {
  isSupported: true,
  loading: false,
  error: null,
  isOffline: false,
  actions: [
    { id: 'dashboard', title: 'Dashboard', icon: 'chart', route: 'Dashboard', createdAt: '' },
  ],
  refreshActions: jest.fn(),
  pinAction: jest.fn(),
};

describe('QuickActionsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHook.mockReturnValue(baseResult);
  });

  it('renders title', () => {
    const tree = renderer.create(<QuickActionsComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Quick Actions');
  });

  it('shows loading state', () => {
    mockedHook.mockReturnValue({ ...baseResult, loading: true });
    const tree = renderer.create(<QuickActionsComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Loading quick actions…');
  });

  it('shows error message', () => {
    mockedHook.mockReturnValue({ ...baseResult, error: 'Failed to load' });
    const tree = renderer.create(<QuickActionsComponent />);
    const texts = tree.root.findAllByType(Text).map(n => n.props.children);
    expect(texts).toContain('Failed to load');
  });

  it('has accessibility label', () => {
    const tree = renderer.create(<QuickActionsComponent />);
    const root = tree.toJSON() as renderer.ReactTestRendererJSON;
    expect(root.props.accessibilityLabel).toBe('Quick actions screen');
  });
});
