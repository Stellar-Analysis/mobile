import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NFCSupportComponent } from '../NFCSupportComponent';
import { useNFCSupport } from '@hooks/useNFCSupport';

jest.mock('@hooks/useNFCSupport', () => ({
  useNFCSupport: jest.fn(),
}));

const mockedUseNFCSupport = useNFCSupport as jest.Mock;

describe('NFCSupportComponent', () => {
  const startSession = jest.fn();
  const stopSession = jest.fn();
  const clearCachedResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNFCSupport.mockReturnValue({
      isSupported: true,
      isEnabled: true,
      isOffline: false,
      isLoading: false,
      isScanning: false,
      error: null,
      lastResult: null,
      cachedResults: [],
      startSession,
      stopSession,
      clearCachedResults,
    });
  });

  it('renders NFC controls', () => {
    const { getByText } = render(<NFCSupportComponent />);

    expect(getByText('NFC Support')).toBeTruthy();
    expect(getByText('Tap to Pay')).toBeTruthy();
    expect(getByText('Hardware Auth')).toBeTruthy();
  });

  it('starts a tap to pay session', () => {
    const { getByLabelText } = render(<NFCSupportComponent />);

    fireEvent.press(getByLabelText('Start NFC tap to pay session'));

    expect(startSession).toHaveBeenCalledWith('tap_to_pay');
  });

  it('shows errors accessibly', () => {
    mockedUseNFCSupport.mockReturnValueOnce({
      isSupported: true,
      isEnabled: false,
      isOffline: false,
      isLoading: false,
      isScanning: false,
      error: 'NFC is disabled.',
      lastResult: null,
      cachedResults: [],
      startSession,
      stopSession,
      clearCachedResults,
    });

    const { getByText } = render(<NFCSupportComponent />);

    expect(getByText('NFC is disabled.')).toBeTruthy();
  });
});
