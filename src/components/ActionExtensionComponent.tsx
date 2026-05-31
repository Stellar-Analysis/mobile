import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useActionExtension } from '@hooks/useActionExtension';

export const ActionExtensionComponent: React.FC = () => {
  const {
    isSupported,
    loading,
    error,
    isOffline,
    actions,
    availableActions,
    executeAction,
    clearActions,
    syncOfflineQueue,
  } = useActionExtension();
  const [payload, setPayload] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Action extension screen">
      <View style={styles.header}>
        <Text style={styles.title}>Action Extension</Text>
        <Text style={styles.subtitle}>Run Stellar actions from other apps.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Action extension is available on this device.'
            : 'Action extension is not supported on this platform.'}
        </Text>

        {isOffline ? (
          <Text style={styles.offlineText} accessibilityRole="text">
            Offline — actions will be queued until connected.
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Action payload (optional)"
          value={payload}
          onChangeText={setPayload}
          accessibilityLabel="Action payload input"
        />

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Executing action…</Text>
          </View>
        ) : null}

        <View style={styles.actionList} accessible accessibilityLabel="Available actions">
          <Text style={styles.listTitle}>Available Actions</Text>
          {availableActions.map(action => (
            <View key={action.type} style={styles.actionRow}>
              <Text style={styles.actionName}>{action.label}</Text>
              <Button
                title="Run"
                onPress={() => void executeAction(action.type, payload)}
                disabled={!isSupported || loading}
                accessibilityLabel={`Execute ${action.label}`}
              />
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          {!isOffline ? (
            <Button
              title="Sync Queue"
              onPress={() => void syncOfflineQueue()}
              disabled={loading}
              accessibilityLabel="Sync offline action queue"
            />
          ) : null}
          {actions.length > 0 ? (
            <Button
              title="Clear Log"
              onPress={() => void clearActions()}
              accessibilityLabel="Clear action log"
            />
          ) : null}
        </View>

        <View style={styles.logCard} accessible accessibilityRole="summary" accessibilityLabel="Action execution log">
          <Text style={styles.listTitle}>Execution Log</Text>
          {actions.length === 0 ? (
            <Text style={styles.emptyText}>No actions executed yet.</Text>
          ) : (
            actions.map(item => (
              <View
                key={item.id}
                style={styles.logRow}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${item.actionType} ${item.status}`}
              >
                <Text style={[styles.logName, item.status === 'failed' && styles.failed]}>
                  {item.actionType}
                </Text>
                <Text style={styles.logMeta}>
                  {item.status} · {new Date(item.executedAt).toLocaleTimeString()}
                </Text>
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
  status: { fontSize: 14, color: '#059669' },
  offlineText: { fontSize: 13, color: '#92400e' },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  loadingText: { color: '#059669' },
  actionList: { padding: 16, borderRadius: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1fae5' },
  actionName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  logCard: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#475569' },
  logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  logName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  failed: { color: '#b91c1c' },
  logMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
