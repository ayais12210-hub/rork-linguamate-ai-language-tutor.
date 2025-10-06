/**
 * Feature flags system for store-safe defaults
 * Environment variables should be set as EXPO_PUBLIC_FLAGS
 * Example: EXPO_PUBLIC_FLAGS="tts_mock=true,leaderboard=true,lessons_cache=true"
 */

export interface FeatureFlags {
  tts_mock: boolean;
  leaderboard: boolean;
  lessons_cache: boolean;
  experimental_ai_coach: boolean;
  offline_mode: boolean;
  debug_mode: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  tts_mock: false,
  leaderboard: true,
  lessons_cache: true,
  experimental_ai_coach: false,
  offline_mode: true,
  debug_mode: false,
};

function parseFlagsFromEnv(): Partial<FeatureFlags> {
  const flagsString = process.env.EXPO_PUBLIC_FLAGS;
  if (!flagsString) return {};

  const flags: Partial<FeatureFlags> = {};
  
  flagsString.split(',').forEach(flag => {
    const [key, value] = flag.split('=');
    if (key && value !== undefined) {
      const boolValue = value.toLowerCase() === 'true';
      flags[key as keyof FeatureFlags] = boolValue;
    }
  });

  return flags;
}

export const featureFlags: FeatureFlags = {
  ...DEFAULT_FLAGS,
  ...parseFlagsFromEnv(),
};

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

export function getFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

// For testing purposes
export function setFeatureFlag(flag: keyof FeatureFlags, value: boolean): void {
  featureFlags[flag] = value;
}

export function resetFeatureFlags(): void {
  Object.assign(featureFlags, DEFAULT_FLAGS);
}
