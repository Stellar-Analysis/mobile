import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBluetoothSupport } from '@hooks/useBluetoothSupport';

export const BluetoothSupportComponent: React.FC = () => {
  const {
    isSupported,
    isEnabled,
    isOffline,
    isLoading,
    isScanning,
    error,
    devices,
    pairedDevice,
    startScan,
    stopScan,
    pairDevice,
    clearDevices,
  } = useBluetoothSupport();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Bluetooth support screen">
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Support</Text>
        <Text style={styles.subtitle}>
          Discover and pair hardware wallets or payment terminals.
        </Text>
      </View>

      <View
        style={styles.statusCard}
        accessible
        accessibilityLabel={`Bluetooth is ${isSupported ? 'supported' : 'not supported'} and ${
          isEnabled ? 'enabled' : 'disabled'
        }`}>
        <Text style={styles.statusText}>
          {isSupported ? 'Bluetooth available' : 'Bluetooth unavailable'} ·{' '}
          {isEnabled ? 'Enabled' : 'Disabled'}
        </Text>
        {isOffline ? (
          <Text style={styles.offlineText}>Offline mode: cached devices are shown.</Text>
        ) : null}
        {pairedDevice ? <Text style={styles.pairedText}>Paired: {pairedDevice.name}</Text> : null}
      </View>

      {error ? (
        <View
          style={styles.errorCard}
          accessibilityRole="alert"
          accessibilityLabel={`Bluetooth error ${error}`}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.primaryButton,
            (!isSupported || !isEnabled || isLoading || isScanning) && styles.disabledButton,
          ]}
          onPress={startScan}
          disabled={!isSupported || !isEnabled || isLoading || isScanning}
          accessibilityRole="button"
          accessibilityLabel="Start Bluetooth device scan">
          <Text style={styles.primaryText}>Scan Devices</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, !isScanning && styles.disabledButton]}
          onPress={stopScan}
          disabled={!isScanning}
          accessibilityRole="button"
          accessibilityLabel="Stop Bluetooth scan">
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, devices.length === 0 && styles.disabledButton]}
          onPress={clearDevices}
          disabled={devices.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Clear cached Bluetooth devices">
          <Text style={styles.secondaryText}>Clear</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow} accessibilityLabel="Bluetooth loading">
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>
            {isScanning ? 'Scanning for Bluetooth devices...' : 'Initializing Bluetooth...'}
          </Text>
        </View>
      ) : null}

      <View
        style={styles.deviceCard}
        accessibilityLabel={`${devices.length} Bluetooth devices found`}>
        <Text style={styles.cardTitle}>Nearby Devices</Text>
        {devices.length === 0 ? (
          <Text style={styles.emptyText}>No Bluetooth devices discovered yet.</Text>
        ) : (
          devices.map(device => (
            <View
              key={device.id}
              style={styles.deviceRow}
              accessible
              accessibilityLabel={`${device.name}, ${device.type}, signal ${device.signalStrength} dBm`}>
              <View>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.metaText}>
                  {device.type.replace('_', ' ')} · {device.signalStrength} dBm
                </Text>
                <Text style={styles.metaText}>
                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                </Text>
              </View>
              <Pressable
                style={[styles.pairButton, device.paired && styles.pairedButton]}
                onPress={() => pairDevice(device.id)}
                accessibilityRole="button"
                accessibilityLabel={`${device.paired ? 'Paired with' : 'Pair'} ${device.name}`}>
                <Text style={[styles.pairText, device.paired && styles.pairedButtonText]}>
                  {device.paired ? 'Paired' : 'Pair'}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginTop: 6,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ccfbf1',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  statusText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  offlineText: {
    color: '#92400e',
    marginTop: 8,
  },
  pairedText: {
    color: '#047857',
    fontWeight: '700',
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    marginBottom: 14,
    padding: 14,
  },
  errorText: {
    color: '#991b1b',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#0f766e',
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
  },
  deviceRow: {
    alignItems: 'center',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deviceName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  metaText: {
    color: '#64748b',
    marginTop: 4,
  },
  pairButton: {
    borderColor: '#0f766e',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  pairedButton: {
    backgroundColor: '#0f766e',
  },
  pairText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  pairedButtonText: {
    color: '#ffffff',
  },
});
