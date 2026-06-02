export type NFCMode = 'tap_to_pay' | 'hardware_authentication';

export interface NFCSessionResult {
  id: string;
  mode: NFCMode;
  status: 'completed' | 'cached';
  message: string;
  createdAt: string;
}

export interface NFCState {
  isSupported: boolean;
  isEnabled: boolean;
  isOffline: boolean;
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  lastResult: NFCSessionResult | null;
  cachedResults: NFCSessionResult[];
}
