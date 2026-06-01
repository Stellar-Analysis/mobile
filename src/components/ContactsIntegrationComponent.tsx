import React from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useContactsIntegration } from '@hooks/useContactsIntegration';
import type { Contact } from '../features/contacts_integration';

export const ContactsIntegrationComponent: React.FC = () => {
  const {
    permissionStatus,
    filteredContacts,
    selectedIds,
    searchQuery,
    loading,
    error,
    isOffline,
    requestPermission,
    loadContacts,
    setSearchQuery,
    toggleSelection,
    clearSelection,
    shareWithSelected,
  } = useContactsIntegration();

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item.id)}
        style={[styles.contactRow, isSelected && styles.contactRowSelected]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Contact: ${item.name}${isSelected ? ', selected' : ''}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.emails?.[0] ? (
            <Text style={styles.contactDetail} accessibilityRole="text">
              {item.emails[0]}
            </Text>
          ) : null}
          {item.phoneNumbers?.[0] ? (
            <Text style={styles.contactDetail} accessibilityRole="text">
              {item.phoneNumbers[0]}
            </Text>
          ) : null}
        </View>
        {isSelected ? (
          <View style={styles.checkCircle} accessible accessibilityLabel="Selected">
            <Text style={styles.checkMark}>✓</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} accessibilityLabel="Contacts integration screen">
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <Text style={styles.subtitle}>Search and select contacts for sharing.</Text>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>Offline — showing cached contacts.</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLabel={error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.searchInput}
        placeholder="Search contacts…"
        placeholderTextColor="#94a3b8"
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessible
        accessibilityLabel="Search contacts input"
        accessibilityHint="Type to filter contacts by name, email, or phone"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      <View style={styles.controls}>
        {permissionStatus !== 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Request Contacts Permission"
              onPress={() => void requestPermission()}
              disabled={loading}
              accessibilityLabel="Request contacts permission"
            />
          </View>
        ) : null}

        {permissionStatus === 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Load Contacts"
              onPress={() => void loadContacts()}
              disabled={loading}
              accessibilityLabel="Load contacts"
            />
          </View>
        ) : null}

        {selectedIds.length > 0 ? (
          <>
            <View style={styles.buttonWrapper}>
              <Button
                title={`Share with ${selectedIds.length} contact${selectedIds.length !== 1 ? 's' : ''}`}
                onPress={shareWithSelected}
                accessibilityLabel={`Share with ${selectedIds.length} selected contacts`}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                title="Clear Selection"
                onPress={clearSelection}
                accessibilityLabel="Clear contact selection"
              />
            </View>
          </>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading contacts…</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        accessible
        accessibilityLabel={`Contacts list with ${filteredContacts.length} contacts`}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText} accessibilityRole="text">
              {searchQuery ? 'No contacts match your search.' : 'No contacts loaded yet.'}
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 15, color: '#4b5563' },
  offlineBanner: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  offlineText: { color: '#92400e', fontSize: 13 },
  errorBox: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: { color: '#991b1b', fontSize: 14 },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 14,
  },
  controls: { gap: 10, marginBottom: 14 },
  buttonWrapper: { borderRadius: 8, overflow: 'hidden' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  loadingText: { color: '#0f766e' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderRadius: 8,
  },
  contactRowSelected: { backgroundColor: '#f0fdfa' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  contactDetail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 24 },
});
