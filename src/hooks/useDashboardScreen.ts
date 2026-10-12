import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '@services/api';
import { CACHE_KEYS } from '@config/constants';
import {
  CorridorPerformance,
  DashboardData,
  DashboardDataSource,
  DashboardStats,
  StatsSummary,
} from '@types/dashboard';

interface RawDashboardResponse {
  stats?: Partial<DashboardStats>;
  corridor_performance?: CorridorPerformance[];
  data?: DashboardData;
  summary?: StatsSummary;
}

interface RawSummaryResponse {
  daily_active_accounts?: number;
  daa?: number;
  tx_count_24h?: number;
  tx_count?: number;
  payment_volume_24h?: number;
  volume_24h?: number;
  active_soroban_contracts?: number;
  soroban_contracts?: number;
  data?: RawSummaryResponse;
  summary?: RawSummaryResponse;
}

function isStats(value: unknown): value is DashboardStats {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const stats = value as Record<string, unknown>;
  return (
    typeof stats.volume_24h === 'number' &&
    typeof stats.avg_success_rate === 'number' &&
    typeof stats.active_corridors === 'number'
  );
}

export function normalizeDashboardResponse(raw: unknown): DashboardData {
  const response = raw as RawDashboardResponse | undefined;

  // Some backends wrap the payload in a `data` envelope.
  const payload = response?.data ?? response;

  if (payload && isStats(payload.stats) && Array.isArray(payload.corridor_performance)) {
    return {
      stats: payload.stats,
      corridor_performance: payload.corridor_performance,
      summary: payload.summary,
    };
  }

  throw new Error('Invalid dashboard response');
}

export const MOCK_STATS_SUMMARY: StatsSummary = {
  daily_active_accounts: 1420,
  tx_count_24h: 38450,
  payment_volume_24h: 72000,
  active_soroban_contracts: 42,
};

export function normalizeSummaryResponse(raw: unknown): StatsSummary {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid stats summary response');
  }

  const response = raw as RawSummaryResponse;
  const payload = response.data ?? response.summary ?? response;

  const daa = payload.daily_active_accounts ?? payload.daa;
  const tx = payload.tx_count_24h ?? payload.tx_count;
  const volume = payload.payment_volume_24h ?? payload.volume_24h;
  const contracts = payload.active_soroban_contracts ?? payload.soroban_contracts;

  if (
    typeof daa === 'number' ||
    typeof tx === 'number' ||
    typeof volume === 'number' ||
    typeof contracts === 'number'
  ) {
    return {
      daily_active_accounts: typeof daa === 'number' ? daa : MOCK_STATS_SUMMARY.daily_active_accounts,
      tx_count_24h: typeof tx === 'number' ? tx : MOCK_STATS_SUMMARY.tx_count_24h,
      payment_volume_24h: typeof volume === 'number' ? volume : MOCK_STATS_SUMMARY.payment_volume_24h,
      active_soroban_contracts: typeof contracts === 'number' ? contracts : MOCK_STATS_SUMMARY.active_soroban_contracts,
    };
  }

  throw new Error('Invalid stats summary response');
}

export interface UseDashboardScreenReturn {
  stats: DashboardStats | null;
  summaryStats: StatsSummary | null;
  corridorPerformance: CorridorPerformance[];
  loading: boolean;
  error: string | null;
  warning: string | null;
  isOffline: boolean;
  dataSource: DashboardDataSource | null;
  isFromCache: boolean;
  refetch: () => Promise<void>;
}

export const DASHBOARD_CACHE_KEY = CACHE_KEYS.ANALYTICS;

const MOCK_STATS: DashboardStats = {
  volume_24h: 72000,
  volume_growth: 8.4,
  avg_success_rate: 96.1,
  success_rate_growth: 1.2,
  active_corridors: 28,
  corridors_growth: 3,
  daily_active_accounts: 1420,
  tx_count_24h: 38450,
  payment_volume_24h: 72000,
  active_soroban_contracts: 42,
};

const MOCK_CORRIDOR_PERFORMANCE: CorridorPerformance[] = [
  { corridor: 'USDC→PHP', success_rate: 98.5, volume: 240000, health: 95 },
  { corridor: 'USD→PHP', success_rate: 97.2, volume: 180000, health: 92 },
  { corridor: 'EUR→USDC', success_rate: 99.1, volume: 150000, health: 98 },
  { corridor: 'USDC→SGD', success_rate: 96.8, volume: 120000, health: 89 },
  { corridor: 'USD→EUR', success_rate: 98.9, volume: 200000, health: 97 },
];

export function generateMockDashboard(): DashboardData {
  return {
    stats: MOCK_STATS,
    corridor_performance: MOCK_CORRIDOR_PERFORMANCE,
    summary: MOCK_STATS_SUMMARY,
  };
}

async function readCachedDashboard(): Promise<DashboardData | null> {
  try {
    const cached = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
    return cached ? (JSON.parse(cached) as DashboardData) : null;
  } catch {
    return null;
  }
}

