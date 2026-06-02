import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface VideoPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
  isOfflineCached: boolean;
}

interface VideoPlayerControls {
  play: (url: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  cacheForOffline: (url: string) => Promise<boolean>;
  clearError: () => void;
}

export type UseVideoPlayerReturn = VideoPlayerState & VideoPlayerControls;

const SUPPORTED_FORMATS = Platform.OS === 'ios'
  ? ['mp4', 'mov', 'm4v', 'hls']
  : ['mp4', 'webm', 'mkv', 'hls'];

export const useVideoPlayer = (): UseVideoPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const play = useCallback(async (url: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      setIsBuffering(true);

      const extension = url.split('.').pop()?.toLowerCase();
      if (extension && !SUPPORTED_FORMATS.includes(extension) && !url.includes('m3u8')) {
        throw new Error(`Unsupported video format: ${extension}`);
      }

      // Simulate buffering/loading delay
      await new Promise<void>((resolve) => {
        loadingTimeoutRef.current = setTimeout(() => {
          resolve();
        }, 1200);
      });

      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(true);
      setIsPaused(false);
      setDuration(300); // 5 min mock duration

      // Simulate playback progress
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 300) {
            clearTimers();
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(false);
      const msg = err instanceof Error ? err.message : 'Failed to play video';
      setError(msg);
    }
  }, [clearTimers]);

  const pause = useCallback((): void => {
    if (!isPlaying) return;
    clearTimers();
    setIsPlaying(false);
    setIsPaused(true);
  }, [isPlaying, clearTimers]);

  const resume = useCallback((): void => {
    if (!isPaused) return;
    setIsPlaying(true);
    setIsPaused(false);

    playbackIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          clearTimers();
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  }, [isPaused, duration, clearTimers]);

  const stop = useCallback((): void => {
    clearTimers();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    setIsBuffering(false);
    setIsLoading(false);
  }, [clearTimers]);

  const seek = useCallback((time: number): void => {
    const clamped = Math.max(0, Math.min(time, duration));
    setCurrentTime(clamped);
  }, [duration]);

  const setVolume = useCallback((level: number): void => {
    const clamped = Math.max(0, Math.min(level, 1));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => !prev);
  }, []);

  const cacheForOffline = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Simulate caching to local storage
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      const storage = require('react-native-mmkv').default;
      const cached = storage.getString('video_player_cache') ?? '[]';
      const list: string[] = JSON.parse(cached);
      if (!list.includes(url)) {
        list.push(url);
        storage.set('video_player_cache', JSON.stringify(list));
      }
      setIsOfflineCached(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    isPlaying,
    isPaused,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
    isOfflineCached,
    play,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    toggleMute,
    cacheForOffline,
    clearError,
  };
};
