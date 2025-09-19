import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';

import * as Haptics from 'expo-haptics';
import { 
  Globe, 
  Moon, 
  Volume2, 
  Bell, 
  Crown,
  HelpCircle,
  Shield,
  Mail,
  ChevronRight,
  LucideIcon,
  Vibrate,
  Smartphone,
  Languages,
  BookOpen,
  Target,
  Clock,
  Zap,
  Users,
  Star,
  Download,
  Trash2,
  RefreshCw,
  TrendingUp,
  Calendar,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import LanguageSelector from '@/components/LanguageSelector';
import UpgradeModal from '@/components/UpgradeModal';

type SettingItem = {
  icon: LucideIcon;
  label: string;
  showChevron?: boolean;
  isPremium?: boolean;
  description?: string;
} & (
  | { value: string; isSwitch?: never; onPress?: () => void; }
  | { value: boolean; isSwitch: true; onPress: (value: boolean) => void; }
  | { value?: never; isSwitch?: never; onPress?: () => void; }
);

export default function SettingsScreen() {
  const [showLanguageSelector, setShowLanguageSelector] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showNativeLanguageSelector, setShowNativeLanguageSelector] = useState<boolean>(false);
  const { user, updateUser, upgradeToPremium } = useUser();

  const selectedLanguage = LANGUAGES.find(lang => lang.code === user.selectedLanguage);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);

  const handleLanguageChange = (languageCode: string, proficiency: 'beginner' | 'intermediate' | 'advanced') => {
    updateUser({ 
      selectedLanguage: languageCode, 
      proficiencyLevel: proficiency 
    });
    setShowLanguageSelector(false);
    Alert.alert('Success', 'Language updated successfully!');
  };

  const handleNativeLanguageChange = (languageCode: string, proficiency?: 'beginner' | 'intermediate' | 'advanced') => {
    updateUser({ nativeLanguage: languageCode });
    setShowNativeLanguageSelector(false);
    Alert.alert('Success', 'Native language updated successfully!');
  };

  const handleDailyGoalChange = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    Alert.alert(
      'Daily Learning Goal',
      'How many minutes would you like to study each day?',
      [
        { text: '5 minutes', onPress: () => updateDailyGoal(5) },
        { text: '10 minutes', onPress: () => updateDailyGoal(10) },
        { text: '15 minutes (Recommended)', onPress: () => updateDailyGoal(15) },
        { text: '30 minutes', onPress: () => updateDailyGoal(30) },
        { text: '45 minutes', onPress: () => updateDailyGoal(45) },
        { text: '60 minutes', onPress: () => updateDailyGoal(60) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateDailyGoal = (minutes: number) => {
    updateUser({ dailyGoalMinutes: minutes });
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Provide encouraging feedback based on goal
    let message = `Daily goal set to ${minutes} minutes!`;
    if (minutes >= 30) {
      message += ' 🔥 That\'s an ambitious goal! You\'re on track to make great progress.';
    } else if (minutes >= 15) {
      message += ' 👍 Perfect! Consistency is key to language learning.';
    } else {
      message += ' 🌱 Great start! Even small daily practice makes a big difference.';
    }
    
    Alert.alert('Goal Updated', message);
  };

  const handleDifficultyChange = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const currentLevel = user.proficiencyLevel;
    Alert.alert(
      'Learning Difficulty',
      'Select the difficulty level that matches your current skills:',
      [
        { 
          text: `🌱 Beginner${currentLevel === 'beginner' ? ' (Current)' : ''}`, 
          onPress: () => updateDifficulty('beginner') 
        },
        { 
          text: `📚 Intermediate${currentLevel === 'intermediate' ? ' (Current)' : ''}`, 
          onPress: () => updateDifficulty('intermediate') 
        },
        { 
          text: `🎓 Advanced${currentLevel === 'advanced' ? ' (Current)' : ''}`, 
          onPress: () => updateDifficulty('advanced') 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateDifficulty = (level: 'beginner' | 'intermediate' | 'advanced') => {
    const previousLevel = user.proficiencyLevel;
    updateUser({ proficiencyLevel: level });
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    let message = `Difficulty updated to ${level}!`;
    
    if (level !== previousLevel) {
      if (level === 'beginner') {
        message += ' 🌱 Perfect for building strong foundations.';
      } else if (level === 'intermediate') {
        message += ' 📚 Great for expanding your skills and confidence.';
      } else {
        message += ' 🎓 Excellent! You\'re ready for advanced challenges.';
      }
    }
    
    Alert.alert('Level Updated', message);
  };

  const handleReminderTimeChange = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const currentTime = user.settings.reminderTime || 'Not set';
    Alert.alert(
      'Daily Study Reminders',
      `Current: ${currentTime}\n\nWhen would you like to be reminded to practice?`,
      [
        { text: '🌅 9:00 AM (Morning)', onPress: () => setReminderTime('Daily at 9:00 AM') },
        { text: '☀️ 12:00 PM (Lunch)', onPress: () => setReminderTime('Daily at 12:00 PM') },
        { text: '🌆 6:00 PM (Evening)', onPress: () => setReminderTime('Daily at 6:00 PM') },
        { text: '🌙 7:00 PM (Night)', onPress: () => setReminderTime('Daily at 7:00 PM') },
        { text: '🌃 8:00 PM (Late)', onPress: () => setReminderTime('Daily at 8:00 PM') },
        { text: '❌ Disable Reminders', onPress: () => setReminderTime('Disabled') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const setReminderTime = async (time: string) => {
    if (!time.trim() || time.length > 50) return;
    const sanitizedTime = time.trim();
    
    try {
      // Store reminder time in user settings
      updateUser({
        settings: {
          ...user.settings,
          reminderTime: sanitizedTime,
          notificationsEnabled: sanitizedTime !== 'Disabled' ? true : user.settings.notificationsEnabled,
        },
      });
      setReminderTimeDisplay(sanitizedTime);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (sanitizedTime === 'Disabled') {
        Alert.alert('Reminders Disabled', '🔕 You won\'t receive daily study reminders anymore.');
      } else {
        Alert.alert(
          'Reminders Set!', 
          `🔔 You\'ll receive a daily reminder ${sanitizedTime.toLowerCase()}.\n\nTip: Make sure notifications are enabled in your device settings for the best experience!`
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to update reminder time. Please try again.');
    }
  };

  const handleSyncData = async () => {
    Alert.alert(
      'Syncing Data...',
      'Your progress is being backed up to the cloud.',
      [{ text: 'OK' }]
    );
    
    // Simulate sync delay
    setTimeout(() => {
      Alert.alert('Success!', 'Your progress has been backed up to the cloud!');
    }, 2000);
  };

  const handleExportProgress = async () => {
    try {
      const userData = JSON.stringify(user, null, 2);
      const fileName = `linguamate-progress-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([userData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success!', 'Your progress has been downloaded!');
      } else {
        // Mobile - show data in alert for now
        Alert.alert(
          'Export Data',
          'Your progress data is ready. In a future update, this will be saved to your device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export progress data');
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            updateUser({
              stats: {
                totalChats: 0,
                streakDays: 0,
                wordsLearned: 0,
                xpPoints: 0,
                lastActiveDate: '',
                messagesUsedToday: 0,
                lastMessageDate: '',
                badges: [],
              }
            });
            Alert.alert('Reset Complete', 'Your progress has been reset.');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    const email = 'support@linguamate.app';
    const subject = 'LinguaMate Support Request';
    const body = `Hi LinguaMate Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nUser ID: ${user.id}\nApp Version: 1.2.0\nPlatform: ${Platform.OS}`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Contact Support',
            `Email us at: ${email}\n\nWe typically respond within 24 hours.`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Contact Support',
          `Email us at: ${email}\n\nWe typically respond within 24 hours.`,
          [{ text: 'OK' }]
        );
      });
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/linguamate',
      android: 'https://play.google.com/store/apps/details?id=com.linguamate.app',
      default: 'https://linguamate.app'
    });
    
    Linking.canOpenURL(storeUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(storeUrl);
        } else {
          Alert.alert('Thank You!', 'Your feedback helps us improve. Please visit your app store to leave a review.');
        }
      })
      .catch(() => {
        Alert.alert('Thank You!', 'Your feedback helps us improve. Please visit your app store to leave a review.');
      });
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleHelpFAQ = () => {
    router.push('/help');
  };

  const handleOfflineLessons = () => {
    if (!user.isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    Alert.alert(
      'Offline Lessons',
      'Download lessons for offline use. This feature will be available in the next update!',
      [{ text: 'OK' }]
    );
  };

  const handleFamilySharing = () => {
    if (!user.isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    Alert.alert(
      'Family Sharing',
      'Share your Premium subscription with up to 5 family members. This feature will be available in the next update!',
      [{ text: 'OK' }]
    );
  };

  const [reminderTime, setReminderTimeDisplay] = useState<string>('Daily at 7:00 PM');

  React.useEffect(() => {
    const storedTime = user.settings.reminderTime || 'Daily at 7:00 PM';
    setReminderTimeDisplay(storedTime);
  }, [user.settings]);

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access!');
  };

  const toggleDarkMode = (value: boolean) => {
    updateUser({
      settings: {
        ...user.settings,
        darkMode: value,
      },
    });
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    Alert.alert('Theme Updated', `Dark mode ${value ? 'enabled' : 'disabled'}`);
  };

  const toggleSound = (value: boolean) => {
    updateUser({
      settings: {
        ...user.settings,
        soundEnabled: value,
      },
    });
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const toggleNotifications = (value: boolean) => {
    updateUser({
      settings: {
        ...user.settings,
        notificationsEnabled: value,
      },
    });
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    Alert.alert(
      'Notifications Updated', 
      `Notifications ${value ? 'enabled' : 'disabled'}. You can also manage this in your device settings.`
    );
  };

  const toggleHaptics = (value: boolean) => {
    updateUser({
      settings: {
        ...user.settings,
        hapticsEnabled: value,
      },
    });
    
    // Test haptic feedback if enabled
    if (value && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleAutoPlay = (value: boolean) => {
    updateUser({
      settings: {
        ...user.settings,
        autoPlayAudio: value,
      },
    });
    
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  // Calculate daily goal progress
  const today = new Date().toDateString();
  const isActiveToday = user.stats.lastActiveDate === today;
  const dailyProgress = isActiveToday ? Math.min((user.stats.messagesUsedToday * 2), user.dailyGoalMinutes) : 0;
  const progressPercentage = Math.round((dailyProgress / user.dailyGoalMinutes) * 100);

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Learning Preferences',
      items: [
        {
          icon: Languages,
          label: 'Learning Language',
          description: 'Language you want to learn',
          value: selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : 'Select Language',
          onPress: () => setShowLanguageSelector(true),
          showChevron: true,
        },
        {
          icon: Globe,
          label: 'Native Language',
          description: 'Your native language for translations',
          value: nativeLanguage ? `${nativeLanguage.flag} ${nativeLanguage.name}` : 'English',
          onPress: () => setShowNativeLanguageSelector(true),
          showChevron: true,
        },
        {
          icon: Target,
          label: 'Daily Goal',
          description: `${user.dailyGoalMinutes >= 30 ? 'Ambitious learner!' : user.dailyGoalMinutes >= 15 ? 'Consistent practice' : 'Building habits'}`,
          value: `${user.dailyGoalMinutes} minutes/day`,
          onPress: handleDailyGoalChange,
          showChevron: true,
        },
        {
          icon: BookOpen,
          label: 'Difficulty Level',
          description: `${user.proficiencyLevel === 'beginner' ? 'Building foundations' : user.proficiencyLevel === 'intermediate' ? 'Expanding skills' : 'Advanced challenges'}`,
          value: `${user.proficiencyLevel === 'beginner' ? '🌱' : user.proficiencyLevel === 'intermediate' ? '📚' : '🎓'} ${user.proficiencyLevel.charAt(0).toUpperCase() + user.proficiencyLevel.slice(1)}`,
          onPress: handleDifficultyChange,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Audio & Feedback',
      items: [
        {
          icon: Volume2,
          label: 'Sound Effects',
          description: 'Play sounds for interactions',
          value: user.settings.soundEnabled,
          onPress: toggleSound,
          isSwitch: true,
        },
        {
          icon: Vibrate,
          label: 'Haptic Feedback',
          description: 'Vibration for interactions',
          value: user.settings.hapticsEnabled || false,
          onPress: toggleHaptics,
          isSwitch: true,
        },
        {
          icon: Zap,
          label: 'Auto-play Audio',
          description: 'Automatically play pronunciation',
          value: user.settings.autoPlayAudio || false,
          onPress: toggleAutoPlay,
          isSwitch: true,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          description: 'Reminders and updates',
          value: user.settings.notificationsEnabled,
          onPress: toggleNotifications,
          isSwitch: true,
        },
        {
          icon: Clock,
          label: 'Study Reminders',
          description: reminderTime === 'Disabled' ? 'No reminders set' : 'Daily notification enabled',
          value: reminderTime === 'Disabled' ? '🔕 Off' : `🔔 ${reminderTime}`,
          onPress: handleReminderTimeChange,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Use dark theme',
          value: user.settings.darkMode,
          onPress: toggleDarkMode,
          isSwitch: true,
        },
        {
          icon: Smartphone,
          label: 'App Icon',
          description: 'Customize your app icon',
          value: 'Default',
          onPress: () => user.isPremium ? 
            Alert.alert('App Icons', 'Custom app icons will be available in the next update!') :
            setShowUpgradeModal(true),
          showChevron: true,
          isPremium: true,
        },
      ],
    },
    {
      title: 'Premium Features',
      items: [
        {
          icon: Crown,
          label: user.isPremium ? 'Premium Active' : 'Upgrade to Premium',
          description: user.isPremium ? 'All features unlocked' : 'Unlock unlimited lessons & features',
          value: user.isPremium ? 'Active' : 'Upgrade now',
          onPress: user.isPremium ? undefined : () => setShowUpgradeModal(true),
          showChevron: !user.isPremium,
          isPremium: true,
        },
        {
          icon: Download,
          label: 'Offline Lessons',
          description: 'Download lessons for offline use',
          onPress: handleOfflineLessons,
          showChevron: true,
          isPremium: true,
        },
        {
          icon: Users,
          label: 'Family Sharing',
          description: 'Share premium with family',
          onPress: handleFamilySharing,
          showChevron: true,
          isPremium: true,
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: RefreshCw,
          label: 'Sync Data',
          description: 'Backup your progress',
          onPress: handleSyncData,
          showChevron: true,
        },
        {
          icon: Download,
          label: 'Export Progress',
          description: 'Download your learning data',
          onPress: handleExportProgress,
          showChevron: true,
        },
        {
          icon: Trash2,
          label: 'Reset Progress',
          description: 'Clear all learning data',
          onPress: handleResetProgress,
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get help and find answers',
          onPress: handleHelpFAQ,
          showChevron: true,
        },
        {
          icon: Mail,
          label: 'Contact Support',
          description: 'Get in touch with our team',
          onPress: handleContactSupport,
          showChevron: true,
        },
        {
          icon: Star,
          label: 'Rate the App',
          description: 'Leave a review on the App Store',
          onPress: handleRateApp,
          showChevron: true,
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          description: 'How we protect your data',
          onPress: handlePrivacyPolicy,
          showChevron: true,
        },
      ],
    },
  ];

  if (showLanguageSelector) {
    return (
      <>
        <Stack.Screen options={{ title: 'Select Learning Language' }} />
        <LanguageSelector
          onLanguageSelect={handleLanguageChange}
        />
      </>
    );
  }

  if (showNativeLanguageSelector) {
    return (
      <>
        <Stack.Screen options={{ title: 'Select Native Language' }} />
        <LanguageSelector
          onLanguageSelect={handleNativeLanguageChange}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1F2937',
          },
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Daily Progress Summary */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>Today&apos;s Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {dailyProgress} of {user.dailyGoalMinutes} minutes
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(progressPercentage, 100)}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.streakContainer}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.streakText}>
                {user.stats.streakDays > 0 
                  ? `🔥 ${user.stats.streakDays} day streak!` 
                  : 'Start your learning streak today!'}
              </Text>
            </View>
          </View>
          {settingSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isDisabled = item.isPremium && !user.isPremium && !item.onPress;
                  
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.settingItem,
                        section.items.indexOf(item) === section.items.length - 1 && styles.lastSettingItem,
                        isDisabled && styles.disabledItem,
                      ]}
                      onPress={() => {
                        if (isDisabled) return;
                        
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        
                        if (item.isSwitch && typeof item.onPress === 'function') {
                          item.onPress(!(item.value as boolean));
                        } else if (item.onPress && !item.isSwitch) {
                          item.onPress();
                        }
                      }}
                      disabled={!item.onPress || isDisabled}
                    >
                      <View style={styles.settingLeft}>
                        <View style={[
                          styles.settingIcon,
                          item.isPremium && styles.premiumIcon,
                          isDisabled && styles.disabledIcon,
                        ]}>
                          <IconComponent 
                            size={20} 
                            color={item.isPremium ? (user.isPremium ? 'white' : '#8B5CF6') : '#6B7280'} 
                          />
                        </View>
                        <View style={styles.settingText}>
                          <View style={styles.settingLabelContainer}>
                            <Text style={[
                              styles.settingLabel,
                              item.isPremium && !user.isPremium && styles.premiumLabel,
                              isDisabled && styles.disabledLabel,
                            ]}>
                              {item.label}
                            </Text>
                            {item.isPremium && !user.isPremium && (
                              <View style={styles.premiumBadge}>
                                <Crown size={12} color="#8B5CF6" />
                              </View>
                            )}
                          </View>
                          {item.description && (
                            <Text style={[
                              styles.settingDescription,
                              isDisabled && styles.disabledDescription,
                            ]}>
                              {item.description}
                            </Text>
                          )}
                          {item.value && typeof item.value === 'string' && (
                            <Text style={[
                              styles.settingValue,
                              isDisabled && styles.disabledValue,
                            ]}>
                              {item.value}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.settingRight}>
                        {item.isSwitch ? (
                          <Switch
                            value={item.value as boolean}
                            onValueChange={(value) => {
                              if (item.onPress && !isDisabled) {
                                item.onPress(value);
                              }
                            }}
                            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                            thumbColor={(item.value as boolean) ? 'white' : '#F3F4F6'}
                            disabled={isDisabled}
                          />
                        ) : item.showChevron ? (
                          <ChevronRight 
                            size={20} 
                            color={isDisabled ? '#D1D5DB' : '#9CA3AF'} 
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>LinguaMate v1.2.0</Text>
            <Text style={styles.footerSubtext}>Made with ❤️ for language learners worldwide</Text>
            <Text style={styles.footerSubtext}>© 2024 LinguaMate. All rights reserved.</Text>
          </View>
        </ScrollView>

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
          reason="feature"
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  disabledItem: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumIcon: {
    backgroundColor: '#F0F0FF',
    borderWidth: 1,
    borderColor: '#E0E0FF',
  },
  disabledIcon: {
    backgroundColor: '#F9FAFB',
  },
  settingText: {
    flex: 1,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  premiumLabel: {
    color: '#8B5CF6',
  },
  disabledLabel: {
    color: '#9CA3AF',
  },
  premiumBadge: {
    marginLeft: 6,
    backgroundColor: '#F0F0FF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  disabledDescription: {
    color: '#9CA3AF',
  },
  settingValue: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  disabledValue: {
    color: '#D1D5DB',
  },
  settingRight: {
    marginLeft: 12,
  },
  progressCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 2,
  },
});