export type DashboardDataSource = 'live' | 'cache' | 'mock';

export interface StatsSummary {
  daily_active_accounts: number;
  tx_count_24h: number;
  payment_volume_24h: number;
  active_soroban_contracts: number;
}

export interface DashboardStats {
  volume_24h: number;
  volume_growth: number;
  avg_success_rate: number;
  success_rate_growth: number;
  active_corridors: number;
  corridors_growth: number;
  daily_active_accounts?: number;
  tx_count_24h?: number;
  payment_volume_24h?: number;
  active_soroban_contracts?: number;
}

export interface CorridorPerformance {
  corridor: string;
  success_rate: number;
  volume: number;
  health: number;
}

export interface DashboardData {
  stats: DashboardStats;
  corridor_performance: CorridorPerformance[];
  summary?: StatsSummary;
}
