export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  hasReminder: boolean;
  reminderMinutes?: number;
}

export interface CalendarState {
  permissionStatus: 'not_requested' | 'granted' | 'denied' | 'unavailable';
  events: CalendarEvent[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Stellar Network Update',
    startDate: '2026-06-02T10:00:00Z',
    endDate: '2026-06-02T11:00:00Z',
    hasReminder: true,
    reminderMinutes: 15,
  },
  {
    id: '2',
    title: 'Team Sync',
    startDate: '2026-06-03T14:00:00Z',
    endDate: '2026-06-03T15:00:00Z',
    hasReminder: false,
  },
];
