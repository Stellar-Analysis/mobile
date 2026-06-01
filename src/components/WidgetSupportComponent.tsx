import React from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useWidgetSupport } from '@features/widget_support/useWidgetSupport';

export const WidgetSupportComponent: React.FC = () => {
  const { supported, loading, error, isOffline, widgets, refresh, removeWidget } = useWidgetSupport();

  React.useEffect(() => {
    if (error) Alert.alert('Widget Error', error, [{ text: 'OK' }], { cancelable: true });
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Widget support screen">
      <View style={styles.header}>
        <Text style={styles.title}>Widget Support</Text>
        <Text style={styles.subtitle}>Home screen widgets for quick access to key data.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {supported ? 'Widgets are supported on this device.' : 'Widgets are not supported on this platform.'}
        </Text>

        {isOffline && (
          <Text style={styles.offlineText} accessibilityRole="text">Offline — showing cached widgets.</Text>
        )}

        {loading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#1F7A8C" />
            <Text style={styles.loadingText}>Loading widgets…</Text>
          </View>
        )}

        <Button
          title="Refresh Widgets"
          onPress={() => void refresh()}
          disabled={!supported || loading}
          accessibilityLabel="Refresh home screen widgets"
        />

        <View style={styles.listCard} accessible accessibilityRole="summary" accessibilityLabel="Widget list">
          <Text style={styles.listTitle}>Configured Widgets</Text>
          {widgets.length === 0 ? (
            <Text style={styles.emptyText}>No widgets configured.</Text>
          ) : (
            widgets.map(w => (
              <View key={w.id} style={styles.row} accessible accessibilityRole="button" accessibilityLabel={`${w.title} widget, ${w.kind} size`}>
                <View style={styles.info}>
                  <Text style={styles.widgetTitle}>{w.title}</Text>
                  <Text style={styles.widgetMeta}>Size: {w.kind} · Route: {w.route}</Text>
                </View>
                <Button
                  title="Remove"
                  onPress={() => void removeWidget(w.id)}
                  disabled={loading}
                  accessibilityLabel={`Remove ${w.title} widget`}
                />
              </View>
            ))
          )}
        </View>

        <Text style={styles.note}>
          Widgets provide at-a-glance information directly on the home screen for iOS and Android.
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
  listCard: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#475569' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1fae5' },
  info: { flex: 1 },
  widgetTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  widgetMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  note: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
});
