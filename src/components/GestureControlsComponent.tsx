import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGestureControls, getGestureLabel } from '@features/gesture_controls/useGestureControls';

export const GestureControlsComponent: React.FC = () => {
  const { panHandlers, lastGesture, gestureCount, isOffline, loading, error } = useGestureControls();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Gesture controls screen">
      <Text style={styles.title}>Gesture Controls</Text>
      <Text style={styles.subtitle}>Swipe, double tap, or long press to interact with the experience.</Text>

      <View style={styles.statusRow}>
        <Text style={styles.status} accessibilityRole="text">
          {isOffline ? 'Offline mode active' : 'Online mode active'}
        </Text>
        <Text style={styles.status} accessibilityRole="text">
          {loading ? 'Handling gesture…' : 'Ready for input'}
        </Text>
      </View>

      <View
        style={[styles.gestureArea, loading ? styles.disabledArea : null]}
        accessible
        accessibilityLabel="Gesture interaction area"
        accessibilityHint="Swipe left or right, double tap, or long press inside this area."
        {...panHandlers}
      >
        <Text style={styles.areaText} accessibilityRole="text">
          {loading ? 'Processing…' : 'Use gestures here'}
        </Text>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Text style={styles.lastGesture} accessibilityLabel={lastGesture ? `Last gesture ${getGestureLabel(lastGesture)}` : 'No gesture recorded yet'}>
        {lastGesture ? `Last gesture: ${getGestureLabel(lastGesture)}` : 'No gesture recorded yet.'}
      </Text>

      <Text style={styles.counter} accessibilityRole="text">
        Gesture count: {gestureCount}
      </Text>

      <Text style={styles.note} accessibilityRole="text">
        Gesture controls are intentionally designed to work offline and provide a responsive mobile interaction layer.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f7f8fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 18,
  },
  statusRow: {
    gap: 10,
    marginBottom: 16,
  },
  status: {
    fontSize: 14,
    color: '#1d4ed8',
  },
  gestureArea: {
    minHeight: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    padding: 20,
  },
  disabledArea: {
    opacity: 0.6,
  },
  areaText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 12,
  },
  lastGesture: {
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 8,
  },
  counter: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 18,
  },
  note: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});
