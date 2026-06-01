import React, { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppClips } from '@hooks/useAppClips';

const SAMPLE_CLIPS = [
  { url: 'https://stellar-insights.app/clips/dashboard', title: 'Dashboard Clip' },
  { url: 'https://stellar-insights.app/clips/anchors', title: 'Anchors Clip' },
];

export const AppClipsComponent: React.FC = () => {
  const { isSupported, loading, error, clips, launchClip, clearClips } = useAppClips();
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="App Clips screen">
      <Text style={styles.title}>App Clips</Text>
      <Text style={styles.subtitle}>Lightweight iOS experiences without full app install.</Text>
      <Text style={styles.status} accessibilityRole="text">
        {isSupported ? 'App Clips supported on this device.' : 'App Clips require iOS.'}
      </Text>

      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {loading ? (
        <View style={styles.row}><ActivityIndicator size="small" color="#059669" /><Text style={styles.loadingText}>Loading…</Text></View>
      ) : null}

      <Text style={styles.sectionTitle}>Sample Clips</Text>
      {SAMPLE_CLIPS.map(clip => (
        <View key={clip.url} style={styles.itemRow}>
          <Text style={styles.itemName}>{clip.title}</Text>
          <Button title="Launch" onPress={() => void launchClip(clip.url, clip.title)} disabled={!isSupported || loading} accessibilityLabel={`Launch ${clip.title}`} />
        </View>
      ))}

      <Text style={styles.sectionTitle}>Custom Clip</Text>
      <TextInput style={styles.input} placeholder="URL" value={customUrl} onChangeText={setCustomUrl} accessibilityLabel="Clip URL input" />
      <TextInput style={styles.input} placeholder="Title" value={customTitle} onChangeText={setCustomTitle} accessibilityLabel="Clip title input" />
      <Button title="Launch Custom Clip" onPress={() => { void launchClip(customUrl, customTitle); setCustomUrl(''); setCustomTitle(''); }} disabled={!isSupported || loading || !customUrl} accessibilityLabel="Launch custom clip" />

      <View style={styles.logCard} accessibilityRole="summary" accessibilityLabel="App Clips launch log">
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Launch Log</Text>
          {clips.length > 0 ? <Button title="Clear" onPress={() => void clearClips()} accessibilityLabel="Clear clips log" /> : null}
        </View>
        {clips.length === 0
          ? <Text style={styles.empty}>No clips launched yet.</Text>
          : clips.map(c => (
            <View key={c.id} style={styles.logRow} accessibilityRole="text" accessibilityLabel={`${c.title} ${c.status}`}>
              <Text style={[styles.itemName, c.status === 'failed' && styles.failed]}>{c.title}</Text>
              <Text style={styles.meta}>{c.status} · {new Date(c.launchedAt).toLocaleTimeString()}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#4b5563', marginBottom: 12 },
  status: { fontSize: 14, color: '#059669', marginBottom: 8 },
  error: { fontSize: 13, color: '#b91c1c', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  loadingText: { color: '#059669' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 16, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 14 },
  logCard: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  failed: { color: '#b91c1c' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { fontSize: 14, color: '#475569' },
});
