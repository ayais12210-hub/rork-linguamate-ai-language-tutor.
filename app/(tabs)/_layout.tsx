import { Tabs, useRouter, usePathname } from 'expo-router';
import { MessageCircle, User, BookOpen, Layers, GraduationCap, Settings } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import GooeyNav from '@/components/GooeyNav';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(() => [
    { label: 'Learn', href: '/learn' },
    { label: 'Lessons', href: '/lessons' },
    { label: 'Modules', href: '/modules' },
    { label: 'Chat', href: '/chat' },
    { label: 'Profile', href: '/profile' },
  ], []);

  const initialActiveIndex = useMemo(() => {
    const index = navItems.findIndex(item => pathname.startsWith(item.href));
    return index >= 0 ? index : 0;
  }, [pathname, navItems]);

  const handleNavPress = (index: number, href: string) => {
    router.push(href as any);
  };

  const SettingsButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={styles.settingsButton}
    >
      <Settings size={24} color="#6B7280" />
    </TouchableOpacity>
  );

  const GooeyNavHeader = () => (
    <View style={styles.gooeyNavContainer}>
      <GooeyNav
        items={navItems}
        initialActiveIndex={initialActiveIndex}
        onItemPress={handleNavPress}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1F2937',
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#FFFFFF',
        },
        headerTitle: () => <GooeyNavHeader />,
        headerRight: () => <SettingsButton />,
        tabBarStyle: {
          display: 'none',
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: 16,
  },
  gooeyNavContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
});