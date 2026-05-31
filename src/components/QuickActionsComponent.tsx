import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuickActions } from '@hooks/useQuickActions';

export const QuickActionsComponent: React.FC = () => {
  const { isSupported, loading, error, isOffline, actions, refreshActions, pinAction } =
    useQuickActions();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Quick actions screen">
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <Text style={styles.subtitle}>Home screen shortcuts for fast navigation.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Quick actions are available on this device.'
            : 'Quick actions are not supported on this platform.'}
        </Text>

        {isOffline ? (
          <Text style={styles.offlineText} accessibilityRole="text">
            Offline — showing cached shortcuts.
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Loading quick actions…</Text>
          </View>
        ) : null}

        <Button
          title="Refresh Actions"
          onPress={() => void refreshActions()}
          disabled={!isSupported || loading}
          accessibilityLabel="Refresh quick actions"
        />

        <View style={styles.listCard} accessible accessibilityRole="summary" accessibilityLabel="Quick actions list">
          <Text style={styles.listTitle}>Pinned Shortcuts</Text>
          {actions.length === 0 ? (
            <Text style={styles.emptyText}>No quick actions configured.</Text>
          ) : (
            actions.map(action => (
              <View
                key={action.id}
                style={styles.actionRow}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${action.title}, route ${action.route}`}
              >
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionMeta}>Route: {action.route}</Text>
                </View>
                <Button
                  title="Pin"
                  onPress={() => void pinAction(action.id)}
                  disabled={!isSupported || loading}
                  accessibilityLabel={`Pin ${action.title} to top`}
                />
              </View>
            ))
          )}
        </View>
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
  status: { fontSize: 14, color: '#2563eb' },
  offlineText: { fontSize: 13, color: '#92400e' },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  loadingText: { color: '#2563eb' },
  listCard: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#475569' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#dbeafe' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  actionMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
