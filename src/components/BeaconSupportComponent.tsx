import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBeaconSupport } from '@features/beacon_support/useBeaconSupport';

export const BeaconSupportComponent: React.FC = () => {
  const { loading, error, isSupported, isScanning, beacons, startScan, stopScan } = useBeaconSupport();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Beacon support screen">
      <View style={styles.header}>
        <Text style={styles.title}>Beacon Support</Text>
        <Text style={styles.subtitle}>Detect nearby devices and proximity events for contextual experiences.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Beacon scanning is available. Start to detect nearby transmitters.'
            : 'Beacon scanning is not supported on this device.'}
        </Text>

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#047857" />
            <Text style={styles.loadingText}>Scanning for beacons…</Text>
          </View>
        ) : null}

        <View style={styles.buttonGroup}>
          <Button
            title={isScanning ? 'Stop Scanning' : 'Start Beacon Scan'}
            onPress={isScanning ? stopScan : startScan}
            disabled={!isSupported || loading}
            accessibilityLabel={isScanning ? 'Stop beacon scanning' : 'Start beacon scanning'}
          />
        </View>

        <View style={styles.beaconList} accessible accessibilityRole="summary">
          <Text style={styles.listTitle}>Nearby beacons</Text>
          {beacons.length === 0 ? (
            <Text style={styles.listItem}>No beacons found yet.</Text>
          ) : (
            beacons.map(beacon => (
              <Text key={beacon} style={styles.listItem}>
                {beacon}
              </Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#4b5563',
  },
  body: {
    gap: 14,
  },
  status: {
    fontSize: 14,
    color: '#065f46',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    marginTop: 8,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  loadingText: {
    color: '#065f46',
  },
  buttonGroup: {
    marginTop: 10,
  },
  beaconList: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0f172a',
  },
  listItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
});