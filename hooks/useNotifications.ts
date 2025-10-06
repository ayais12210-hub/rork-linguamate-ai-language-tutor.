import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Notifications Hook
 * 
 * Provides easy-to-use notification functionality for:
 * - Daily practice reminders
 * - Streak maintenance
 * - Lesson completion celebrations
 * - Learning milestones
 * 
 * Features:
 * - Permission handling
 * - Local notifications
 * - Push notifications (with token)
 * - Notification interaction handling
 * - Timezone-aware scheduling
 * 
 * Usage:
 * ```tsx
 * const { scheduleDailyReminder, cancelAllNotifications } = useNotifications();
 * 
 * await scheduleDailyReminder({
 *   hour: 9,
 *   minute: 0,
 *   title: 'Time to practice!',
 *   body: "Don't break your streak!"
 * });
 * ```
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
}

export interface DailyReminderOptions extends NotificationOptions {
  hour: number; // 0-23
  minute: number; // 0-59
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications and get token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to screen - implement with your router
        // Navigation logic would go here
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  };

  /**
   * Schedule a one-time notification
   */
  const scheduleNotification = async (
    options: NotificationOptions,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: options.sound !== false,
      },
      trigger,
    });

    console.log('[Notifications] Scheduled notification:', id);
    return id;
  };

  /**
   * Schedule daily reminder at specific time
   */
  const scheduleDailyReminder = async (options: DailyReminderOptions): Promise<string> => {
    return scheduleNotification(
      {
        title: options.title,
        body: options.body,
        data: options.data,
        sound: options.sound,
      },
      {
        hour: options.hour,
        minute: options.minute,
        repeats: true,
      }
    );
  };

  /**
   * Schedule streak reminder (fires if user hasn't practiced today)
   */
  const scheduleStreakReminder = async (hour: number = 20, minute: number = 0): Promise<string> => {
    return scheduleDailyReminder({
      hour,
      minute,
      title: '🔥 Keep your streak alive!',
      body: "You haven't practiced today. Just 5 minutes can keep your streak going!",
      data: { type: 'streak', screen: 'lessons' },
    });
  };

  /**
   * Schedule lesson reminder
   */
  const scheduleLessonReminder = async (
    lessonName: string,
    delayMinutes: number = 60
  ): Promise<string> => {
    return scheduleNotification(
      {
        title: '📚 Time to continue learning!',
        body: `Your ${lessonName} lesson is waiting for you.`,
        data: { type: 'lesson', screen: 'lessons' },
      },
      {
        seconds: delayMinutes * 60,
      }
    );
  };

  /**
   * Send immediate notification
   */
  const sendImmediateNotification = async (options: NotificationOptions): Promise<string> => {
    return scheduleNotification(options, null);
  };

  /**
   * Cancel specific notification
   */
  const cancelNotification = async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  };

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all notifications');
  };

  /**
   * Get all scheduled notifications
   */
  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync();
  };

  /**
   * Clear notification badge
   */
  const clearBadge = async (): Promise<void> => {
    await Notifications.setBadgeCountAsync(0);
  };

  return {
    expoPushToken,
    notification,
    requestPermissions,
    scheduleNotification,
    scheduleDailyReminder,
    scheduleStreakReminder,
    scheduleLessonReminder,
    sendImmediateNotification,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    clearBadge,
  };
}

/**
 * Register for push notifications and get Expo Push Token
 */
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Failed to get push token, permission not granted');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('[Notifications] Expo push token:', token);
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
    }
  } else {
    console.log('[Notifications] Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Helper to create notification content for different scenarios
 */
export const notificationTemplates = {
  dailyReminder: (hour: number = 9): DailyReminderOptions => ({
    hour,
    minute: 0,
    title: '☀️ Good morning!',
    body: 'Start your day with a quick lesson. Practice makes perfect!',
    data: { type: 'daily', screen: 'lessons' },
  }),

  streakMaintenance: (days: number): NotificationOptions => ({
    title: `🔥 ${days} day streak!`,
    body: "Don't break it now! Complete today's lesson.",
    data: { type: 'streak', days, screen: 'lessons' },
  }),

  lessonComplete: (lessonName: string, score: number): NotificationOptions => ({
    title: '🎉 Lesson Complete!',
    body: `Great job on ${lessonName}! You scored ${score}%.`,
    data: { type: 'completion', lessonName, score },
  }),

  milestone: (milestone: string): NotificationOptions => ({
    title: '🏆 Achievement Unlocked!',
    body: `Congratulations! You've reached ${milestone}!`,
    data: { type: 'milestone', milestone },
  }),

  weeklyProgress: (lessonsCompleted: number): NotificationOptions => ({
    title: '📊 Weekly Progress',
    body: `You completed ${lessonsCompleted} lessons this week. Keep it up!`,
    data: { type: 'progress', lessonsCompleted },
  }),
};
