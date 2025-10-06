import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNotifications, notificationTemplates } from '@/hooks/useNotifications';

/**
 * Example: Notifications Setup
 * 
 * Demonstrates daily reminders, streak notifications, and more
 */
export function NotificationsExample() {
  const {
    requestPermissions,
    scheduleDailyReminder,
    scheduleStreakReminder,
    sendImmediateNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    expoPushToken,
  } = useNotifications();

  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    checkPermissions();
    updateScheduledCount();
  }, []);

  const checkPermissions = async () => {
    const granted = await requestPermissions();
    setHasPermission(granted);
  };

  const updateScheduledCount = async () => {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const handleScheduleDailyReminder = async () => {
    try {
      await scheduleDailyReminder(notificationTemplates.dailyReminder(9));
      alert('Daily reminder scheduled for 9:00 AM!');
      await updateScheduledCount();
    } catch (error) {
      alert('Failed to schedule notification');
    }
  };

  const handleScheduleStreakReminder = async () => {
    try {
      await scheduleStreakReminder(20, 0); // 8:00 PM
      alert('Streak reminder scheduled for 8:00 PM!');
      await updateScheduledCount();
    } catch (error) {
      alert('Failed to schedule notification');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await sendImmediateNotification({
        title: '🧪 Test Notification',
        body: 'This is a test notification from LinguaMate!',
      });
      alert('Test notification sent!');
    } catch (error) {
      alert('Failed to send notification');
    }
  };

  const handleCancelAll = async () => {
    try {
      await cancelAllNotifications();
      alert('All notifications cancelled!');
      await updateScheduledCount();
    } catch (error) {
      alert('Failed to cancel notifications');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Notifications</Text>

      {/* Permission Status */}
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Permission Status:</Text>
        <Text style={[styles.statusValue, hasPermission ? styles.granted : styles.denied]}>
          {hasPermission ? '✓ Granted' : '✗ Not Granted'}
        </Text>
      </View>

      {/* Scheduled Count */}
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Scheduled Notifications:</Text>
        <Text style={styles.statusValue}>{scheduledCount}</Text>
      </View>

      {/* Push Token */}
      {expoPushToken && (
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Push Token:</Text>
          <Text style={styles.tokenText} numberOfLines={1}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleScheduleDailyReminder}
          disabled={!hasPermission}
        >
          <Text style={styles.buttonText}>📅 Schedule Daily Reminder (9 AM)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleScheduleStreakReminder}
          disabled={!hasPermission}
        >
          <Text style={styles.buttonText}>🔥 Schedule Streak Reminder (8 PM)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSendTestNotification}
          disabled={!hasPermission}
        >
          <Text style={styles.buttonText}>🧪 Send Test Notification Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleCancelAll}
        >
          <Text style={styles.buttonText}>🗑️ Cancel All Notifications</Text>
        </TouchableOpacity>

        {!hasPermission && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={checkPermissions}
          >
            <Text style={styles.buttonText}>🔓 Request Permissions</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Templates Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Templates</Text>
        <Text style={styles.infoText}>• Daily Reminder - Morning practice nudge</Text>
        <Text style={styles.infoText}>• Streak Maintenance - Evening reminder</Text>
        <Text style={styles.infoText}>• Lesson Complete - Celebration</Text>
        <Text style={styles.infoText}>• Milestone - Achievement unlock</Text>
        <Text style={styles.infoText}>• Weekly Progress - Summary</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  granted: {
    color: '#34C759',
  },
  denied: {
    color: '#FF3B30',
  },
  tokenText: {
    fontSize: 10,
    color: '#666',
    flex: 1,
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
