import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useHapticPatterns, HapticPattern } from '@features/haptic_patterns/useHapticPatterns';

const PATTERN_LABELS: Record<HapticPattern, string> = {
  light: 'Light Tap',
  medium: 'Medium Tap',
  heavy: 'Heavy Tap',
  success: 'Success Pulse',
  warning: 'Warning Vibration',
};

export const HapticPatternsComponent: React.FC = () => {
  const { loading, error, supported, lastPattern, triggerPattern } = useHapticPatterns();

  React.useEffect(() => {
    if (error) {
      Alert.alert('Haptic error', error, [{ text: 'OK' }], { cancelable: true });
    }
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Haptic patterns screen">
      <View style={styles.header}>
        <Text style={styles.title}>Haptic Patterns</Text>
        <Text style={styles.subtitle}>
          Use tactile feedback to improve engagement and confirm user actions.
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {supported
            ? 'Haptics available on this device.'
            : 'Haptics are not supported on this platform.'}
        </Text>
        {lastPattern ? (
          <Text style={styles.lastPattern} accessibilityLabel={`Last pattern used ${lastPattern}`}>
            Last triggered: {PATTERN_LABELS[lastPattern]}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#1F7A8C" />
            <Text style={styles.loadingText}>Applying pattern…</Text>
          </View>
        ) : null}

        {Object.entries(PATTERN_LABELS).map(([pattern, label]) => (
          <View key={pattern} style={styles.buttonWrapper}>
            <Button
              title={label}
              onPress={() => triggerPattern(pattern as HapticPattern)}
              disabled={!supported || loading}
              accessibilityLabel={`Trigger ${label}`}
            />
          </View>
        ))}

        <Text style={styles.note} accessibilityRole="text">
          Haptic patterns are implemented with a fallback vibration experience for both iOS and Android.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#4b5563',
  },
  body: {
    gap: 14,
  },
  status: {
    fontSize: 14,
    color: '#1d4ed8',
  },
  lastPattern: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  loadingText: {
    color: '#0f172a',
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  note: {
    marginTop: 24,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});