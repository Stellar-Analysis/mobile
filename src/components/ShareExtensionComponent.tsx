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
import { useShareExtension } from '@hooks/useShareExtension';

export const ShareExtensionComponent: React.FC = () => {
  const {
    isSupported,
    loading,
    error,
    isOffline,
    sharedItems,
    receiveShare,
    clearShares,
    syncOfflineQueue,
  } = useShareExtension();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleReceive = () => {
    if (!title.trim() || !content.trim()) return;
    void receiveShare(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Share extension screen">
      <View style={styles.header}>
        <Text style={styles.title}>Share Extension</Text>
        <Text style={styles.subtitle}>Receive content shared from other apps.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Share extension is available on this device.'
            : 'Share extension is not supported on this platform.'}
        </Text>

        {isOffline ? (
          <Text style={styles.offlineText} accessibilityRole="text">
            Offline — shares will be queued until connected.
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Share title"
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Share title input"
          />
          <TextInput
            style={styles.input}
            placeholder="Shared content (URL or text)"
            value={content}
            onChangeText={setContent}
            multiline
            accessibilityLabel="Shared content input"
          />
          <Button
            title="Simulate Share"
            onPress={handleReceive}
            disabled={!isSupported || loading || !title.trim() || !content.trim()}
            accessibilityLabel="Simulate receiving shared content"
          />
        </View>

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.loadingText}>Processing share…</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          {!isOffline ? (
            <Button
              title="Sync Queue"
              onPress={() => void syncOfflineQueue()}
              disabled={loading}
              accessibilityLabel="Sync offline share queue"
            />
          ) : null}
          {sharedItems.length > 0 ? (
            <Button
              title="Clear"
              onPress={() => void clearShares()}
              accessibilityLabel="Clear shared items"
            />
          ) : null}
        </View>

        <View style={styles.listCard} accessible accessibilityRole="summary" accessibilityLabel="Shared items list">
          <Text style={styles.listTitle}>Received Shares</Text>
          {sharedItems.length === 0 ? (
            <Text style={styles.emptyText}>No shared content yet.</Text>
          ) : (
            sharedItems.map(item => (
              <View
                key={item.id}
                style={styles.itemRow}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${item.title} from ${item.sourceApp}`}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {item.sourceApp} · {new Date(item.receivedAt).toLocaleTimeString()}
                </Text>
                <Text style={styles.itemContent} numberOfLines={2}>{item.content}</Text>
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
  status: { fontSize: 14, color: '#7c3aed' },
  offlineText: { fontSize: 13, color: '#92400e' },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  form: { gap: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  loadingText: { color: '#7c3aed' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  listCard: { marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ddd6fe' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#475569' },
  itemRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9d5ff' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemContent: { fontSize: 12, color: '#475569', marginTop: 4 },
});
