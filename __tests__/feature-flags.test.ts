import { 
  featureFlags, 
  isFeatureEnabled, 
  getFeatureFlags, 
  setFeatureFlag, 
  resetFeatureFlags 
} from '@/lib/feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    resetFeatureFlags();
  });

  it('should have default values', () => {
    const flags = getFeatureFlags();
    expect(flags.tts_mock).toBe(false);
    expect(flags.leaderboard).toBe(true);
    expect(flags.lessons_cache).toBe(true);
    expect(flags.experimental_ai_coach).toBe(false);
    expect(flags.offline_mode).toBe(true);
    expect(flags.debug_mode).toBe(false);
  });

  it('should check if feature is enabled', () => {
    expect(isFeatureEnabled('leaderboard')).toBe(true);
    expect(isFeatureEnabled('tts_mock')).toBe(false);
  });

  it('should allow setting feature flags', () => {
    setFeatureFlag('tts_mock', true);
    expect(isFeatureEnabled('tts_mock')).toBe(true);
  });

  it('should reset to default values', () => {
    setFeatureFlag('tts_mock', true);
    setFeatureFlag('leaderboard', false);
    
    resetFeatureFlags();
    
    expect(isFeatureEnabled('tts_mock')).toBe(false);
    expect(isFeatureEnabled('leaderboard')).toBe(true);
  });

  it('should return a copy of flags', () => {
    const flags1 = getFeatureFlags();
    const flags2 = getFeatureFlags();
    
    setFeatureFlag('tts_mock', true);
    
    expect(flags1.tts_mock).toBe(false);
    expect(flags2.tts_mock).toBe(false);
  });
});
