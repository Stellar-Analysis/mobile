import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMapsIntegration } from '@hooks/useMapsIntegration';

export const MapsIntegrationComponent: React.FC = () => {
  const {
    permissionStatus,
    currentLocation,
    markers,
    loading,
    error,
    isOffline,
    requestPermission,
    getCurrentLocation,
    clearMarkers,
  } = useMapsIntegration();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      accessibilityLabel="Maps integration screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Maps</Text>
        <Text style={styles.subtitle}>
          View your location and explore nearby points of interest.
        </Text>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            Offline — showing last known location.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLabel={error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.mapPlaceholder} accessible accessibilityLabel="Map view area">
        {currentLocation ? (
          <View>
            <Text style={styles.mapLabel} accessibilityRole="text">
              Lat: {currentLocation.latitude.toFixed(5)}, Lon:{' '}
              {currentLocation.longitude.toFixed(5)}
            </Text>
            {currentLocation.title ? (
              <Text style={styles.mapSubLabel} accessibilityRole="text">
                {currentLocation.title}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.mapPlaceholderText} accessibilityRole="text">
            No location loaded yet.
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading location…</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        {permissionStatus !== 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Request Location Permission"
              onPress={() => void requestPermission()}
              disabled={loading}
              accessibilityLabel="Request location permission"
            />
          </View>
        ) : null}

        {permissionStatus === 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Get Current Location"
              onPress={() => void getCurrentLocation()}
              disabled={loading}
              accessibilityLabel="Get current location"
            />
          </View>
        ) : null}

        {markers.length > 0 ? (
          <View style={styles.buttonWrapper}>
            <Button
              title={`Clear Markers (${markers.length})`}
              onPress={clearMarkers}
              accessibilityLabel={`Clear ${markers.length} map markers`}
            />
          </View>
        ) : null}
      </View>

      {markers.length > 0 ? (
        <View style={styles.markerList} accessible accessibilityLabel="Map markers list">
          <Text style={styles.listTitle}>Markers</Text>
          {markers.map((m, i) => (
            <View
              key={i}
              style={styles.markerRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Marker ${i + 1}: ${m.title ?? 'unnamed'} at ${m.latitude.toFixed(4)}, ${m.longitude.toFixed(4)}`}
            >
              <Text style={styles.markerTitle}>{m.title ?? `Marker ${i + 1}`}</Text>
              <Text style={styles.markerCoords}>
                {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.statusCard} accessible accessibilityLabel="Permission status">
        <Text style={styles.statusLabel}>Permission: </Text>
        <Text
          style={styles.statusValue}
          accessibilityRole="text"
          accessibilityLabel={`Location permission status: ${permissionStatus}`}
        >
          {permissionStatus}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#ffffff' },
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
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  mapLabel: { fontSize: 14, color: '#0f172a', fontWeight: '600', textAlign: 'center' },
  mapSubLabel: { fontSize: 13, color: '#475569', marginTop: 4, textAlign: 'center' },
  mapPlaceholderText: { color: '#94a3b8', fontSize: 14 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: { color: '#0f766e' },
  controls: { gap: 10, marginBottom: 20 },
  buttonWrapper: { borderRadius: 8, overflow: 'hidden' },
  markerList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  markerRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  markerTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  markerCoords: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  statusLabel: { fontSize: 13, color: '#475569' },
  statusValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
});
