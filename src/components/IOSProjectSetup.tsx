import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIOSProjectSetup } from '@hooks/useIOSProjectSetup';

export const IOSProjectSetup: React.FC = () => {
  const { status, isIOS, osVersion, isSupported, recheck } = useIOSProjectSetup();

  const statusLabel =
    status === 'checking' ? 'Checking…' : isSupported ? 'Ready' : 'Unsupported version';

  return (
    <View style={styles.container} accessibilityLabel="iOS Project Setup">
      <Text style={styles.title} accessibilityRole="header">
        iOS Project Setup
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Platform</Text>
        <Text style={styles.value} accessibilityLabel={`Platform: ${Platform.OS}`}>
          {Platform.OS}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>OS Version</Text>
        <Text style={styles.value} accessibilityLabel={`OS Version: ${osVersion}`}>
          {osVersion}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text
          style={[styles.value, isSupported ? styles.ready : styles.unsupported]}
          accessibilityRole="text"
          accessibilityLabel={`Status: ${statusLabel}`}
        >
          {statusLabel}
        </Text>
      </View>

      {isIOS && !isSupported && (
        <Text style={styles.warning} accessibilityRole="alert">
          iOS 14 or later is required.
        </Text>
      )}

      <Pressable
        onPress={recheck}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Recheck iOS setup"
      >
        <Text style={styles.buttonText}>Recheck</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 15,
    color: '#6b7280',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  ready: {
    color: '#16a34a',
  },
  unsupported: {
    color: '#dc2626',
  },
  warning: {
    marginTop: 16,
    color: '#dc2626',
    fontSize: 13,
  },
  button: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2563eb',
    borderRadius: Platform.select({ ios: 12, android: 8, default: 8 }),
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
