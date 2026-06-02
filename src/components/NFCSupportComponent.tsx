import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNFCSupport } from '@hooks/useNFCSupport';
import type { NFCMode } from '@features/nfc_support';

export const NFCSupportComponent: React.FC = () => {
  const {
    isSupported,
    isEnabled,
    isOffline,
    isLoading,
    isScanning,
    error,
    lastResult,
    cachedResults,
    startSession,
    stopSession,
    clearCachedResults,
  } = useNFCSupport();

  const runSession = (mode: NFCMode) => {
    startSession(mode);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="NFC support screen">
      <View style={styles.header}>
        <Text style={styles.title}>NFC Support</Text>
        <Text style={styles.subtitle}>Tap-to-pay and hardware authentication readiness.</Text>
      </View>

      <View
        style={styles.statusCard}
        accessible
        accessibilityLabel={`NFC is ${isSupported ? 'supported' : 'not supported'} and ${
          isEnabled ? 'enabled' : 'disabled'
        }`}>
        <Text style={styles.statusText}>
          {isSupported ? 'NFC available' : 'NFC unavailable'} · {isEnabled ? 'Enabled' : 'Disabled'}
        </Text>
        {isOffline ? (
          <Text style={styles.offlineText}>Offline mode: sessions will be cached.</Text>
        ) : null}
      </View>

      {error ? (
        <View
          style={styles.errorCard}
          accessibilityRole="alert"
          accessibilityLabel={`NFC error ${error}`}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.primaryButton,
            (!isSupported || !isEnabled || isLoading || isScanning) && styles.disabledButton,
          ]}
          onPress={() => runSession('tap_to_pay')}
          disabled={!isSupported || !isEnabled || isLoading || isScanning}
          accessibilityRole="button"
          accessibilityLabel="Start NFC tap to pay session">
          <Text style={styles.primaryText}>Tap to Pay</Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButton,
            (!isSupported || !isEnabled || isLoading || isScanning) && styles.disabledButton,
          ]}
          onPress={() => runSession('hardware_authentication')}
          disabled={!isSupported || !isEnabled || isLoading || isScanning}
          accessibilityRole="button"
          accessibilityLabel="Start NFC hardware authentication session">
          <Text style={styles.secondaryText}>Hardware Auth</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, !isScanning && styles.disabledButton]}
          onPress={stopSession}
          disabled={!isScanning}
          accessibilityRole="button"
          accessibilityLabel="Stop NFC session">
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow} accessibilityLabel="NFC loading">
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>
            {isScanning ? 'Waiting for NFC tag...' : 'Initializing NFC...'}
          </Text>
        </View>
      ) : null}

      {lastResult ? (
        <View
          style={styles.resultCard}
          accessible
          accessibilityLabel={`Last NFC result ${lastResult.message}`}>
          <Text style={styles.cardTitle}>Latest Session</Text>
          <Text style={styles.resultText}>{lastResult.message}</Text>
          <Text style={styles.metaText}>Mode: {lastResult.mode.replace('_', ' ')}</Text>
          <Text style={styles.metaText}>Status: {lastResult.status}</Text>
        </View>
      ) : null}

      <View
        style={styles.resultCard}
        accessibilityLabel={`${cachedResults.length} cached NFC sessions`}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Cached Sessions</Text>
          <Pressable
            onPress={clearCachedResults}
            disabled={cachedResults.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Clear cached NFC sessions">
            <Text style={[styles.clearText, cachedResults.length === 0 && styles.disabledText]}>
              Clear
            </Text>
          </Pressable>
        </View>

        {cachedResults.length === 0 ? (
          <Text style={styles.emptyText}>No NFC sessions cached yet.</Text>
        ) : (
          cachedResults.map(result => (
            <View key={result.id} style={styles.listRow}>
              <Text style={styles.resultText}>{result.message}</Text>
              <Text style={styles.metaText}>{new Date(result.createdAt).toLocaleString()}</Text>
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
    borderColor: '#dbeafe',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  statusText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  offlineText: {
    color: '#92400e',
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
    backgroundColor: '#2563eb',
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
  disabledText: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#1d4ed8',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  metaText: {
    color: '#64748b',
    marginTop: 4,
  },
  clearText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
  },
  listRow: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
});
