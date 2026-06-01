import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCalendarIntegration } from '@hooks/useCalendarIntegration';
import type { CalendarEvent } from '../features/calendar_integration';

export const CalendarIntegrationComponent: React.FC = () => {
  const {
    permissionStatus,
    events,
    selectedDate,
    loading,
    error,
    isOffline,
    requestPermission,
    loadEvents,
    createEvent,
    deleteEvent,
    setSelectedDate,
  } = useCalendarIntegration();

  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const handleCreateEvent = async () => {
    if (!title.trim() || !startDate.trim() || !endDate.trim()) {
      return;
    }
    const event: Omit<CalendarEvent, 'id'> = {
      title: title.trim(),
      startDate,
      endDate,
      hasReminder,
      reminderMinutes: hasReminder ? parseInt(reminderMinutes, 10) || 15 : undefined,
    };
    await createEvent(event);
    setTitle('');
    setStartDate('');
    setEndDate('');
    setHasReminder(false);
    setReminderMinutes('15');
    setFormVisible(false);
  };

  const eventsForDate = events.filter(e => e.startDate.startsWith(selectedDate));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      accessibilityLabel="Calendar integration screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          View and schedule events with optional reminders.
        </Text>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            Offline — showing cached events. New events will sync when reconnected.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLabel={error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading events…</Text>
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel} accessibilityRole="text">
          Selected date:
        </Text>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          accessible
          accessibilityLabel="Selected date input"
          accessibilityHint="Enter date in YYYY-MM-DD format"
        />
      </View>

      <View style={styles.controls}>
        {permissionStatus !== 'granted' ? (
          <View style={styles.buttonWrapper}>
            <Button
              title="Request Calendar Permission"
              onPress={() => void requestPermission()}
              disabled={loading}
              accessibilityLabel="Request calendar permission"
            />
          </View>
        ) : null}

        {permissionStatus === 'granted' ? (
          <>
            <View style={styles.buttonWrapper}>
              <Button
                title="Load Events"
                onPress={() => void loadEvents(selectedDate)}
                disabled={loading}
                accessibilityLabel="Load calendar events"
              />
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                title={formVisible ? 'Cancel' : 'Create Event'}
                onPress={() => setFormVisible(v => !v)}
                accessibilityLabel={formVisible ? 'Cancel event creation' : 'Create new calendar event'}
              />
            </View>
          </>
        ) : null}
      </View>

      {formVisible ? (
        <View style={styles.form} accessible accessibilityLabel="Create event form">
          <Text style={styles.formTitle}>New Event</Text>

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#94a3b8"
            accessible
            accessibilityLabel="Event title input"
          />

          <Text style={styles.fieldLabel}>Start Date (ISO)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-06-02T10:00:00Z"
            placeholderTextColor="#94a3b8"
            accessible
            accessibilityLabel="Event start date input"
          />

          <Text style={styles.fieldLabel}>End Date (ISO)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-06-02T11:00:00Z"
            placeholderTextColor="#94a3b8"
            accessible
            accessibilityLabel="Event end date input"
          />

          <View style={styles.reminderRow}>
            <Text style={styles.fieldLabel}>Set Reminder</Text>
            <Switch
              value={hasReminder}
              onValueChange={setHasReminder}
              accessible
              accessibilityLabel="Toggle event reminder"
              accessibilityRole="switch"
            />
          </View>

          {hasReminder ? (
            <>
              <Text style={styles.fieldLabel}>Reminder (minutes before)</Text>
              <TextInput
                style={styles.input}
                value={reminderMinutes}
                onChangeText={setReminderMinutes}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor="#94a3b8"
                accessible
                accessibilityLabel="Reminder minutes input"
              />
            </>
          ) : null}

          <View style={styles.buttonWrapper}>
            <Button
              title="Save Event"
              onPress={() => void handleCreateEvent()}
              disabled={loading || !title.trim()}
              accessibilityLabel="Save calendar event"
            />
          </View>
        </View>
      ) : null}

      <View style={styles.eventList} accessible accessibilityLabel={`Events list for ${selectedDate}`}>
        <Text style={styles.listTitle}>
          Events on {selectedDate} ({eventsForDate.length})
        </Text>
        {eventsForDate.length === 0 && !loading ? (
          <Text style={styles.emptyText} accessibilityRole="text">
            No events on this date.
          </Text>
        ) : (
          eventsForDate.map(event => (
            <View
              key={event.id}
              style={styles.eventCard}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Event: ${event.title}, from ${event.startDate} to ${event.endDate}${event.hasReminder ? `, reminder ${event.reminderMinutes ?? 15} minutes before` : ''}`}
            >
              <View style={styles.eventCardHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Button
                  title="Delete"
                  onPress={() => deleteEvent(event.id)}
                  accessibilityLabel={`Delete event ${event.title}`}
                />
              </View>
              <Text style={styles.eventTime}>
                {event.startDate} – {event.endDate}
              </Text>
              {event.hasReminder ? (
                <Text style={styles.eventReminder} accessibilityRole="text">
                  Reminder: {event.reminderMinutes ?? 15} min before
                </Text>
              ) : null}
              {event.location ? (
                <Text style={styles.eventLocation} accessibilityRole="text">
                  {event.location}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff' },
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  loadingText: { color: '#0f766e' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dateLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  controls: { gap: 10, marginBottom: 16 },
  buttonWrapper: { borderRadius: 8, overflow: 'hidden' },
  form: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  fieldLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  eventTime: { fontSize: 12, color: '#64748b', marginTop: 4 },
  eventReminder: { fontSize: 12, color: '#0d9488', marginTop: 4 },
  eventLocation: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
