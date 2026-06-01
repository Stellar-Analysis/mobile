import React from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePhotoGallery } from '@hooks/usePhotoGallery';
import type { PhotoAsset } from '../features/photo_gallery';

export const PhotoGalleryComponent: React.FC = () => {
  const {
    permissionStatus,
    photos,
    selectedIds,
    uploadProgress,
    loading,
    error,
    isOffline,
    requestPermission,
    loadPhotos,
    toggleSelection,
    clearSelection,
    uploadSelected,
  } = usePhotoGallery();

  const renderPhoto = ({ item }: { item: PhotoAsset }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item.id)}
        style={[styles.photoCell, isSelected && styles.photoCellSelected]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Photo ${item.filename}${isSelected ? ', selected' : ''}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.photoImage}
          accessibilityLabel={item.filename}
        />
        {isSelected ? (
          <View style={styles.selectedOverlay} accessibilityElementsHidden>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      accessibilityLabel="Photo gallery screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Photo Gallery</Text>
        <Text style={styles.subtitle}>
          Browse and select photos to upload or share.
        </Text>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            Offline — uploads will be queued until reconnected.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLabel={error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && uploadProgress === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading photos…</Text>
        </View>
      ) : null}

      {loading && uploadProgress > 0 ? (
        <View style={styles.progressContainer} accessibilityRole="progressbar" accessibilityLabel={`Upload progress ${uploadProgress} percent`}>
          <Text style={styles.progressLabel}>Uploading… {uploadProgress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      ) : null}

      <View style={styles.controls}>
        {permissionStatus !== 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Request Photo Library Permission"
              onPress={() => void requestPermission()}
              disabled={loading}
              accessibilityLabel="Request photo library permission"
            />
          </View>
        ) : null}

        {permissionStatus === 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Load Photos"
              onPress={() => void loadPhotos()}
              disabled={loading}
              accessibilityLabel="Load photos from library"
            />
          </View>
        ) : null}

        {selectedIds.length > 0 ? (
          <>
            <View style={styles.buttonWrapper}>
              <Button
                title={`Upload Selected (${selectedIds.length})`}
                onPress={() => void uploadSelected()}
                disabled={loading}
                accessibilityLabel={`Upload ${selectedIds.length} selected photos`}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                title="Clear Selection"
                onPress={clearSelection}
                disabled={loading}
                accessibilityLabel="Clear photo selection"
              />
            </View>
          </>
        ) : null}
      </View>

      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={item => item.id}
          numColumns={3}
          scrollEnabled={false}
          accessible
          accessibilityLabel={`Photo grid with ${photos.length} photos`}
          contentContainerStyle={styles.grid}
        />
      ) : (
        permissionStatus === 'granted' && !loading ? (
          <Text style={styles.emptyText} accessibilityRole="text">
            No photos found. Tap "Load Photos" to browse your library.
          </Text>
        ) : null
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 15, color: '#4b5563' },
  offlineBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  offlineText: { color: '#92400e', fontSize: 13 },
  errorBox: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: { color: '#991b1b', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  loadingText: { color: '#0f766e' },
  progressContainer: { marginBottom: 16 },
  progressLabel: { fontSize: 13, color: '#0f766e', marginBottom: 6 },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#0f766e', borderRadius: 3 },
  controls: { gap: 10, marginBottom: 20 },
  buttonWrapper: { borderRadius: 8, overflow: 'hidden' },
  grid: { gap: 4 },
  photoCell: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoCellSelected: { borderColor: '#0f766e' },
  photoImage: { width: '100%', height: '100%' },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { fontSize: 24, color: '#ffffff', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 20 },
});
