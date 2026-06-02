import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BluetoothSupportComponent } from '../BluetoothSupportComponent';
import { useBluetoothSupport } from '@hooks/useBluetoothSupport';

jest.mock('@hooks/useBluetoothSupport', () => ({
  useBluetoothSupport: jest.fn(),
}));

const mockedUseBluetoothSupport = useBluetoothSupport as jest.Mock;

describe('BluetoothSupportComponent', () => {
  const startScan = jest.fn();
  const stopScan = jest.fn();
  const pairDevice = jest.fn();
  const clearDevices = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseBluetoothSupport.mockReturnValue({
      isSupported: true,
      isEnabled: true,
      isOffline: false,
      isLoading: false,
      isScanning: false,
      error: null,
      devices: [
        {
          id: 'ledger-nano-x',
          name: 'Ledger Nano X',
          type: 'hardware_wallet',
          signalStrength: -48,
          paired: false,
          lastSeen: '2026-01-01T00:00:00.000Z',
        },
      ],
      pairedDevice: null,
      startScan,
      stopScan,
      pairDevice,
      clearDevices,
    });
  });

  it('renders Bluetooth controls and devices', () => {
    const { getByText } = render(<BluetoothSupportComponent />);

    expect(getByText('Bluetooth Support')).toBeTruthy();
    expect(getByText('Scan Devices')).toBeTruthy();
    expect(getByText('Ledger Nano X')).toBeTruthy();
  });

  it('starts scanning', () => {
    const { getByLabelText } = render(<BluetoothSupportComponent />);

    fireEvent.press(getByLabelText('Start Bluetooth device scan'));

    expect(startScan).toHaveBeenCalled();
  });

  it('pairs a device', () => {
    const { getByLabelText } = render(<BluetoothSupportComponent />);

    fireEvent.press(getByLabelText('Pair Ledger Nano X'));

    expect(pairDevice).toHaveBeenCalledWith('ledger-nano-x');
  });
});
