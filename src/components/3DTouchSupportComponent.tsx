import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { use3DTouchSupport } from '@features/3d_touch_support/use3DTouchSupport';

export const TouchSupportComponent: React.FC = () => {
  const { supported, loading, error, isOffline, actions, lastForce, handlePress } = use3DTouchSupport();

  React.useEffect(() => {
    if (error) Alert.alert('3D Touch Error', error, [{ text: 'OK' }], { cancelable: true });
  }, [error]);

  const forcePercent = lastForce !== null ? Math.round(lastForce * 100) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="3D Touch support screen">
      <View style={styles.header}>
        <Text style={styles.title}>3D Touch</Text>
        <Text style={styles.subtitle}>Pressure-sensitive quick actions on iOS.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {supported ? '3D Touch is supported on this device.' : '3D Touch is not available on this platform.'}
        </Text>

        {isOffline && (
          <Text style={styles.offlineText} accessibilityRole="text">Offline — limited functionality available.</Text>
        )}

        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.loadingText}>Detecting pressure…</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.touchArea, !supported && styles.disabled]}
          onPress={handlePress}
          disabled={!supported || loading}
          accessibilityLabel="3D Touch detection area — press with varying pressure"
          activeOpacity={0.7}>
          <Text style={styles.touchText}>Press Here</Text>
          {forcePercent !== null && (
            <Text style={styles.forceText}>Force: {forcePercent}%</Text>
          )}
        </TouchableOpacity>

        <View style={styles.listCard} accessible accessibilityRole="summary" accessibilityLabel="Available 3D Touch actions">
          <Text style={styles.listTitle}>Quick Actions</Text>
          {actions.map(a => (
            <View key={a.id} style={styles.row} accessible accessibilityRole="button" accessibilityLabel={`${a.title}: ${a.subtitle}`}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionMeta}>{a.subtitle} · {a.type}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          3D Touch enables peek, pop, and quick-action shortcuts on supported iOS devices.
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
  touchArea: { padding: 40, backgroundColor: '#ede9fe', borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  touchText: { fontSize: 18, fontWeight: '600', color: '#7c3aed' },
  forceText: { marginTop: 8, fontSize: 14, color: '#5b21b6' },
  listCard: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#ddd6fe' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ede9fe' },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  actionMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  note: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
});
