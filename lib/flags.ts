export type FeatureFlagKey = 'error_handling_v1' | 'network_retry_v1';

const defaults: Record<FeatureFlagKey, boolean> = {
  error_handling_v1: true,
  network_retry_v1: true,
};

export const flags = {
  isEnabled(key: FeatureFlagKey): boolean {
    const env = process.env[`EXPO_PUBLIC_FLAG_${key.toUpperCase()}` as keyof NodeJS.ProcessEnv] as string | undefined;
    if (env === 'true') return true;
    if (env === 'false') return false;
    return defaults[key];
  },
};
