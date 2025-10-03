import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Analytics } from '@/lib/analytics';

export default function PrivacyControlsScreen() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
    Analytics.enabled
  );
  const [crashReportingEnabled, setCrashReportingEnabled] =
    useState<boolean>(true);

  const handleAnalyticsToggle = (value: boolean) => {
    setAnalyticsEnabled(value);
    Analytics.track('privacy_setting_changed', {
      setting: 'analytics',
      enabled: value,
    });
  };

  const handleCrashReportingToggle = (value: boolean) => {
    setCrashReportingEnabled(value);
    Analytics.track('privacy_setting_changed', {
      setting: 'crash_reporting',
      enabled: value,
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy Controls',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#ffffff',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <Text style={styles.sectionDescription}>
            Control what data LinguaMate collects to improve your experience.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics</Text>
              <Text style={styles.settingDescription}>
                Anonymous usage metrics to improve UX
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={handleAnalyticsToggle}
              trackColor={{ false: '#3f3f46', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Crash Reporting</Text>
              <Text style={styles.settingDescription}>
                Help us fix bugs by sending crash reports
              </Text>
            </View>
            <Switch
              value={crashReportingEnabled}
              onValueChange={handleCrashReportingToggle}
              trackColor={{ false: '#3f3f46', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Microphone</Text>
          <Text style={styles.sectionDescription}>
            Audio from speech-to-text practice is processed in real-time and not
            stored unless you explicitly save practice clips.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.sectionDescription}>
            Practice clips you save remain on your device unless you export or
            delete them. No content of your translations is included in crash
            logs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionDescription}>
            For data deletion or export requests, email privacy@linguamate.ai
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#71717a',
  },
});
