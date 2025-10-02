import { Tabs, useRouter } from 'expo-router';
import { MessageCircle, User, BookOpen, Layers, GraduationCap, Settings } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/hooks/user-store';

export default function TabLayout() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const isDark = user?.settings?.darkMode ?? false;
  const colors = useMemo(() => ({
    headerBg: isDark ? '#0B1220' : 'white',
    headerBorder: isDark ? '#1f2937' : '#E5E7EB',
    headerText: isDark ? '#F3F4F6' : '#1F2937',
    tabBg: isDark ? '#0B1220' : 'white',
    tabBorder: isDark ? '#1f2937' : '#E5E7EB',
    active: '#10B981',
    inactive: isDark ? '#9CA3AF' : '#9CA3AF',
    icon: isDark ? '#9CA3AF' : '#6B7280',
  }), [isDark]);

  const SettingsButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      style={styles.settingsButton}
      testID="open-settings"
    >
      <Settings size={24} color={colors.icon} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.headerText,
        },
        headerRight: () => <SettingsButton />,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingTop: 10,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerTitle: 'Learn',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          headerTitle: 'Lessons',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Modules',
          headerTitle: 'Advanced Modules',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          headerTitle: 'AI Language Coach',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="translator"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
      {/* Settings routes live under /(tabs)/settings but are not a visible tab */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: 16,
  },
});