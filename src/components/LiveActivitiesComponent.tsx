import React, { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLiveActivities } from '@hooks/useLiveActivities';

export const LiveActivitiesComponent: React.FC = () => {
  const { isSupported, loading, error, activities, startActivity, endActivity, clearActivities } = useLiveActivities();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Live Activities screen">
      <Text style={styles.title}>Live Activities</Text>
      <Text style={styles.subtitle}>Real-time updates on the iOS lock screen.</Text>
      <Text style={styles.status} accessibilityRole="text">
        {isSupported ? 'Live Activities supported on this device.' : 'Live Activities require iOS.'}
      </Text>

      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {loading ? (
        <View style={styles.row}><ActivityIndicator size="small" color="#059669" /><Text style={styles.loadingText}>Loading…</Text></View>
      ) : null}

      <Text style={styles.sectionTitle}>Start New Activity</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} accessibilityLabel="Activity title input" />
      <TextInput style={styles.input} placeholder="Subtitle" value={subtitle} onChangeText={setSubtitle} accessibilityLabel="Activity subtitle input" />
      <Button title="Start Activity" onPress={() => { void startActivity(title, subtitle); setTitle(''); setSubtitle(''); }} disabled={!isSupported || loading || !title} accessibilityLabel="Start live activity" />

      <View style={styles.logCard} accessibilityRole="summary" accessibilityLabel="Live Activities log">
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Activities</Text>
          {activities.length > 0 ? <Button title="Clear" onPress={() => void clearActivities()} accessibilityLabel="Clear activities" /> : null}
        </View>
        {activities.length === 0
          ? <Text style={styles.empty}>No activities yet.</Text>
          : activities.map(a => (
            <View key={a.id} style={styles.itemRow} accessibilityRole="text" accessibilityLabel={`${a.title} ${a.status}`}>
              <View>
                <Text style={styles.itemName}>{a.title}</Text>
                <Text style={styles.meta}>{a.subtitle} · {a.status} · {new Date(a.startedAt).toLocaleTimeString()}</Text>
              </View>
              {a.status === 'active'
                ? <Button title="End" onPress={() => void endActivity(a.id)} accessibilityLabel={`End ${a.title}`} />
                : <Text style={styles.ended}>Ended</Text>}
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
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 14 },
  logCard: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ended: { fontSize: 12, color: '#94a3b8' },
  empty: { fontSize: 14, color: '#475569' },
});
