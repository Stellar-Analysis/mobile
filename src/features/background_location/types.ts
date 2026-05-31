export type LocationPermissionStatus =
  | 'not_requested'
  | 'foreground_only'
  | 'background_granted'
  | 'denied'
  | 'unavailable';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface BackgroundLocationConfig {
  distanceFilter: number;
  interval: number;
  deferredUpdatesDistance?: number;
  showsBackgroundLocationIndicator: boolean;
  notificationTitle?: string;
  notificationBody?: string;
}

export interface BackgroundLocationState {
  permissionStatus: LocationPermissionStatus;
  isTracking: boolean;
  lastLocation: LocationCoordinates | null;
  locationHistory: LocationCoordinates[];
  error: string | null;
  isLoading: boolean;
}
