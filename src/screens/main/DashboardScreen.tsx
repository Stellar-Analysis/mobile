import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Volume (24h)</Text>
        <Text style={styles.cardValue}>$0.00</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Corridors</Text>
        <Text style={styles.cardValue}>0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Success Rate</Text>
        <Text style={styles.cardValue}>0%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
