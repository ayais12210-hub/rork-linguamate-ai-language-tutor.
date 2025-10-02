import { Platform, Linking } from 'react-native';

export function getAppScheme(): string {
  return 'linguamate';
}

export function buildSettingsLink(path?: string): string {
  const scheme = getAppScheme();
  const suffix = path ? `/settings/${path}` : '/settings';
  return `${scheme}://${suffix}`;
}

export async function openSettingsDeepLink(path?: string) {
  const url = buildSettingsLink(path);
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function tryOpen(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