async function writeCachedDashboard(data: DashboardData): Promise<void> {
  try {
    await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Cache writes are best-effort for offline support.
  }
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<unknown>('/analytics/dashboard');
  return normalizeDashboardResponse(response);
}

export async function fetchStatsSummary(): Promise<StatsSummary> {
  if (typeof (apiClient as any).getStatsSummary === 'function') {
    const res = await (apiClient as any).getStatsSummary();
    return normalizeSummaryResponse(res);
  }
  const response = await apiClient.get<unknown>('/api/v1/stats/summary');
  return normalizeSummaryResponse(response);
}

export function useDashboardScreen(): UseDashboardScreenReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [summaryStats, setSummaryStats] = useState<StatsSummary | null>(null);
  const [corridorPerformance, setCorridorPerformance] = useState<CorridorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [dataSource, setDataSource] = useState<DashboardDataSource | null>(null);

  const applyData = useCallback((data: DashboardData, summary?: StatsSummary | null) => {
    const resolvedSummary =
      summary ??
      data.summary ?? {
        daily_active_accounts:
          data.stats.daily_active_accounts ?? MOCK_STATS_SUMMARY.daily_active_accounts,
        tx_count_24h: data.stats.tx_count_24h ?? MOCK_STATS_SUMMARY.tx_count_24h,
        payment_volume_24h:
          data.stats.payment_volume_24h ?? data.stats.volume_24h ?? MOCK_STATS_SUMMARY.payment_volume_24h,
        active_soroban_contracts:
          data.stats.active_soroban_contracts ?? MOCK_STATS_SUMMARY.active_soroban_contracts,
      };

    setStats({
      ...data.stats,
      daily_active_accounts: resolvedSummary.daily_active_accounts,
      tx_count_24h: resolvedSummary.tx_count_24h,
      payment_volume_24h: resolvedSummary.payment_volume_24h,
      active_soroban_contracts: resolvedSummary.active_soroban_contracts,
    });
    setSummaryStats(resolvedSummary);
    setCorridorPerformance(data.corridor_performance);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setDataSource(null);

    let offline = false;
    try {
      const networkState = await NetInfo.fetch();
      offline = !(networkState.isConnected && networkState.isInternetReachable !== false);
    } catch {
      offline = true;
    }
    setIsOffline(offline);

    try {
      if (offline) {
        const cached = await readCachedDashboard();
        if (cached) {
          applyData(cached, cached.summary);
          setDataSource('cache');
          setWarning('Offline — showing saved dashboard.');
          return;
        }

        const mockData = generateMockDashboard();
        applyData(mockData, MOCK_STATS_SUMMARY);
        setDataSource('mock');
        setWarning('Offline — no saved data available. Showing sample dashboard.');
        return;
      }

      try {
        const result = await fetchDashboard();
        let summary: StatsSummary | null = null;
        try {
          summary = await fetchStatsSummary();
        } catch {
          // If summary endpoint is not yet live or fails, fallback to dashboard summary or mock summary
          summary = result.summary ?? {
            daily_active_accounts:
              result.stats.daily_active_accounts ?? MOCK_STATS_SUMMARY.daily_active_accounts,
            tx_count_24h: result.stats.tx_count_24h ?? MOCK_STATS_SUMMARY.tx_count_24h,
            payment_volume_24h:
              result.stats.payment_volume_24h ?? result.stats.volume_24h ?? MOCK_STATS_SUMMARY.payment_volume_24h,
            active_soroban_contracts:
              result.stats.active_soroban_contracts ?? MOCK_STATS_SUMMARY.active_soroban_contracts,
          };
        }

        const enrichedResult: DashboardData = {
          ...result,
          stats: {
            ...result.stats,
            ...(summary
              ? {
                  daily_active_accounts: summary.daily_active_accounts,
                  tx_count_24h: summary.tx_count_24h,
                  payment_volume_24h: summary.payment_volume_24h,
                  active_soroban_contracts: summary.active_soroban_contracts,
                }
              : {}),
          },
          summary: summary ?? undefined,
        };

        applyData(enrichedResult, summary);
        setDataSource('live');
        await writeCachedDashboard(enrichedResult);
        return;
      } catch {
        const cached = await readCachedDashboard();
        if (cached) {
          applyData(cached, cached.summary);
          setDataSource('cache');
          setWarning('Live data unavailable. Showing saved dashboard.');
          return;
        }

        const mockData = generateMockDashboard();
        applyData(mockData, MOCK_STATS_SUMMARY);
        setDataSource('mock');
        setWarning('Live data unavailable. Showing sample dashboard.');
      }
    } catch {
      setError('Failed to load dashboard');
      setStats(null);
      setSummaryStats(null);
      setCorridorPerformance([]);
      setDataSource(null);
      setWarning(null);
    } finally {
      setLoading(false);
    }
  }, [applyData]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    stats,
    summaryStats,
    corridorPerformance,
    loading,
    error,
    warning,
    isOffline,
    dataSource,
    isFromCache: dataSource === 'cache',
    refetch: loadDashboard,
  };
}
