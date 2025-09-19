import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './user-store';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  streakReminder: boolean;
  achievementAlerts: boolean;
  lessonReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: string;
  type: 'reminder' | 'streak' | 'achievement' | 'lesson';
  recurring: boolean;
}

const NOTIFICATION_SETTINGS_KEY = 'linguamate_notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'linguamate_scheduled_notifications';

const defaultSettings: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  reminderTime: '09:00',
  streakReminder: true,
  achievementAlerts: true,
  lessonReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useUser();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupNotifications();
      loadSettings();
      registerForPushNotifications();
    } else {
      setIsLoading(false);
    }

    return () => {
      if (Platform.OS !== 'web') {
        // Cleanup listeners if notifications were available
      }
    };
  }, []);

  useEffect(() => {
    if (settings.enabled && Platform.OS !== 'web') {
      scheduleNotifications();
    } else if (Platform.OS !== 'web') {
      cancelAllNotifications();
    }
  }, [settings, user]);

  const setupNotifications = async () => {
    if (Platform.OS === 'web') return;
    // Notifications not available in Expo Go - would need custom dev client
    console.log('Notifications require a custom development client');
  };

  const registerForPushNotifications = async (): Promise<string> => {
    if (Platform.OS === 'web') return 'web';
    // Notifications not available in Expo Go - would need custom dev client
    console.log('Push notifications require a custom development client');
    setPermissionStatus('unavailable');
    return 'unavailable';
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }

      const storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (storedNotifications) {
        setScheduledNotifications(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);
  };

  const scheduleNotifications = async () => {
    if (Platform.OS === 'web' || !settings.enabled) return;
    // Notifications not available in Expo Go - would need custom dev client
    console.log('Scheduled notifications require a custom development client');
    
    // Mock scheduled notifications for development
    const notifications: ScheduledNotification[] = [];
    
    if (settings.dailyReminder) {
      notifications.push({
        id: Date.now().toString(),
        title: "Daily Reminder",
        body: "Time to practice",
        scheduledTime: settings.reminderTime,
        type: 'reminder',
        recurring: true,
      });
    }
    
    if (settings.streakReminder && (user.stats?.streakDays || 0) > 0) {
      notifications.push({
        id: (Date.now() + 1).toString(),
        title: "Streak Reminder",
        body: "Keep your streak alive",
        scheduledTime: "20:00",
        type: 'streak',
        recurring: true,
      });
    }
    
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    setScheduledNotifications(notifications);
  };

  const sendInstantNotification = async (title: string, body: string, type: 'achievement' | 'lesson' | 'reminder' = 'reminder') => {
    if (Platform.OS === 'web' || !settings.enabled) return;

    if (type === 'achievement' && !settings.achievementAlerts) return;
    if (type === 'lesson' && !settings.lessonReminders) return;

    // Notifications not available in Expo Go - would need custom dev client
    console.log(`Mock notification: ${title} - ${body}`);
  };

  const scheduleCustomNotification = async (
    title: string,
    body: string,
    triggerDate: Date,
    recurring: boolean = false
  ) => {
    if (Platform.OS === 'web' || !settings.enabled) return null;

    // Notifications not available in Expo Go - would need custom dev client
    const id = Date.now().toString();
    
    const notification: ScheduledNotification = {
      id,
      title,
      body,
      scheduledTime: triggerDate.toISOString(),
      type: 'reminder',
      recurring,
    };

    const updated = [...scheduledNotifications, notification];
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));
    setScheduledNotifications(updated);

    return id;
  };

  const cancelNotification = async (notificationId: string) => {
    if (Platform.OS === 'web') return;
    
    // Mock cancellation for development
    const updated = scheduledNotifications.filter(n => n.id !== notificationId);
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));
    setScheduledNotifications(updated);
  };

  const cancelAllNotifications = async () => {
    if (Platform.OS === 'web') return;
    
    // Mock cancellation for development
    await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
    setScheduledNotifications([]);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNotificationResponse = (response: { notification: { request: { content: { data?: { type?: string } } } } }) => {
    const { notification } = response;
    const type = notification.request.content.data?.type;

    switch (type) {
      case 'achievement':
        // Navigate to achievements screen
        console.log('Navigate to achievements');
        break;
      case 'lesson':
        // Navigate to lessons screen
        console.log('Navigate to lessons');
        break;
      case 'streak':
        // Navigate to home or stats
        console.log('Navigate to stats');
        break;
      default:
        // Navigate to home
        console.log('Navigate to home');
    }
  };

  const testNotification = async () => {
    await sendInstantNotification(
      "Test Notification 🎉",
      "Notifications are working correctly!",
      'reminder'
    );
  };

  const getNotificationStatus = () => {
    if (Platform.OS === 'web') return 'Web platform - notifications not available';
    return permissionStatus === 'granted' 
      ? 'Notifications enabled' 
      : 'Notifications disabled - please enable in settings';
  };

  return {
    settings,
    scheduledNotifications,
    permissionStatus,
    isLoading,
    updateSettings,
    sendInstantNotification,
    scheduleCustomNotification,
    cancelNotification,
    cancelAllNotifications,
    testNotification,
    getNotificationStatus,
    registerForPushNotifications,
  };
};