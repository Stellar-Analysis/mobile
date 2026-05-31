import React from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePictureinPicture } from '@features/picture_in_picture/usePictureinPicture';

export const PictureinPictureComponent: React.FC = () => {
  const { loading, error, isOffline, isSupported, isActive, enterPictureInPicture, exitPictureInPicture } =
    usePictureinPicture();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Picture in Picture feature screen">
      <View style={styles.header}>
        <Text style={styles.title}>Picture in Picture</Text>
        <Text style={styles.subtitle}>Enable video multitasking while users browse the app.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.status} accessibilityRole="text">
          {isSupported
            ? 'Picture in picture support is enabled for this platform.'
            : 'Picture in picture is not currently supported on this device.'}
        </Text>
        {isOffline ? (
          <Text style={styles.offlineText}>Offline mode active — video controls still work locally.</Text>
        ) : null}

        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#0f766e" />
            <Text style={styles.loadingText}>Updating picture in picture session…</Text>
          </View>
        ) : null}

        <View style={styles.buttonGroup}>
          <Button
            title={isActive ? 'Exit PiP Mode' : 'Enter PiP Mode'}
            onPress={isActive ? exitPictureInPicture : enterPictureInPicture}
            disabled={!isSupported || loading}
            accessibilityLabel={isActive ? 'Exit picture in picture mode' : 'Enter picture in picture mode'}
          />
        </View>

        <View style={styles.detailsCard} accessible accessibilityRole="text" accessibilityLabel="Picture in picture details">
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{isActive ? 'Active' : 'Inactive'}</Text>
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
    color: '#0f766e',
  },
  offlineText: {
    fontSize: 13,
    color: '#92400e',
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
    color: '#0f766e',
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