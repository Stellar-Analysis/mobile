import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface AudioRecording {
  id: string;
  uri: string;
  duration: number;
  timestamp: number;
  size: number;
}

interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  recordingDuration: number;
  recordings: AudioRecording[];
  currentRecording: AudioRecording | null;
  error: string | null;
}

interface AudioRecordingControls {
  hasPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<AudioRecording | null>;
  playRecording: (recording: AudioRecording) => Promise<void>;
  stopPlayback: () => void;
  deleteRecording: (id: string) => void;
  clearError: () => void;
}

export type UseAudioRecordingReturn = AudioRecordingState & AudioRecordingControls;

export const useAudioRecording = (): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  }, []);

  const hasPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        return granted;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Audio Recording needs access to your microphone',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      const permission = await hasPermission();
      if (!permission) {
        const granted = await requestPermission();
        if (!granted) throw new Error('Microphone permission denied');
      }

      setIsLoading(false);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      recordingStartRef.current = Date.now();

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setIsRecording(false);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [hasPermission, requestPermission]);

  const pauseRecording = useCallback((): void => {
    if (!isRecording || isPaused) return;
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsPaused(true);
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback((): void => {
    if (!isPaused) return;
    setIsPaused(false);
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  }, [isPaused]);

  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    if (!isRecording) return null;
    clearTimers();

    const duration = Math.max(recordingDuration, 1);
    const newRecording: AudioRecording = {
      id: `rec_${recordingStartRef.current}`,
      uri: `file://recordings/audio_${recordingStartRef.current}.m4a`,
      duration,
      timestamp: recordingStartRef.current,
      size: duration * 16000, // ~16 KB/s for voice
    };

    // Persist to local storage
    try {
      const storage = require('react-native-mmkv').default;
      const cached = storage.getString('audio_recordings') ?? '[]';
      const list: AudioRecording[] = JSON.parse(cached);
      list.push(newRecording);
      storage.set('audio_recordings', JSON.stringify(list));
    } catch {
      // non-fatal
    }

    setRecordings((prev) => [...prev, newRecording]);
    setCurrentRecording(newRecording);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);

    return newRecording;
  }, [isRecording, recordingDuration, clearTimers]);

  const playRecording = useCallback(async (recording: AudioRecording): Promise<void> => {
    try {
      setIsPlaying(true);
      setCurrentRecording(recording);
      playbackTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
      }, recording.duration * 1000);
    } catch (err) {
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : 'Failed to play recording');
    }
  }, []);

  const stopPlayback = useCallback((): void => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const deleteRecording = useCallback((id: string): void => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    setCurrentRecording((prev) => (prev?.id === id ? null : prev));
    try {
      const storage = require('react-native-mmkv').default;
      const cached = storage.getString('audio_recordings') ?? '[]';
      const list: AudioRecording[] = JSON.parse(cached);
      storage.set('audio_recordings', JSON.stringify(list.filter((r) => r.id !== id)));
    } catch {
      // non-fatal
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    isRecording,
    isPaused,
    isPlaying,
    isLoading,
    recordingDuration,
    recordings,
    currentRecording,
    error,
    hasPermission,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording,
    clearError,
  };
};
