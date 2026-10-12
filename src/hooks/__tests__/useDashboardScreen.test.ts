import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { renderHook, waitFor, act } from '@testing-library/react-native';

import {
  DASHBOARD_CACHE_KEY,
  generateMockDashboard,
  normalizeDashboardResponse,
  normalizeSummaryResponse,
  MOCK_STATS_SUMMARY,
  useDashboardScreen,
} from '@hooks/useDashboardScreen';

jest.mock('@services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

import { apiClient } from '@services/api';

describe('useDashboardScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  it('loads dashboard from API and caches result', async () => {
    const mockData = generateMockDashboard();
    (apiClient.get as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockData.stats);
    expect(result.current.corridorPerformance).toHaveLength(5);
    expect(result.current.dataSource).toBe('live');
    expect(result.current.warning).toBeNull();

    const cached = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
    expect(cached).not.toBeNull();
  });

  it('normalizes a data-enveloped API response', async () => {
    const mockData = generateMockDashboard();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockData.stats);
    expect(result.current.dataSource).toBe('live');
  });

  it('throws for an invalid dashboard response shape', () => {
    expect(() => normalizeDashboardResponse({ foo: 'bar' })).toThrow('Invalid dashboard response');
  });

  it('falls back to cached data when API fails', async () => {
    const mockData = generateMockDashboard();
    await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(mockData));
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataSource).toBe('cache');
    expect(result.current.isFromCache).toBe(true);
    expect(result.current.warning).toContain('saved dashboard');
  });

  it('uses mock data with clear labeling when offline and no cache exists', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataSource).toBe('mock');
    expect(result.current.isOffline).toBe(true);
    expect(result.current.warning).toBe(
      'Offline — no saved data available. Showing sample dashboard.'
    );
  });

  it('uses cached data when device is offline', async () => {
    const mockData = generateMockDashboard();
    await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(mockData));
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataSource).toBe('cache');
    expect(result.current.warning).toBe('Offline — showing saved dashboard.');
  });

  it('uses mock data with warning when online API fails and no cache exists', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('404'));

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dataSource).toBe('mock');
    expect(result.current.warning).toBe('Live data unavailable. Showing sample dashboard.');
  });

  it('treats a NetInfo failure as offline', async () => {
    (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('netinfo down'));

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.dataSource).toBe('mock');
  });

  it('refetches dashboard and summary on demand', async () => {
    const mockData = generateMockDashboard();
    (apiClient.get as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/analytics/dashboard');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/stats/summary');
    expect(apiClient.get).toHaveBeenCalledTimes(4);
  });

  it('normalizes stats summary response and exposes summaryStats', async () => {
    const customSummary = {
      daily_active_accounts: 2500,
      tx_count_24h: 50000,
      payment_volume_24h: 120000,
      active_soroban_contracts: 88,
    };
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/v1/stats/summary') {
        return Promise.resolve({ data: customSummary });
      }
      return Promise.resolve(generateMockDashboard());
    });

    const { result } = renderHook(() => useDashboardScreen());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summaryStats).toEqual(customSummary);
    expect(result.current.stats?.daily_active_accounts).toBe(2500);
    expect(result.current.stats?.tx_count_24h).toBe(50000);
    expect(result.current.stats?.active_soroban_contracts).toBe(88);
  });

  it('throws for an invalid summary response shape', () => {
    expect(() => normalizeSummaryResponse({ foo: 'bar' })).toThrow('Invalid stats summary response');
  });
});
