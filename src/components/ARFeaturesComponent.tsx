import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Platform,
} from 'react-native';
import { useARFeatures } from '../hooks/useARFeatures';
import type { ARFeaturesConfig, ARMarker } from '../features/ar_features/types';

interface ARFeaturesComponentProps {
  config?: Partial<ARFeaturesConfig>;
  /** Render function for AR camera view — wire to ViroReact or expo-camera */
  renderCamera?: () => React.ReactNode;
}

export const ARFeaturesComponent: React.FC<ARFeaturesComponentProps> = ({ config, renderCamera }) => {
  const {
    permissionStatus, isSessionActive, markers, error, isLoading, isSupported,
    requestPermission, startSession, stopSession,
  } = useARFeatures(config);

  if (!isSupported) {
    return (
      <View style={styles.center} accessibilityRole="alert">
        <Text style={styles.unsupportedText}>AR is not supported on this device.</Text>
        <Text style={styles.unsupportedSub}>Requires iOS 11+ or Android 7.0+</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="AR features view">
      {/* Camera / AR scene */}
      <View style={styles.cameraContainer} accessibilityRole="image" accessibilityLabel="AR camera feed">
        {isSessionActive && renderCamera ? renderCamera() : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.placeholderText}>AR session inactive</Text>
          </View>
        )}
      </View>

      {/* AR marker overlays */}
      {isSessionActive && markers.filter(m => m.visible).map((marker: ARMarker) => (
        <View
          key={marker.id}
          style={[styles.markerOverlay, { left: marker.screenPos.x, top: marker.screenPos.y }]}
          accessibilityRole="text"
          accessibilityLabel={`${marker.label}: ${marker.value}`}
        >
          <Text style={styles.markerLabel}>{marker.label}</Text>
          <Text style={styles.markerValue}>{marker.value}</Text>
        </View>
      ))}

      {/* Controls */}
      <View style={styles.controls} accessibilityRole="toolbar">
        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Request camera permission for AR"
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
        )}

        {permissionStatus === 'granted' && (
          <TouchableOpacity
            style={[styles.button, isSessionActive && styles.buttonStop]}
            onPress={isSessionActive ? stopSession : startSession}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isSessionActive ? 'Stop AR session' : 'Start AR session'}
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{isSessionActive ? 'Stop AR' : 'Start AR'}</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Marker count badge */}
      {isSessionActive && markers.length > 0 && (
        <View style={styles.badge} accessibilityLabel={`${markers.length} AR markers active`}>
          <Text style={styles.badgeText}>{markers.length}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  unsupportedText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  unsupportedSub: { fontSize: 14, color: '#666' },
  cameraContainer: { flex: 1 },
  cameraPlaceholder: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#555', fontSize: 14 },
  markerOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  markerLabel: { color: '#aaa', fontSize: 11, marginBottom: 2 },
  markerValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: { backgroundColor: '#3b82f6', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 32 },
  buttonStop: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fef2f2',
    padding: 12,
  },
  errorText: { color: '#dc2626', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default ARFeaturesComponent;
