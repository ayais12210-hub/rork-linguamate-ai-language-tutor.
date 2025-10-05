export type FeatureFlagName = 'error_handling_v1';

export type FeatureFlags = Record<FeatureFlagName, boolean>;

const defaults: FeatureFlags = {
  error_handling_v1: true,
};

let current: FeatureFlags = { ...defaults };

export function isEnabled(name: FeatureFlagName): boolean {
  return Boolean(current[name]);
}

export function setFlags(next: Partial<FeatureFlags>) {
  current = { ...current, ...next };
}

export function getFlags(): FeatureFlags {
  return { ...current };
}
