import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { hashValue } from './redactors';

export interface DeviceInfo {
  model?: string;
  os?: string;
  appVer?: string;
  platform?: string;
  locale?: string;
  timezone?: string;
  fingerprint?: string;
}

let cachedDeviceInfo: DeviceInfo | null = null;
let cachedFingerprint: string | null = null;

export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  const info: DeviceInfo = {
    platform: Platform.OS,
  };

  try {
    if (Platform.OS !== 'web') {
      info.model = Device.modelName || undefined;
      info.os = `${Device.osName || Platform.OS} ${Device.osVersion || ''}`.trim();
      info.appVer = Application.nativeApplicationVersion || undefined;
    } else {
      info.model = 'Web';
      info.os = navigator.userAgent;
      info.appVer = Application.nativeApplicationVersion || undefined;
    }

    info.locale = 
      (typeof navigator !== 'undefined' && navigator.language) || 
      'en-US';
    
    info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    info.fingerprint = await getDeviceFingerprint();
  } catch (error) {
    console.error('Failed to get device info:', error);
  }

  cachedDeviceInfo = info;
  return info;
}

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const components: string[] = [];

    if (Platform.OS !== 'web') {
      components.push(Device.modelId || '');
      components.push(Device.osInternalBuildId || '');
      components.push(Device.osBuildId || '');
      components.push(Device.deviceName || '');
    } else {
      components.push(navigator.userAgent);
      components.push(navigator.language);
      components.push(String(screen.width));
      components.push(String(screen.height));
      components.push(String(screen.colorDepth));
      components.push(String(navigator.hardwareConcurrency || 0));
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }

    const fingerprintString = components.filter(Boolean).join('|');
    cachedFingerprint = hashValue(fingerprintString);
    
    return cachedFingerprint;
  } catch (error) {
    console.error('Failed to generate device fingerprint:', error);
    return 'unknown';
  }
}

export function clearDeviceInfoCache(): void {
  cachedDeviceInfo = null;
  cachedFingerprint = null;
}
