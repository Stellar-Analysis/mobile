export type ARPermissionStatus = 'not_requested' | 'granted' | 'denied' | 'unavailable';

export type AROverlayType =
  | 'stellar_transaction'
  | 'price_ticker'
  | 'network_stats'
  | 'anchor_info';

export interface ARMarker {
  id: string;
  type: AROverlayType;
  label: string;
  value: string;
  position?: { x: number; y: number; z: number };
  screenPos: { x: number; y: number };
  visible: boolean;
}

export interface ARFeaturesConfig {
  planeDetection: boolean;
  overlayOnly: boolean;
  maxMarkers: number;
  markerTTL: number;
}

export interface ARFeaturesState {
  permissionStatus: ARPermissionStatus;
  isSessionActive: boolean;
  markers: ARMarker[];
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}
