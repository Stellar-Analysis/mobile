import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVRSupport } from '@features/vr_support/useVRSupport';

export const VRSupportComponent: React.FC = () => {
  const { loading, error, isSupported, isInVrMode, enterVr, exitVr } = useVRSupport();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="VR support screen">
      <View style={styles.header}>
        <Text style={styles.title}>VR Support</Text>
        <Text style={styles.subtitle}>Activate immersive virtual reality experiences from the app.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'VR support is enabled and ready to use.'
            : 'This device does not currently support VR mode.'}
        </Text>

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#b45309" />
            <Text style={styles.loadingText}>Preparing VR session…</Text>
          </View>
        ) : null}

        <View style={styles.buttonGroup}>
          <Button
            title={isInVrMode ? 'Exit VR Mode' : 'Enter VR Mode'}
            onPress={isInVrMode ? exitVr : enterVr}
            disabled={!isSupported || loading}
            accessibilityLabel={isInVrMode ? 'Exit VR mode' : 'Enter VR mode'}
          />
        </View>

        <View style={styles.detailsCard} accessible accessibilityRole="text" accessibilityLabel="VR mode status details">
          <Text style={styles.detailLabel}>VR Mode</Text>
          <Text style={styles.detailValue}>{isInVrMode ? 'Active' : 'Inactive'}</Text>
        </View>
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
    color: '#0369a1',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    marginTop: 8,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  loadingText: {
    color: '#92400e',
  },
  buttonGroup: {
    marginTop: 10,
  },
  detailsCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
});