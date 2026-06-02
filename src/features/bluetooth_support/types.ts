export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'hardware_wallet' | 'payment_terminal';
  signalStrength: number;
  paired: boolean;
  lastSeen: string;
}

export interface BluetoothState {
  isSupported: boolean;
  isEnabled: boolean;
  isOffline: boolean;
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  devices: BluetoothDevice[];
  pairedDevice: BluetoothDevice | null;
}
