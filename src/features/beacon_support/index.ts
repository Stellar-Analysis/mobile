export interface BeaconSupportRecord {
  id: string;
  signalStrength: number;
  lastSeen: string;
}

export const DEFAULT_BEACONS: BeaconSupportRecord[] = [];
