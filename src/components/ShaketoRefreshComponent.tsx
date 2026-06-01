import React from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShaketoRefresh } from '@features/shake_to_refresh/useShaketoRefresh';

export const ShaketoRefreshComponent: React.FC = () => {
  const [refreshLog, setRefreshLog] = React.useState<string[]>([]);

  const onRefresh = React.useCallback(async () => {
    await new Promise<void>(r => setTimeout(r, 600));
    setRefreshLog(prev => [`Refreshed at ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 4)]);
  }, []);

  const { supported, loading, error, isOffline, shakeCount, lastShakeAt, triggerRefresh, reset } =
    useShaketoRefresh(onRefresh);

  React.useEffect(() => {
    if (error) Alert.alert('Shake Error', error, [{ text: 'OK' }], { cancelable: true });
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Shake to refresh screen">
      <View style={styles.header}>
        <Text style={styles.title}>Shake to Refresh</Text>
        <Text style={styles.subtitle}>Shake your device to trigger a data refresh.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {supported ? 'Shake to refresh is supported on this device.' : 'Not supported on this platform.'}
        </Text>

        {isOffline && (
          <Text style={styles.offlineText} accessibilityRole="text">Offline — refresh will sync when reconnected.</Text>
        )}

        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#0891b2" />
            <Text style={styles.loadingText}>Refreshing…</Text>
          </View>
        )}

        <View style={styles.statsCard} accessible accessibilityRole="summary" accessibilityLabel="Shake statistics">
          <Text style={styles.statLabel}>Shake count: <Text style={styles.statValue}>{shakeCount}</Text></Text>
          <Text style={styles.statLabel}>
            Last shake: <Text style={styles.statValue}>{lastShakeAt ? new Date(lastShakeAt).toLocaleTimeString() : 'None'}</Text>
          </Text>
        </View>

        <Button
          title="Simulate Shake"
          onPress={() => void triggerRefresh()}
          disabled={!supported || loading}
          accessibilityLabel="Simulate a shake gesture to refresh"
        />
        <Button
          title="Reset Counter"
          onPress={reset}
          disabled={loading}
          accessibilityLabel="Reset shake counter"
        />

        {refreshLog.length > 0 && (
          <View style={styles.logCard} accessible accessibilityRole="summary" accessibilityLabel="Refresh log">
            <Text style={styles.logTitle}>Refresh Log</Text>
            {refreshLog.map((entry, i) => (
              <Text key={i} style={styles.logEntry}>{entry}</Text>
            ))}
          </View>
        )}

        <Text style={styles.note}>
          Shake detection works on both iOS and Android as an alternative refresh method.
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
  body: { gap: 14 },
  status: { fontSize: 14, color: '#374151' },
  offlineText: { fontSize: 13, color: '#92400e' },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#6B7280' },
  statsCard: { padding: 16, borderRadius: 12, backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#a5f3fc' },
  statLabel: { fontSize: 14, color: '#374151', marginBottom: 4 },
  statValue: { fontWeight: '700', color: '#0891b2' },
  logCard: { padding: 16, borderRadius: 12, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd' },
  logTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  logEntry: { fontSize: 13, color: '#475569', marginBottom: 2 },
  note: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
});
