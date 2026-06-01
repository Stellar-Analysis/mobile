export interface ShakeConfig {
  threshold: number; // acceleration threshold in m/s²
  cooldownMs: number; // minimum ms between shake events
}

export const DEFAULT_SHAKE_CONFIG: ShakeConfig = {
  threshold: 15,
  cooldownMs: 1000,
};
