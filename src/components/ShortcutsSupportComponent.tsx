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
import { useShortcutsSupport } from '@features/shortcuts_support/useShortcutsSupport';

export const ShortcutsSupportComponent: React.FC = () => {
  const { isSupported, loading, error, shortcuts, addShortcut, removeShortcut } =
    useShortcutsSupport();
  const [title, setTitle] = useState('');
  const [phrase, setPhrase] = useState('');

  const handleAdd = () => {
    if (!title.trim() || !phrase.trim()) return;
    void addShortcut(title.trim(), phrase.trim());
    setTitle('');
    setPhrase('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Shortcuts support screen">
      <View style={styles.header}>
        <Text style={styles.title}>Shortcuts Support</Text>
        <Text style={styles.subtitle}>Create Siri shortcuts to quickly access Stellar features.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Shortcuts are available on this device.'
            : 'Shortcuts are not supported on this platform.'}
        </Text>

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Shortcut title"
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Shortcut title input"
          />
          <TextInput
            style={styles.input}
            placeholder="Siri phrase (e.g. Show my balance)"
            value={phrase}
            onChangeText={setPhrase}
            accessibilityLabel="Siri phrase input"
          />
          <Button
            title="Add Shortcut"
            onPress={handleAdd}
            disabled={!isSupported || loading || !title.trim() || !phrase.trim()}
            accessibilityLabel="Add shortcut"
          />
        </View>

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.loadingText}>Saving shortcut…</Text>
          </View>
        ) : null}

        <View style={styles.listCard} accessible accessibilityRole="summary" accessibilityLabel="Shortcuts list">
          <Text style={styles.listTitle}>My Shortcuts</Text>
          {shortcuts.length === 0 ? (
            <Text style={styles.emptyText}>No shortcuts added yet.</Text>
          ) : (
            shortcuts.map(s => (
              <View key={s.id} style={styles.shortcutRow} accessible accessibilityRole="text" accessibilityLabel={`${s.title}, phrase: ${s.phrase}`}>
                <View style={styles.shortcutInfo}>
                  <Text style={styles.shortcutTitle}>{s.title}</Text>
                  <Text style={styles.shortcutPhrase}>"{s.phrase}"</Text>
                </View>
                <Button
                  title="Remove"
                  onPress={() => void removeShortcut(s.id)}
                  accessibilityLabel={`Remove shortcut ${s.title}`}
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
  status: { fontSize: 14, color: '#7c3aed' },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  form: { gap: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  loadingText: { color: '#7c3aed' },
  listCard: { marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#475569' },
  shortcutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  shortcutInfo: { flex: 1 },
  shortcutTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  shortcutPhrase: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
