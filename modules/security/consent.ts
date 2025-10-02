import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@logging_consent';

export interface ConsentSettings {
  securityMinimum: boolean;
  diagnostics: boolean;
  performance: boolean;
}

const DEFAULT_CONSENT: ConsentSettings = {
  securityMinimum: true,
  diagnostics: false,
  performance: false,
};

let cachedConsent: ConsentSettings | null = null;

export async function getConsent(): Promise<ConsentSettings> {
  if (cachedConsent) {
    return cachedConsent;
  }

  try {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    if (stored) {
      cachedConsent = JSON.parse(stored);
      return cachedConsent!;
    }
  } catch (error) {
    console.error('[Consent] Failed to load consent:', error);
  }

  cachedConsent = DEFAULT_CONSENT;
  return cachedConsent;
}

export async function updateConsent(settings: Partial<ConsentSettings>): Promise<void> {
  try {
    const current = await getConsent();
    const updated = { ...current, ...settings };
    
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(updated));
    cachedConsent = updated;
    
    console.log('[Consent] Updated consent settings:', updated);
  } catch (error) {
    console.error('[Consent] Failed to update consent:', error);
  }
}

export async function resetConsent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
    cachedConsent = DEFAULT_CONSENT;
    console.log('[Consent] Reset to default consent');
  } catch (error) {
    console.error('[Consent] Failed to reset consent:', error);
  }
}

export function shouldLogEvent(level: string, category: string): boolean {
  if (!cachedConsent) {
    return false;
  }

  if (level === 'SECURITY' || category === 'security') {
    return cachedConsent.securityMinimum;
  }

  if (level === 'ERROR' || level === 'FATAL') {
    return cachedConsent.diagnostics;
  }

  return cachedConsent.diagnostics;
}
