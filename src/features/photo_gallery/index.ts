export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime?: number;
}

export interface GalleryState {
  permissionStatus: 'not_requested' | 'granted' | 'denied' | 'unavailable';
  photos: PhotoAsset[];
  selectedIds: Set<string>;
  uploadProgress: number;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export const MOCK_PHOTOS: PhotoAsset[] = [
  { id: '1', uri: 'file://photo1.jpg', filename: 'photo1.jpg', width: 1080, height: 1920 },
  { id: '2', uri: 'file://photo2.jpg', filename: 'photo2.jpg', width: 1080, height: 1920 },
  { id: '3', uri: 'file://photo3.jpg', filename: 'photo3.jpg', width: 1920, height: 1080 },
];
