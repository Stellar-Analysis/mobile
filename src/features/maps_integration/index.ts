export interface MapLocation {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export interface MapsState {
  permissionStatus: 'not_requested' | 'granted' | 'denied' | 'unavailable';
  currentLocation: MapLocation | null;
  markers: MapLocation[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export const DEFAULT_LOCATION: MapLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
  title: 'San Francisco',
  description: 'Default location',
};
